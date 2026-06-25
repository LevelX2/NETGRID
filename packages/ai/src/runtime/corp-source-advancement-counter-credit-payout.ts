import { type AiDecisionInput, type LegalAction } from "@netgrid/shared";
import { actionClickCost } from "./action-cost";
import {
  findVisibleCard,
  sourceDefinitionIdForAction,
} from "./visible-card-lookup";

export type CorpSourceAdvancementCounterCreditPayoutAssessment = {
  score: number;
  payout: number;
  advancementCounters: number;
  evidence: string[];
};

export function isSourceAdvancementCounterCreditPayoutAction(
  action: LegalAction,
): boolean {
  return (
    action.payload?.cardImplementationEconomyKind ===
      "gain_credits_per_advancement_counter_on_source" &&
    typeof action.payload.cardImplementationAmountPerAdvancementCounter ===
      "number"
  );
}

export function corpSourceAdvancementCounterCreditPayoutAssessment(
  input: AiDecisionInput,
  action: LegalAction,
  currentCredits: number,
): CorpSourceAdvancementCounterCreditPayoutAssessment {
  const source = findVisibleCard(input, action.source);
  const amountPerCounter =
    typeof action.payload?.cardImplementationAmountPerAdvancementCounter ===
    "number"
      ? action.payload.cardImplementationAmountPerAdvancementCounter
      : 0;
  const advancementCounters = Math.max(
    0,
    Math.floor(source?.advancementCounters ?? 0),
  );
  const payout = advancementCounters * amountPerCounter;
  const clickCost = actionClickCost(action);
  const lowCredits = currentCredits < 5;
  if (payout <= 0) {
    return {
      score: 35,
      payout,
      advancementCounters,
      evidence: [
        "installed_corp_economy:true",
        "installed_corp_economy_kind:advancement_counter_payout",
        `installed_corp_economy_source:${sourceDefinitionIdForAction(input, action) ?? "unknown"}`,
        `installed_corp_economy_advancement_counters:${advancementCounters}`,
        `installed_corp_economy_amount_per_counter:${amountPerCounter}`,
        "installed_corp_economy_immediate_gain:0",
        "installed_corp_economy_net_credits:0",
        "source_advancement_counter_payout_zero_counter_payout:true",
        ...(action.payload?.cardImplementationTrashesSource === true
          ? ["source_advancement_counter_payout_trashes_source:true"]
          : []),
      ],
    };
  }
  const score =
    520 +
    payout * 45 +
    (lowCredits ? 100 : 35) -
    Math.max(0, clickCost - 1) * 80;
  return {
    score,
    payout,
    advancementCounters,
    evidence: [
      "installed_corp_economy:true",
      "installed_corp_economy_kind:advancement_counter_payout",
      `installed_corp_economy_source:${sourceDefinitionIdForAction(input, action) ?? "unknown"}`,
      `installed_corp_economy_advancement_counters:${advancementCounters}`,
      `installed_corp_economy_amount_per_counter:${amountPerCounter}`,
      `installed_corp_economy_immediate_gain:${payout}`,
      `installed_corp_economy_net_credits:${payout}`,
      "source_advancement_counter_payout_prepared:true",
      ...(action.payload?.cardImplementationTrashesSource === true
        ? ["source_advancement_counter_payout_trashes_source:true"]
        : []),
    ],
  };
}
