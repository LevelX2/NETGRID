import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import { compareExactProbabilities } from "../../runtime/corp-score-protection-assessment";
import { hasExactNonNegativeCostProfile } from "../../runtime/exact-action-cost-facts";
import { corpAgendaInstallHasCertifiedNearTermScoreHorizon } from "./score-project-signals";

/** A certified next-turn win can displace nonwinning HQ preparation. */
export function corpWinningScoreSiblingDominates(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  winning: CorpScoreProjectSignal,
  preparation: CorpScoreProjectSignal,
): boolean {
  const need = winning.protectionNeed;
  const protection = need?.baseline;
  const head =
    winning.actionIds?.length === 1
      ? candidates.find(
          (candidate) => candidate.actionId === winning.actionIds![0],
        )
      : undefined;
  return Boolean(
    winning.feasible &&
    preparation.feasible &&
    winning.terminalScore &&
    !preparation.terminalScore &&
    winning.phase === "install_agenda" &&
    preparation.phase === "install_agenda" &&
    !winning.sameTurnCloseout &&
    !preparation.sameTurnCloseout &&
    winning.serverId?.startsWith("remote_") &&
    winning.serverId === preparation.serverId &&
    winning.agendaInstanceId !== preparation.agendaInstanceId &&
    input.playerView.own.stackOrRdCount > 0 &&
    input.playerView.own.gripOrHq.some(
      (card) => card.known && card.instanceId === winning.agendaInstanceId,
    ) &&
    input.playerView.own.gripOrHq.some(
      (card) => card.known && card.instanceId === preparation.agendaInstanceId,
    ) &&
    head &&
    hasExactNonNegativeCostProfile(head) &&
    corpAgendaInstallHasCertifiedNearTermScoreHorizon(
      input,
      head,
      winning.serverId,
    ) &&
    need?.parentProjectId === winning.projectId &&
    need.targetServerId === winning.serverId &&
    need.observedAtStateVersion === input.playerView.stateVersion &&
    protection?.knowledge === "known" &&
    protection.fundedProtection &&
    protection.preservesScoreCreditReserve &&
    protection.preservesHardClickReserve &&
    protection.protection.runnerAccessSuccessProbability.numerator === 0 &&
    protection.protection.runnerAccessSuccessProbability.denominator > 0 &&
    protection.agendaPointsAfterDefense + winning.agendaPoints >=
      input.playerView.agendaPointsToWin,
  );
}

/** Compares already admitted HQ routes before preserving a prepared parent. */
export function corpShorterTerminalScoreRouteDominates(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  shorter: CorpScoreProjectSignal,
  longer: CorpScoreProjectSignal,
): boolean {
  const next = shorter.conversion;
  const previous = longer.conversion;
  if (
    !shorter.feasible ||
    !longer.feasible ||
    !shorter.terminalScore ||
    !longer.terminalScore ||
    shorter.phase !== "install_agenda" ||
    longer.phase !== "install_agenda" ||
    !shorter.serverId?.startsWith("remote_") ||
    shorter.serverId !== longer.serverId ||
    shorter.agendaInstanceId === longer.agendaInstanceId ||
    shorter.sameTurnCloseout ||
    longer.sameTurnCloseout ||
    !next ||
    !previous ||
    next.remainingAdvancementClicks >= previous.remainingAdvancementClicks ||
    next.remainingScoreCredits > previous.remainingScoreCredits ||
    next.runnerStealPoints > previous.runnerStealPoints ||
    (next.runnerStealIsMatchpoint && !previous.runnerStealIsMatchpoint)
  ) {
    return false;
  }
  const head = (project: CorpScoreProjectSignal) =>
    project.actionIds?.length === 1
      ? candidates.find(
          (candidate) => candidate.actionId === project.actionIds![0],
        )
      : undefined;
  const nextHead = head(shorter);
  const previousHead = head(longer);
  if (
    !nextHead ||
    !previousHead ||
    !hasExactNonNegativeCostProfile(nextHead) ||
    !hasExactNonNegativeCostProfile(previousHead) ||
    nextHead.costProfile.creditCost! > previousHead.costProfile.creditCost! ||
    nextHead.costProfile.clickCost !== previousHead.costProfile.clickCost ||
    !corpAgendaInstallHasCertifiedNearTermScoreHorizon(
      input,
      nextHead,
      shorter.serverId,
    ) ||
    !input.playerView.own.gripOrHq.some(
      (card) => card.instanceId === shorter.agendaInstanceId && card.known,
    ) ||
    !input.playerView.own.gripOrHq.some(
      (card) => card.instanceId === longer.agendaInstanceId && card.known,
    )
  ) {
    return false;
  }
  const nextBaseline = shorter.protectionNeed?.baseline;
  const previousBaseline = longer.protectionNeed?.baseline;
  if (
    nextBaseline?.knowledge === "known" &&
    previousBaseline?.knowledge === "known"
  ) {
    const risk = compareExactProbabilities(
      nextBaseline.protection.runnerAccessSuccessProbability,
      previousBaseline.protection.runnerAccessSuccessProbability,
    );
    return (
      risk !== undefined &&
      risk <= 0 &&
      nextBaseline.preservesScoreCreditReserve &&
      nextBaseline.minimumAdditionalCreditsToSatisfy === 0 &&
      nextBaseline.agendaPointsAfterDefense + shorter.agendaPoints >=
        input.playerView.agendaPointsToWin
    );
  }
  // The same already rezzed topology may remain unquantified. This comparison
  // does not certify its protection, nor admit a previously blocked route.
  const server = input.playerView.servers.find(
    (s) => s.id === shorter.serverId,
  );
  return (
    nextBaseline?.knowledge === "unknown" &&
    previousBaseline?.knowledge === "unknown" &&
    !next.runnerStealIsMatchpoint &&
    !previous.runnerStealIsMatchpoint &&
    server !== undefined &&
    server.ice.length > 0 &&
    server.ice.every((ice) => ice.rezzed === true) &&
    input.playerView.own.credits >=
      nextHead.costProfile.creditCost! + next.remainingScoreCredits
  );
}
