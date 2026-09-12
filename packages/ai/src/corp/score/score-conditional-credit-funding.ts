import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import { corpConditionalScoreCreditProfile } from "../../runtime/corp-canonical-card-facts";
import { corpExactCurrentBasicLiquidCreditCandidate } from "../economy/economy-domain-signals";

/** Keep a reachable score reward inside the existing Score -> Economy route. */
export function corpConditionalScoreCreditFunding(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  project: CorpScoreProjectSignal,
): CorpScoreProjectSignal {
  if (
    project.phase !== "score_agenda" ||
    project.terminalScore ||
    !project.feasible ||
    !project.agendaDefinitionId ||
    !project.agendaInstanceId
  )
    return project;
  const profile = corpConditionalScoreCreditProfile(project.agendaDefinitionId);
  if (!profile) return project;
  const gap = profile.threshold - input.playerView.own.credits;
  if (gap <= 0 || gap > input.playerView.own.clicks) return project;
  const score = input.legalActions.find(
    (action) =>
      project.actionIds?.includes(action.actionId) &&
      action.type === "score_agenda" &&
      action.side === "corp" &&
      action.source === project.agendaInstanceId &&
      action.expiresAtStateVersion === input.playerView.stateVersion &&
      action.costs.length === 0,
  );
  if (!score) return project;
  const funding = candidates.filter((candidate) =>
    corpExactCurrentBasicLiquidCreditCandidate(input, candidate),
  );
  if (funding.length !== 1) return project;
  return {
    ...project,
    fundingGap: gap,
    sameTurnFundingActionIds: [funding[0]!.actionId],
    sameTurnCloseout: true,
    evidenceCode: `corp_conditional_score_credit_funding:${profile.threshold}:${gap}`,
  };
}
