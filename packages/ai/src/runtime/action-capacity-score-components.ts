import type { AiDecisionScoreComponent } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import {
  compareActionDemandPriority,
  type ActionDemand,
  type ActionDemandDeadline,
  type ActionDemandRestriction,
} from "../plans/action-demand";
import type { PlanActionContributionScore } from "../plans/plan-portfolio-types";

export type ActionCapacityScoringContext = {
  actionDemands: readonly ActionDemand[];
  planActionContributions: readonly PlanActionContributionScore[];
};

export type ActionCapacityDominance = {
  dominantActionId: string;
  dominatedActionId: string;
  actionAdvantage: number;
  evidence: string[];
};

const DEMAND_PRIORITY_VALUE: Record<ActionDemand["priority"], number> = {
  acute_hard_plan_blocker: 520,
  current_foreground_plan: 360,
  next_own_turn: 210,
  tactical_reserve: 130,
  phase_reserve: 80,
};

export function actionCapacityRuntimeScoreComponents(
  candidate: ActionSemanticCandidate | undefined,
  context: ActionCapacityScoringContext | undefined,
): AiDecisionScoreComponent[] {
  const projection = candidate?.actionCapacityProjection;
  if (!candidate || !projection || projection.kind === "non_action_capacity")
    return [];
  if (projection.kind === "action_debt") {
    const debtPenalty = Math.max(0, projection.actionDebt) * -180;
    assertFiniteActionCapacityValue(
      candidate.actionId,
      "action_debt_penalty",
      debtPenalty,
    );
    return debtPenalty === 0
      ? []
      : [
          component("action_capacity_debt", "Aktionsschuld", debtPenalty, [
            `action_debt:${projection.actionDebt}`,
            "action_capacity_source:projection",
          ]),
        ];
  }

  const contribution = context?.planActionContributions.find(
    (score) => score.actionId === candidate.actionId,
  );
  const demand = primaryCompatibleDemand(
    context?.actionDemands ?? [],
    projection.restriction,
    projection.allowedActionTypes,
  );
  const benefit = contribution
    ? contribution.totalValue
    : projection.kind === "future_recurring_gain"
      ? recurringBenefit(projection, demand)
      : immediateBenefit(projection, demand);
  // Portfolio action-capacity contributions already encode the selected
  // route's guarantee level. Applying the projection multiplier again here
  // would discount the same uncertainty twice.
  const reliabilityMultiplier = contribution
    ? 1
    : reliabilityFactor(projection.reliability);
  const riskCost = actionCapacityRiskCost(candidate);
  const resourceCost = actionCapacityResourceCost(candidate);
  const value = Math.round(
    benefit * reliabilityMultiplier - riskCost - resourceCost,
  );
  for (const [label, numericValue] of Object.entries({
    benefit,
    reliabilityMultiplier,
    riskCost,
    resourceCost,
    value,
  })) {
    assertFiniteActionCapacityValue(candidate.actionId, label, numericValue);
  }
  if (value === 0 && !contribution && !demand) return [];
  return [
    component(
      contribution
        ? "action_capacity_plan_conversion"
        : projection.kind === "future_recurring_gain"
          ? "action_capacity_amortized_conversion"
          : "action_capacity_followup_conversion",
      contribution
        ? "Aktionskapazität für Planfolge"
        : projection.kind === "future_recurring_gain"
          ? "Amortisierte Aktionskapazität"
          : "Konvertierbare Aktionskapazität",
      value,
      [
        `action_capacity_kind:${projection.kind}`,
        `action_capacity_restriction:${projection.restriction}`,
        `action_capacity_reliability:${projection.reliability}`,
        `action_capacity_self_financing:${projection.selfFinancing}`,
        `action_capacity_inline_contribution:${projection.generatedActionsConsumedByCurrentAction}`,
        `action_capacity_benefit:${benefit}`,
        `action_capacity_reliability_multiplier:${reliabilityMultiplier}`,
        `action_capacity_route_reliability_preaccounted:${Boolean(contribution)}`,
        `action_capacity_resource_cost:${resourceCost}`,
        `action_capacity_risk_cost:${riskCost}`,
        ...(demand
          ? [
              `action_capacity_demand:${demand.demandId}`,
              `action_capacity_demand_priority:${demand.priority}`,
            ]
          : ["action_capacity_demand:none"]),
        ...(contribution
          ? [
              `action_capacity_plan_contribution:${contribution.totalValue}`,
              `action_capacity_plan_entries:${contribution.portfolioEntryIds.join(",")}`,
              "action_capacity_plan_contribution_counted_once:true",
            ]
          : []),
      ],
    ),
  ];
}

export function compareActionCapacityDominance(
  left: ActionSemanticCandidate,
  right: ActionSemanticCandidate,
): ActionCapacityDominance | undefined {
  const leftProjection = left.actionCapacityProjection;
  const rightProjection = right.actionCapacityProjection;
  if (!leftProjection || !rightProjection) return undefined;
  if (!comparableCapacityProfiles(left, right)) return undefined;
  const leftCapacity = effectiveImmediateCapacity(left);
  const rightCapacity = effectiveImmediateCapacity(right);
  assertFiniteActionCapacityValue(
    left.actionId,
    "dominance_capacity",
    leftCapacity,
  );
  assertFiniteActionCapacityValue(
    right.actionId,
    "dominance_capacity",
    rightCapacity,
  );
  if (leftCapacity === rightCapacity) return undefined;
  const dominant = leftCapacity > rightCapacity ? left : right;
  const dominated = dominant === left ? right : left;
  const advantage = Math.abs(leftCapacity - rightCapacity);
  return {
    dominantActionId: dominant.actionId,
    dominatedActionId: dominated.actionId,
    actionAdvantage: advantage,
    evidence: [
      `action_capacity_dominant:${dominant.actionId}`,
      `action_capacity_dominated:${dominated.actionId}`,
      `action_capacity_advantage:${advantage}`,
      `action_capacity_restriction:${leftProjection.restriction}`,
      `action_capacity_timing:${leftProjection.timing}`,
      "action_capacity_comparable_costs:true",
    ],
  };
}

function immediateBenefit(
  projection: NonNullable<ActionSemanticCandidate["actionCapacityProjection"]>,
  demand: ActionDemand | undefined,
): number {
  const convertibleFollowups = Math.max(0, projection.followupActionCapacity);
  const netGain = Math.max(0, projection.netCurrentTurnActionDelta);
  if (demand) {
    const usefulCapacity = Math.min(
      Math.max(1, demand.gap),
      Math.max(convertibleFollowups, netGain),
    );
    return (
      DEMAND_PRIORITY_VALUE[demand.priority] +
      usefulCapacity * 110 +
      netGain * 55
    );
  }
  if (projection.restriction !== "unrestricted") {
    if (
      projection.selfFinancing ||
      projection.generatedActionsConsumedByCurrentAction > 0
    ) {
      return netGain * 40;
    }
    return -Math.min(
      DEMAND_PRIORITY_VALUE.current_foreground_plan,
      Math.max(convertibleFollowups, netGain) * 90,
    );
  }
  return netGain * 40;
}

function recurringBenefit(
  projection: NonNullable<ActionSemanticCandidate["actionCapacityProjection"]>,
  demand: ActionDemand | undefined,
): number {
  const perTurn = Math.max(0, projection.gainAmountPerTurn ?? 0);
  if (perTurn <= 0) return 0;
  const projectedDuration = Math.max(1, projection.durationTurns ?? 1);
  const horizon = demand
    ? usefulTurnsForDeadline(demand.deadline)
    : Math.min(3, projectedDuration);
  const usefulTurns = Math.min(projectedDuration, horizon);
  if (usefulTurns <= 0) return 0;
  return (
    (demand ? DEMAND_PRIORITY_VALUE[demand.priority] * 0.6 : 0) +
    perTurn * usefulTurns * 100
  );
}

function primaryCompatibleDemand(
  demands: readonly ActionDemand[],
  restriction: string,
  allowedActionTypes: readonly string[],
): ActionDemand | undefined {
  const normalizedRestriction = actionDemandRestriction(restriction);
  if (!normalizedRestriction) return undefined;
  return [...demands]
    .filter(
      (demand) =>
        demand.gap > 0 &&
        demand.acceptedRestrictions.includes(normalizedRestriction) &&
        (demand.requiredActionTypes.length === 0 ||
          allowedActionTypes.length === 0 ||
          allowedActionTypes.some((actionType) =>
            demand.requiredActionTypes.includes(actionType),
          )),
    )
    .sort(compareActionDemandPriority)[0];
}

function comparableCapacityProfiles(
  left: ActionSemanticCandidate,
  right: ActionSemanticCandidate,
): boolean {
  const leftProjection = left.actionCapacityProjection!;
  const rightProjection = right.actionCapacityProjection!;
  return (
    leftProjection.kind.startsWith("immediate_") &&
    rightProjection.kind.startsWith("immediate_") &&
    leftProjection.timing === rightProjection.timing &&
    leftProjection.restriction === rightProjection.restriction &&
    leftProjection.reliability === rightProjection.reliability &&
    [...leftProjection.allowedActionTypes].sort().join(",") ===
      [...rightProjection.allowedActionTypes].sort().join(",") &&
    left.actionType === right.actionType &&
    whole(left.costProfile.clickCost) === whole(right.costProfile.clickCost) &&
    whole(left.costProfile.creditCost) ===
      whole(right.costProfile.creditCost) &&
    Boolean(left.costProfile.forfeitAgenda) ===
      Boolean(right.costProfile.forfeitAgenda) &&
    whole(left.costProfile.selfTag) === whole(right.costProfile.selfTag) &&
    selfDamageAmount(left) === selfDamageAmount(right) &&
    leftProjection.sourceCounterType === rightProjection.sourceCounterType &&
    whole(leftProjection.sourceCounterCost) ===
      whole(rightProjection.sourceCounterCost) &&
    (whole(leftProjection.sourceCounterCost) === 0 ||
      left.sourceCardInstanceId === right.sourceCardInstanceId) &&
    economySideEffectSignature(left) === economySideEffectSignature(right) &&
    [...left.costProfile.additionalCosts].sort().join(",") ===
      [...right.costProfile.additionalCosts].sort().join(",")
  );
}

function economySideEffectSignature(
  candidate: ActionSemanticCandidate,
): string {
  const economy = candidate.economyProjection;
  if (!economy || economy.kind === "non_economy") return "none";
  return [
    economy.kind,
    economy.timing,
    whole(economy.netLiquidCreditGain),
    whole(economy.storedCreditsAdded),
    whole(economy.storedCreditsTaken),
    whole(economy.cardsDrawn),
    economy.netHandDelta,
  ].join(":");
}

function effectiveImmediateCapacity(
  candidate: ActionSemanticCandidate,
): number {
  const projection = candidate.actionCapacityProjection!;
  return (
    Math.max(0, projection.followupActionCapacity) * 10 +
    Math.max(0, projection.netCurrentTurnActionDelta)
  );
}

function actionCapacityResourceCost(
  candidate: ActionSemanticCandidate,
): number {
  const projection = candidate.actionCapacityProjection!;
  const cardCost =
    candidate.actionType === "play_operation" ||
    candidate.actionType === "play_event"
      ? 80
      : 0;
  const counterCost = whole(projection.sourceCounterCost) * 45;
  const setupActionCost =
    projection.kind === "future_recurring_gain"
      ? whole(projection.preExistingActionCost) * 80
      : 0;
  return cardCost + counterCost + setupActionCost;
}

function actionCapacityRiskCost(candidate: ActionSemanticCandidate): number {
  return (
    selfDamageAmount(candidate) * 450 +
    whole(candidate.costProfile.selfTag) * 180 +
    (candidate.costProfile.forfeitAgenda === true ? 1_000 : 0) +
    (candidate.costProfile.variableCost ? 120 : 0)
  );
}

function selfDamageAmount(candidate: ActionSemanticCandidate): number {
  return (candidate.costProfile.selfDamage ?? []).reduce(
    (sum, damage) =>
      sum + (typeof damage.amount === "number" ? damage.amount : 1),
    0,
  );
}

function reliabilityFactor(
  reliability: NonNullable<
    ActionSemanticCandidate["actionCapacityProjection"]
  >["reliability"],
): number {
  switch (reliability) {
    case "guaranteed":
      return 1;
    case "conditional":
      return 0.55;
    case "random":
      return 0.35;
    case "unknown":
      return 0.4;
  }
}

function usefulTurnsForDeadline(deadline: ActionDemandDeadline): number {
  switch (deadline) {
    case "before_current_plan_action":
    case "end_of_current_turn":
      return 0;
    case "start_of_next_own_turn":
      return 1;
    case "within_three_own_turns":
      return 3;
  }
}

function actionDemandRestriction(
  restriction: string,
): ActionDemandRestriction | undefined {
  if (
    restriction === "unrestricted" ||
    restriction === "install_only" ||
    restriction === "program_install_only" ||
    restriction === "run_only"
  )
    return restriction;
  return undefined;
}

function whole(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0;
}

function component(
  key: string,
  label: string,
  value: number,
  evidence: readonly string[],
): AiDecisionScoreComponent {
  return {
    key,
    label,
    value,
    reason: evidence.join("|"),
  };
}

function assertFiniteActionCapacityValue(
  actionId: string,
  label: string,
  value: number,
): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(
      `action_capacity_score_non_finite:${actionId}:${label}:${value}`,
    );
  }
}
