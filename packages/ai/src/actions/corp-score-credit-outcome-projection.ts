import {
  CORP_SCORE_CREDIT_OUTCOME_QUOTE_SCHEMA_VERSION,
  type LegalAction,
} from "@netgrid/shared";
import type {
  ActionEconomyProjection,
  ActionSemanticCandidate,
} from "../action-semantic-candidate-types";

export function corpScoreCreditOutcomeProjection(
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): ActionEconomyProjection | undefined {
  const payload = action.payload;
  if (payload?.corpScoreCreditOutcomeQuoteSchemaVersion === undefined)
    return undefined;
  const before = payload.corpScoreCreditOutcomeQuoteCreditsBefore;
  const after = payload.corpScoreCreditOutcomeQuoteCreditsAfter;
  const delta = payload.corpScoreCreditOutcomeQuoteNetCreditDelta;
  const exact =
    action.side === "corp" &&
    action.type === "score_agenda" &&
    candidate.actionId === action.actionId &&
    payload.corpScoreCreditOutcomeQuoteSchemaVersion ===
      CORP_SCORE_CREDIT_OUTCOME_QUOTE_SCHEMA_VERSION &&
    payload.corpScoreCreditOutcomeQuoteStateVersion ===
      candidate.stateVersion &&
    payload.corpScoreCreditOutcomeQuoteStateVersion ===
      action.expiresAtStateVersion &&
    payload.corpScoreCreditOutcomeQuoteSourceCardId === action.source &&
    payload.cardId === action.source &&
    typeof before === "number" &&
    Number.isSafeInteger(before) &&
    before >= 0 &&
    typeof after === "number" &&
    Number.isSafeInteger(after) &&
    after >= 0 &&
    typeof delta === "number" &&
    Number.isSafeInteger(delta) &&
    after - before === delta &&
    action.costs.every(
      (cost) => (cost.credits ?? 0) === 0 && (cost.clicks ?? 0) === 0,
    ) &&
    action.targetRequirements.length === 0 &&
    (action.choiceRequirements?.length ?? 0) === 0;
  if (!exact) {
    throw Object.assign(new Error("corp_score_credit_outcome_quote_invalid"), {
      code: "corp_score_credit_outcome_quote_invalid",
      actionId: action.actionId,
      stateVersion: candidate.stateVersion,
      owner: "actions/corp-score-credit-outcome-projection",
    });
  }
  return {
    schemaVersion: "action-economy-projection-v1",
    kind: "immediate_liquid",
    timing: "immediate",
    creditRestriction: "general",
    clickCost: 0,
    creditCost: 0,
    grossLiquidCreditGain: Math.max(0, delta),
    netLiquidCreditGain: delta,
    cardsDrawn: 0,
    cardsConsumed: 0,
    netHandDelta: 0,
    repeatable: false,
    reliability: "guaranteed",
    source: "legal_action_payload",
    confidence: "high",
    evidence: [
      "exact_current_corp_score_credit_outcome",
      `score_credits:${before}->${after}`,
    ],
  };
}
