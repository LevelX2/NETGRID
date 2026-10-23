import {
  canonicalCapabilityId,
  planningCardByDefinitionId,
} from "@netgrid/cards/planning";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";

/** Canonical facts for a plain action-loaded, all-pool bank. These facts
 * describe a possible later conversion; only the Engine offers current actions. */
export function clickCreditBankProfile(definitionId: string) {
  const card = planningCardByDefinitionId(definitionId);
  const abilities = card?.engine.abilities;
  if (!card || abilities?.length !== 2) return undefined;
  const load = abilities.find(
    (a) =>
      a.effects.length === 1 &&
      a.effects[0]?.kind === "add_hosted_credits" &&
      a.effects[0].target === "source",
  );
  const cashout = abilities.find(
    (a) =>
      a.effects.length === 1 &&
      a.effects[0]?.kind === "take_hosted_credits" &&
      a.effects[0].recipient === "controller" &&
      a.effects[0].mode === "all",
  );
  if (
    !load ||
    !cashout ||
    load.kind !== "activated" ||
    cashout.kind !== "activated" ||
    load.condition !== undefined ||
    (cashout.condition !== undefined &&
      cashout.condition.kind !== "source_has_hosted_credits") ||
    load.effects[0]?.kind !== "add_hosted_credits" ||
    !Number.isSafeInteger(load.effects[0].amount) ||
    load.effects[0].amount <= 1 ||
    load.costs?.length !== 1 ||
    load.costs[0]?.kind !== "action" ||
    load.costs[0].amount !== 1 ||
    cashout.costs?.length !== 1 ||
    cashout.costs[0]?.kind !== "action" ||
    cashout.costs[0].amount !== 1 ||
    (load.limit !== undefined &&
      (load.limit.kind !== "once_per_turn_per_source" ||
        load.limit.scope !== "any_ability_on_source")) ||
    (cashout.limit !== undefined &&
      (cashout.limit.kind !== "once_per_turn_per_source" ||
        cashout.limit.scope !== "any_ability_on_source")) ||
    (load.limit === undefined) !== (cashout.limit === undefined)
  )
    return undefined;
  return {
    side: card.side,
    cardType: card.cardType,
    loadAbilityId: canonicalCapabilityId(
      card.cardDefinitionId,
      load.capabilityKey,
    ),
    cashoutAbilityId: canonicalCapabilityId(
      card.cardDefinitionId,
      cashout.capabilityKey,
    ),
    creditsPerLoad: load.effects[0].amount,
    loadActionCost: load.costs[0].amount,
    cashoutActionCost: cashout.costs[0].amount,
    sharedTurnLimit: load.limit !== undefined,
  };
}

/** Current repeatable/fixed income, excluding all-pool withdrawals and
 * consumable hand cards. The owner still ranks these actual income routes. */
export function bankAlternativeIncomePerAction(
  candidates: readonly ActionSemanticCandidate[],
) {
  return Math.max(
    1,
    ...candidates.flatMap((candidate) => {
      const p = candidate.economyProjection;
      return p?.kind === "immediate_liquid" &&
        p.reliability === "guaranteed" &&
        p.creditRestriction === "general" &&
        p.payoutMode !== "all_available" &&
        p.cardsConsumed === 0 &&
        p.cardsDrawn === 0 &&
        p.clickCost > 0 &&
        typeof p.netLiquidCreditGain === "number" &&
        p.netLiquidCreditGain > 0
        ? [p.netLiquidCreditGain / p.clickCost]
        : [];
    }),
  );
}

/** Economic facts for an owner-owned, revalidated bank plan. A target is a
 * spending budget supplied by the owner, never a prescribed number of loads.
 * Projected stored credits do not become current liquid payment capacity. */
export function assessCreditBankInvestment(params: {
  liquidCredits: number;
  storedCredits: number;
  otherStoredCredits: number;
  desiredLiquidity: number;
  creditsPerLoad: number;
  loadActionCost: number;
  cashoutActionCost: number;
  alternativeCreditsPerAction: number;
}) {
  const missingStoredCredits = Math.max(
    0,
    params.desiredLiquidity -
      params.liquidCredits -
      params.storedCredits -
      params.otherStoredCredits,
  );
  const additionalLoadExecutions = Math.ceil(
    missingStoredCredits / params.creditsPerLoad,
  );
  const addedCredits = additionalLoadExecutions * params.creditsPerLoad;
  const additionalActionCost =
    additionalLoadExecutions * params.loadActionCost +
    (params.storedCredits > 0 ? 0 : params.cashoutActionCost);
  return {
    missingStoredCredits,
    additionalLoadExecutions,
    projectedPayout: params.storedCredits + addedCredits,
    incrementalCreditsOverAlternative:
      addedCredits - additionalActionCost * params.alternativeCreditsPerAction,
  };
}

/** Conditional marginal payout within a bounded number of future own turns.
 * Queued credits remain hosted; this assessment never creates liquid funding. */
export function assessAutomaticCreditBankInvestment(params: {
  liquidCredits: number;
  storedCredits: number;
  desiredLiquidity: number;
  creditsPerLoad: number;
  loadActionCost: number;
  creditsPerTrigger: number;
  horizonTurns: number;
  alternativeCreditsPerAction: number;
}) {
  const nonnegative = [
    params.liquidCredits,
    params.storedCredits,
    params.desiredLiquidity,
    params.horizonTurns,
  ];
  const positive = [
    params.creditsPerLoad,
    params.loadActionCost,
    params.creditsPerTrigger,
  ];
  if (
    nonnegative.some((value) => !Number.isSafeInteger(value) || value < 0) ||
    positive.some((value) => !Number.isSafeInteger(value) || value <= 0) ||
    !Number.isFinite(params.alternativeCreditsPerAction) ||
    params.alternativeCreditsPerAction <= 0
  ) {
    return {
      status: "unavailable" as const,
      reason: "invalid_automatic_payout_projection" as const,
    };
  }
  const remainingBudget = Math.max(
    0,
    params.desiredLiquidity - params.liquidCredits,
  );
  const payoutCapacity = params.creditsPerTrigger * params.horizonTurns;
  const payoutWithoutLoad = Math.min(
    params.storedCredits,
    payoutCapacity,
    remainingBudget,
  );
  const payoutWithLoad = Math.min(
    params.storedCredits + params.creditsPerLoad,
    payoutCapacity,
    remainingBudget,
  );
  const marginalPayout = payoutWithLoad - payoutWithoutLoad;
  return {
    status: "quoted" as const,
    horizonTurns: params.horizonTurns,
    remainingBudget,
    payoutWithoutLoad,
    payoutWithLoad,
    marginalPayout,
    incrementalCreditsOverAlternative:
      marginalPayout -
      params.loadActionCost * params.alternativeCreditsPerAction,
  };
}
