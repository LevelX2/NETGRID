import type { AiDecisionInput } from "@netgrid/shared";

import {
  RUNNER_CONSUMABLE_RUN_OPPORTUNITY_SCHEMA_VERSION,
  type RunActionProjection,
  type RunnerAccessPayoff,
  type RunnerConsumableRunOpportunityQuote,
} from "./runner-run-target-types";

const BYPASS_CARD_BASE_OPPORTUNITY_COST = 45;
const CARD_BACKED_RUN_BASE_OPPORTUNITY_COST = 20;
const BYPASS_CARD_DUPLICATE_RELIEF = 15;
const BYPASS_CARD_HAND_CAPACITY_RELIEF = 15;
const BYPASS_CARD_HIGH_YIELD_RELIEF = 20;

export type QuoteRunnerConsumableRunOpportunityParams = {
  input: AiDecisionInput;
  projection: RunActionProjection;
  bypassedFirstIce: boolean;
  accessPayoff: RunnerAccessPayoff;
  scoreThreat: boolean;
  multiaccessAvailable: boolean;
  runnerMatchpointCentralAccess: boolean;
  rawRouteScore: number;
};

/**
 * Quotes the plan-local opportunity cost of consuming a card-backed route.
 * It uses only structured run semantics and side-safe visible Runner facts.
 */
export function quoteRunnerConsumableRunOpportunity(
  params: QuoteRunnerConsumableRunOpportunityParams,
): RunnerConsumableRunOpportunityQuote | undefined {
  const sourceDefinitionId = params.projection.sourceCardId;
  if (
    params.input.side !== "runner" ||
    params.projection.sourceKind !== "event" ||
    !sourceDefinitionId
  ) {
    return undefined;
  }
  if (!Number.isFinite(params.rawRouteScore)) {
    throw new RangeError("Consumable-run rawRouteScore must be finite.");
  }
  const kind =
    params.projection.bypassFirstIce && params.bypassedFirstIce
      ? "bypass_first_ice"
      : "card_backed_run";
  const baseOpportunityCost =
    kind === "bypass_first_ice"
      ? BYPASS_CARD_BASE_OPPORTUNITY_COST
      : CARD_BACKED_RUN_BASE_OPPORTUNITY_COST;

  const gripCopyCount = params.input.playerView.own.gripOrHq.filter(
    (card) => card.known !== false && card.definitionId === sourceDefinitionId,
  ).length;
  const handAtCapacity =
    params.input.playerView.own.gripOrHq.length >=
    params.input.playerView.own.maxHandSize;
  const duplicateRelief = gripCopyCount >= 2 ? BYPASS_CARD_DUPLICATE_RELIEF : 0;
  const handCapacityRelief = handAtCapacity
    ? BYPASS_CARD_HAND_CAPACITY_RELIEF
    : 0;
  const exactImmediatePayoff =
    params.scoreThreat ||
    params.runnerMatchpointCentralAccess ||
    params.accessPayoff === "agenda" ||
    params.accessPayoff === "score_threat";
  const highYieldAccess =
    params.multiaccessAvailable ||
    params.accessPayoff === "access_bonus" ||
    params.accessPayoff === "trash_affordable";
  const immediatePayoffRelief = exactImmediatePayoff
    ? baseOpportunityCost
    : highYieldAccess
      ? Math.min(baseOpportunityCost, BYPASS_CARD_HIGH_YIELD_RELIEF)
      : 0;
  const opportunityCost = Math.max(
    0,
    baseOpportunityCost -
      duplicateRelief -
      handCapacityRelief -
      immediatePayoffRelief,
  );
  const effectiveRouteScore = params.rawRouteScore - opportunityCost;

  return {
    schemaVersion: RUNNER_CONSUMABLE_RUN_OPPORTUNITY_SCHEMA_VERSION,
    kind,
    sourceDefinitionId,
    gripCopyCount,
    handAtCapacity,
    baseOpportunityCost,
    duplicateRelief,
    handCapacityRelief,
    immediatePayoffRelief,
    opportunityCost,
    rawRouteScore: params.rawRouteScore,
    effectiveRouteScore,
    evidence: [
      "consumable_run_route:true",
      `consumable_run_route_kind:${kind}`,
      `consumable_run_grip_copy_count:${gripCopyCount}`,
      `consumable_run_hand_at_capacity:${handAtCapacity}`,
      `consumable_run_base_opportunity_cost:${baseOpportunityCost}`,
      `consumable_run_duplicate_relief:${duplicateRelief}`,
      `consumable_run_hand_capacity_relief:${handCapacityRelief}`,
      `consumable_run_immediate_payoff_relief:${immediatePayoffRelief}`,
      `consumable_run_opportunity_cost:${opportunityCost}`,
      `consumable_run_raw_route_score:${params.rawRouteScore}`,
      `consumable_run_effective_route_score:${effectiveRouteScore}`,
    ],
  };
}
