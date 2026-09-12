import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import {
  corpConditionalScoreCreditProfile,
  corpScoreHostedCreditPayoutProfile,
  corpDefinitionIsMainPhasePassive,
  corpOperationCannotFundWithLastClick,
} from "../../runtime/corp-canonical-card-facts";
import { corpExactCurrentBasicLiquidCreditCandidate } from "../economy/economy-domain-signals";
import { immediateCorpLiquidCreditGain } from "../economy/economy-routes";

/** A free current score can dominate a basic credit's resource ordering.
 * Keep other funding routes and real current-window defense independent.
 */
export function corpBasicCreditsDominatedByCurrentScore(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  projects: readonly CorpScoreProjectSignal[],
): ReadonlySet<string> {
  if (input.playerView.run || input.playerView.own.clicks < 1) return new Set();
  const freeScores = input.legalActions.filter(
    (action) =>
      action.type === "score_agenda" &&
      action.side === "corp" &&
      action.expiresAtStateVersion === input.playerView.stateVersion &&
      action.costs.length === 0,
  );
  if (freeScores.length !== 1) return new Set();
  const score = freeScores[0]!;
  const project = projects.find(
    (project) =>
      project.phase === "score_agenda" &&
      project.feasible &&
      project.sameTurnCloseout &&
      !project.terminalScore &&
      project.agendaInstanceId === score.source &&
      project.actionIds?.includes(score.actionId),
  );
  if (!project?.agendaDefinitionId) return new Set();
  const basicCreditIds = () =>
    new Set(
      candidates
        .filter((candidate) =>
          corpExactCurrentBasicLiquidCreditCandidate(input, candidate),
        )
        .map((candidate) => candidate.actionId),
    );
  const payout = corpScoreHostedCreditPayoutProfile(project.agendaDefinitionId);
  if (payout && Math.min(payout.poolCredits, payout.payoutCredits) > 1) {
    // Scoring spends no click or cash and opens a strictly better next
    // single-click payout. The future payout gets its real LegalAction only
    // after the score; the existing Economy owner then revalidates it.
    return basicCreditIds();
  }
  const clicks = input.playerView.own.clicks;
  if (clicks !== 1 && clicks !== 2) return new Set();
  const profile = corpConditionalScoreCreditProfile(project.agendaDefinitionId);
  if (!profile || input.playerView.own.credits + clicks >= profile.threshold)
    return new Set();
  if (clicks === 2 && !onlyBasicFundingAfterFirstCredit(input, score.source))
    return new Set();
  // A currently available zero-click payout could still cross the threshold
  // after the basic credit. Do not claim ordering dominance in that case.
  if (
    candidates.some(
      (candidate) =>
        immediateCorpLiquidCreditGain(candidate) > 0 &&
        input.legalActions.some(
          (action) =>
            action.actionId === candidate.actionId &&
            action.costs.every((cost) => (cost.clicks ?? 0) === 0),
        ),
    )
  )
    return new Set();
  return basicCreditIds();
}

function onlyBasicFundingAfterFirstCredit(
  input: AiDecisionInput,
  scoringAgendaId: string | undefined,
): boolean {
  // After the first basic credit only one click remains. Do not extrapolate
  // this proof to longer routes, playable hand cards, another installed agenda,
  // score-area abilities, or latent rez/activation income. An unknown canonical
  // shape simply cannot establish this optional dominance proof.
  if (
    input.playerView.own.gripOrHq.some((card) =>
      card.type === "agenda"
        ? !(
            typeof card.advancementRequirement === "number" &&
            card.advancementRequirement > 1 &&
            corpDefinitionIsMainPhasePassive(card.definitionId, "unreachable")
          )
        : card.type === "operation"
          ? !corpOperationCannotFundWithLastClick(card.definitionId)
          : card.type !== "ice" ||
            !corpDefinitionIsMainPhasePassive(card.definitionId),
    )
  )
    return false;
  if (
    input.playerView.own.scoreArea.some(
      (card) => !corpDefinitionIsMainPhasePassive(card.definitionId, "past"),
    )
  )
    return false;
  return input.playerView.servers
    .filter((server) => server.id !== "archives")
    .every((server) =>
      [...server.ice, ...server.root].every(
        (card) =>
          card.instanceId === scoringAgendaId ||
          (card.type !== "agenda" &&
            corpDefinitionIsMainPhasePassive(card.definitionId)),
      ),
    );
}

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
