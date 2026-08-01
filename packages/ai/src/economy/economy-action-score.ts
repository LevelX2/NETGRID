import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type {
  CreditDemand,
  CreditDemandPriority,
} from "../plans/credit-demand";

export const ECONOMY_CREDIT_BASE_CURVE = [
  0, 100, 150, 200, 240, 275, 305,
] as const;

export const ECONOMY_CREDIT_DEMAND_BONUS: Readonly<
  Record<CreditDemandPriority, number>
> = {
  acute_hard_plan_blocker: 600,
  current_foreground_plan: 400,
  next_own_turn: 220,
  tactical_reserve: 100,
  phase_reserve: 50,
};

export type EconomyActionMode =
  | "standard_liquid"
  | "fixed_pool_payout"
  | "strategic_bank_setup"
  | "strategic_bank_cashout"
  | "restricted_credit"
  | "automatic_credit"
  | "non_economy";

export type EconomyScoreComponent = {
  key: "credit_base" | "credit_demand" | "net_hand_delta";
  value: number;
  evidence: string[];
};

export type EconomyActionScore = {
  actionId: string;
  mode: EconomyActionMode;
  netLiquidCreditGain: number;
  total: number;
  demandId?: string;
  components: EconomyScoreComponent[];
  evidence: string[];
};

export type EconomyActionDominance = {
  dominantActionId: string;
  dominatedActionId: string;
  creditAdvantage: number;
  evidence: string[];
};

export function economyCreditBaseValue(netLiquidCreditGain: number): number {
  const gain = wholeNonNegative(netLiquidCreditGain);
  if (gain < ECONOMY_CREDIT_BASE_CURVE.length) {
    return ECONOMY_CREDIT_BASE_CURVE[gain]!;
  }
  return ECONOMY_CREDIT_BASE_CURVE[6] + (gain - 6) * 25;
}

export function economyNetHandDeltaValue(netHandDelta: number): number {
  if (!Number.isFinite(netHandDelta)) return 0;
  return Math.max(-40, Math.min(40, Math.trunc(netHandDelta) * 40));
}

export function scoreEconomyAction(
  candidate: ActionSemanticCandidate,
  demands: readonly CreditDemand[] = [],
): EconomyActionScore {
  const projection = candidate.economyProjection;
  const mode = economyActionMode(candidate);
  const netLiquidCreditGain = Math.max(0, projection?.netLiquidCreditGain ?? 0);
  const creditBase =
    projection?.timing === "immediate" &&
    (mode === "standard_liquid" ||
      mode === "fixed_pool_payout" ||
      mode === "strategic_bank_cashout" ||
      mode === "restricted_credit")
      ? economyCreditBaseValue(netLiquidCreditGain)
      : 0;
  const activeDemand = highestCompatibleCreditDemand(demands, candidate, mode);
  const demandBonus = activeDemand
    ? ECONOMY_CREDIT_DEMAND_BONUS[activeDemand.priority]
    : 0;
  const handDeltaValue =
    mode === "non_economy"
      ? 0
      : economyNetHandDeltaValue(projection?.netHandDelta ?? 0);
  const components: EconomyScoreComponent[] = [
    {
      key: "credit_base",
      value: creditBase,
      evidence: [
        `economy_net_liquid_gain:${netLiquidCreditGain}`,
        `economy_credit_base:${creditBase}`,
        "economy_credit_cost_accounted_in_net_gain_once:true",
      ],
    },
    ...(activeDemand
      ? [
          {
            key: "credit_demand" as const,
            value: demandBonus,
            evidence: [
              `economy_credit_demand:${activeDemand.demandId}`,
              `economy_credit_demand_priority:${activeDemand.priority}`,
              `economy_credit_demand_bonus:${demandBonus}`,
              "economy_credit_demand_bonus_applied_once:true",
            ],
          },
        ]
      : []),
    ...(handDeltaValue !== 0
      ? [
          {
            key: "net_hand_delta" as const,
            value: handDeltaValue,
            evidence: [
              `economy_net_hand_delta:${projection?.netHandDelta ?? 0}`,
              `economy_net_hand_delta_value:${handDeltaValue}`,
            ],
          },
        ]
      : []),
  ];
  return {
    actionId: candidate.actionId,
    mode,
    netLiquidCreditGain,
    total: components.reduce((sum, component) => sum + component.value, 0),
    ...(activeDemand ? { demandId: activeDemand.demandId } : {}),
    components,
    evidence: [
      `economy_action_mode:${mode}`,
      ...components.flatMap((component) => component.evidence),
    ],
  };
}

export function economyActionMode(
  candidate: ActionSemanticCandidate,
): EconomyActionMode {
  const projection = candidate.economyProjection;
  if (!projection || projection.kind === "non_economy") return "non_economy";
  if (projection.kind === "stored_credit_build") {
    return "strategic_bank_setup";
  }
  if (projection.kind === "restricted_credit") return "restricted_credit";
  if (projection.kind === "automatic_credit") return "automatic_credit";
  if (
    projection.payoutMode === "all_available" ||
    candidate.effectTargets?.includes("economy.bank_cashout_all")
  ) {
    return "strategic_bank_cashout";
  }
  if (
    projection.sourcePool === "finite" ||
    candidate.functionalEffects?.some(
      (effect) => effect.economyMode === "fixed_pool",
    ) === true
  ) {
    return "fixed_pool_payout";
  }
  return "standard_liquid";
}

export function compareEconomyActionDominance(
  left: ActionSemanticCandidate,
  right: ActionSemanticCandidate,
): EconomyActionDominance | undefined {
  if (!economyActionsAreComparable(left, right)) return undefined;
  const leftGain = Math.max(
    0,
    left.economyProjection?.netLiquidCreditGain ?? 0,
  );
  const rightGain = Math.max(
    0,
    right.economyProjection?.netLiquidCreditGain ?? 0,
  );
  if (leftGain === rightGain) return undefined;
  const [dominant, dominated, creditAdvantage] =
    leftGain > rightGain
      ? [left, right, leftGain - rightGain]
      : [right, left, rightGain - leftGain];
  return {
    dominantActionId: dominant.actionId,
    dominatedActionId: dominated.actionId,
    creditAdvantage,
    evidence: [
      `economy_dominant_action:${dominant.actionId}`,
      `economy_dominated_action:${dominated.actionId}`,
      `economy_credit_advantage:${creditAdvantage}`,
      "economy_dominance_same_immediate_costs_and_side_effects:true",
    ],
  };
}

export function dominatedEconomyActionIds(
  candidates: readonly ActionSemanticCandidate[],
): Set<string> {
  const dominated = new Set<string>();
  for (let leftIndex = 0; leftIndex < candidates.length; leftIndex += 1) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < candidates.length;
      rightIndex += 1
    ) {
      const result = compareEconomyActionDominance(
        candidates[leftIndex]!,
        candidates[rightIndex]!,
      );
      if (result) dominated.add(result.dominatedActionId);
    }
  }
  return dominated;
}

function highestCompatibleCreditDemand(
  demands: readonly CreditDemand[],
  candidate: ActionSemanticCandidate,
  mode: EconomyActionMode,
): CreditDemand | undefined {
  if (
    mode === "non_economy" ||
    mode === "strategic_bank_setup" ||
    mode === "automatic_credit" ||
    (candidate.economyProjection?.netLiquidCreditGain ?? 0) <= 0
  ) {
    return undefined;
  }
  const restriction =
    candidate.economyProjection?.creditRestriction === "general"
      ? "general"
      : "restricted";
  return [...demands]
    .filter(
      (demand) =>
        demand.gap > 0 &&
        demand.acceptedCreditRestrictions.includes(restriction),
    )
    .sort(
      (left, right) =>
        right.priorityRank - left.priorityRank ||
        right.gap - left.gap ||
        left.demandId.localeCompare(right.demandId),
    )[0];
}

function economyActionsAreComparable(
  left: ActionSemanticCandidate,
  right: ActionSemanticCandidate,
): boolean {
  const leftProjection = left.economyProjection;
  const rightProjection = right.economyProjection;
  if (!leftProjection || !rightProjection) return false;
  const leftMode = economyActionMode(left);
  const rightMode = economyActionMode(right);
  if (
    [leftMode, rightMode].some((mode) =>
      [
        "non_economy",
        "strategic_bank_setup",
        "strategic_bank_cashout",
        "automatic_credit",
      ].includes(mode),
    )
  ) {
    return false;
  }
  return (
    left.actorSide === right.actorSide &&
    leftProjection.timing === "immediate" &&
    rightProjection.timing === "immediate" &&
    leftProjection.clickCost === rightProjection.clickCost &&
    leftProjection.creditCost === rightProjection.creditCost &&
    leftProjection.creditRestriction === rightProjection.creditRestriction &&
    leftProjection.reliability === rightProjection.reliability &&
    leftProjection.netHandDelta === rightProjection.netHandDelta &&
    leftProjection.payoutMode === rightProjection.payoutMode
  );
}

function wholeNonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}
