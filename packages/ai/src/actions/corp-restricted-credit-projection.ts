import type { LegalAction } from "@netgrid/shared";
import type {
  ActionEconomyProjection,
  ActionSemanticCandidate,
} from "../action-semantic-candidate-types";

/** Current payout facts only; a spending route and its owner must be proven separately. */
export function corpRestrictedCreditProjection(
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): ActionEconomyProjection | undefined {
  const payload = action.payload;
  if (payload?.cardImplementationEffectKind !== "gain_temporary_corp_credits")
    return undefined;
  const amount = payload.restrictedCreditGainAmount;
  const counterCost = payload.cardImplementationAdvancementCounterCost;
  const clickCost = action.costs.reduce(
    (total, cost) => total + (cost.clicks ?? 0),
    0,
  );
  const creditCost = action.costs.reduce(
    (total, cost) => total + (cost.credits ?? 0),
    0,
  );
  const exact =
    action.side === "corp" &&
    action.type === "activated_card_ability" &&
    candidate.actionId === action.actionId &&
    action.abilityRef?.sourceCardInstanceId === action.source &&
    payload.cardId === action.source &&
    action.targetRequirements.length === 0 &&
    (action.choiceRequirements?.length ?? 0) === 0 &&
    payload.restrictedCreditGainComplete === true &&
    Number.isSafeInteger(clickCost) &&
    clickCost >= 0 &&
    Number.isSafeInteger(creditCost) &&
    creditCost >= 0 &&
    typeof amount === "number" &&
    Number.isSafeInteger(amount) &&
    amount > 0 &&
    typeof counterCost === "number" &&
    Number.isSafeInteger(counterCost) &&
    counterCost > 0 &&
    payload.restrictedCreditGainUsableFor === "corp_install_or_rez" &&
    payload.restrictedCreditGainCleanup === "end_of_turn";
  return {
    schemaVersion: "action-economy-projection-v1",
    kind: "restricted_credit",
    timing: exact ? "immediate" : "unknown",
    creditRestriction: "restricted",
    clickCost,
    creditCost,
    ...(exact
      ? {
          restrictedCreditPayout: {
            amount,
            usableFor: "corp_install_or_rez" as const,
            cleanup: "end_of_turn" as const,
            sourceAdvancementCounterCost: counterCost,
          },
        }
      : {}),
    cardsDrawn: 0,
    cardsConsumed: 0,
    netHandDelta: 0,
    repeatable: "unknown",
    reliability: exact ? "guaranteed" : "unknown",
    source: "legal_action_payload",
    confidence: exact ? "high" : "none",
    evidence: [
      exact
        ? "exact_current_install_rez_payout"
        : "incomplete_current_install_rez_payout",
      "no_general_liquidity",
      "consumer_and_deadline_binding_required",
    ],
  };
}
