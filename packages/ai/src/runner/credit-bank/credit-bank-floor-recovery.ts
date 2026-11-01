import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type {
  RunnerEconomyPosture,
  RunnerRunTargetEvaluation,
} from "../../runner-run-target-evaluation";
import type { RunnerHandDevelopmentEvaluation } from "../hand-development/hand-development-evaluation";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { runnerDamageThreatAssessment } from "../../runner-damage-threat-assessment";

/** A conditional investment window, never current liquid funding or a future
 * action ID. The bank owner revalidates after every real action. */
export function creditBankFloorRecoveryWindow(params: {
  input: AiDecisionInputWithDeckCapabilities;
  candidates: readonly ActionSemanticCandidate[];
  economy: RunnerEconomyPosture;
  runTargets: readonly RunnerRunTargetEvaluation[];
  handDevelopment: readonly RunnerHandDevelopmentEvaluation[];
  minimumHandBuffer: number;
  loadActionIds: readonly string[];
}) {
  const { input, economy } = params;
  const view = input.playerView;
  if (
    view.own.tags > 0 ||
    view.own.credits >= economy.minimumCreditFloor ||
    view.own.gripOrHq.length < params.minimumHandBuffer ||
    view.own.agendaPoints >= view.agendaPointsToWin - 2 ||
    view.opponent.agendaPoints >= view.agendaPointsToWin - 2 ||
    view.own.stackOrRdCount < 2 ||
    view.opponent.deckCount < 2 ||
    economy.creditReservePolicy?.remoteScoreThreat !== "none" ||
    economy.creditReservePolicy.emergencyReserve > 0 ||
    params.runTargets.some(
      (target) =>
        target.scoreThreat ||
        (target.score > 0 && target.recommendation === "run_now"),
    ) ||
    params.handDevelopment.some((target) => target.currentNeed === "acute")
  )
    return undefined;
  const risk = runnerDamageThreatAssessment(input).flatlineRisk.level;
  if (risk === "confirmed" || risk === "critical") return undefined;
  const income = params.candidates.find((candidate) => {
    const action = input.legalActions.find(
      (a) => a.actionId === candidate.actionId,
    );
    const quote = candidate.economyProjection;
    return (
      action?.type === "gain_credit" &&
      action.expiresAtStateVersion === view.stateVersion &&
      quote?.kind === "immediate_liquid" &&
      quote.reliability === "guaranteed" &&
      quote.repeatable === true &&
      quote.creditRestriction === "general" &&
      quote.creditCost === 0 &&
      quote.clickCost === 1 &&
      quote.netLiquidCreditGain === 1 &&
      quote.cardsDrawn === 0 &&
      quote.cardsConsumed === 0
    );
  });
  const load = input.legalActions.find(
    (action) =>
      params.loadActionIds.includes(action.actionId) &&
      action.expiresAtStateVersion === view.stateVersion &&
      action.costs.length === 1 &&
      action.costs[0]?.clicks === 1 &&
      (action.costs[0].credits ?? 0) === 0,
  );
  if (!income || !load) return undefined;
  const remainingCreditClicks = view.own.clicks - 1;
  const projectedEndTurnCredits = view.own.credits + remainingCreditClicks;
  if (
    remainingCreditClicks < 1 ||
    projectedEndTurnCredits < economy.minimumCreditFloor
  )
    return undefined;
  return { remainingCreditClicks, projectedEndTurnCredits };
}
