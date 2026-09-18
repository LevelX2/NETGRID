import type { AiDecisionInput } from "@netgrid/shared";
import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import { assessCorpTerminalAgendaDefense } from "../defense/corp-terminal-agenda-defense";
import { compareExactProbabilities } from "../../runtime/corp-score-protection-assessment";

/** Score owns the threatened agenda and its priority; Defense quotes the route. */
export function withCorpTerminalAgendaDefense(
  input: AiDecisionInput,
  project: CorpScoreProjectSignal,
  projects: readonly CorpScoreProjectSignal[],
): CorpScoreProjectSignal {
  if (
    input.playerView.phase === "run" ||
    !project.serverId ||
    !project.agendaInstanceId ||
    project.phase !== "advance_agenda" ||
    project.sameTurnCloseout ||
    projects.some(
      (other) =>
        other.agendaInstanceId === project.agendaInstanceId &&
        other.sameTurnCloseout &&
        other.feasible,
    )
  )
    return project;
  const agenda = input.playerView.servers
    .find((server) => server.id === project.serverId)
    ?.root.find((card) => card.instanceId === project.agendaInstanceId);
  if (
    !agenda?.known ||
    agenda.type !== "agenda" ||
    !Number.isSafeInteger(agenda.agendaPoints) ||
    input.playerView.opponent.agendaPoints + agenda.agendaPoints! <
      input.playerView.agendaPointsToWin
  )
    return project;
  const defense = assessCorpTerminalAgendaDefense(
    input,
    project.serverId,
    project.projectId,
  );
  if (
    !defense ||
    compareExactProbabilities(
      defense.best.protection.runnerAccessSuccessProbability,
      { numerator: 1, denominator: 1 },
    ) !== -1
  )
    return project;
  const advance = input.legalActions.find(
    (action) =>
      action.source === project.agendaInstanceId &&
      (project.actionIds === undefined ||
        project.actionIds.includes(action.actionId)) &&
      action.type === "advance_card" &&
      action.expiresAtStateVersion === input.playerView.stateVersion,
  );
  if (!advance) return project;
  const advanceCredits = advance.costs.reduce(
    (sum, cost) => sum + (cost.credits ?? 0),
    0,
  );
  const advanceClicks = advance.costs.reduce(
    (sum, cost) => sum + (cost.clicks ?? 0),
    0,
  );
  // Fund the defense first. Progress may use only the surplus once it can no
  // longer improve the selected survival probability this Runner window.
  const canFundAdvance =
    !defense.install &&
    input.playerView.own.clicks > advanceClicks &&
    defense.requiredCredits + advanceCredits - input.playerView.own.credits <=
      input.playerView.own.clicks - advanceClicks;
  const requiredCredits =
    defense.requiredCredits +
    (!defense.install &&
    (canFundAdvance ||
      input.playerView.own.credits >= defense.requiredCredits + advanceCredits)
      ? advanceCredits
      : 0);
  const fundingGap = Math.max(
    0,
    requiredCredits - input.playerView.own.credits,
  );
  return {
    ...project,
    terminalDefense: { ...defense, requiredCredits },
    protectionNeed: defense.need,
    fundingGap: defense.install ? 0 : fundingGap,
    feasible:
      !defense.install &&
      fundingGap === 0 &&
      input.playerView.own.credits - advanceCredits >= defense.requiredCredits,
    routeAssessment: "corp_terminal_agenda_defense",
    evidenceCode: `corp_terminal_agenda_defense:${project.serverId}:${defense.best.protection.runnerAccessSuccessProbability.numerator}/${defense.best.protection.runnerAccessSuccessProbability.denominator}`,
  };
}
