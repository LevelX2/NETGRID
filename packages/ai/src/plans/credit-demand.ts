import type { Side } from "@netgrid/shared";

export const CREDIT_DEMAND_SCHEMA_VERSION = "credit-demand-v1" as const;

export const CREDIT_DEMAND_PRIORITY_RANK = {
  acute_hard_plan_blocker: 5,
  current_foreground_plan: 4,
  next_own_turn: 3,
  tactical_reserve: 2,
  phase_reserve: 1,
} as const;

export type CreditDemandPriority = keyof typeof CREDIT_DEMAND_PRIORITY_RANK;
export type CreditDemandHardness = "hard" | "soft";
export type CreditDemandDeadline =
  | "before_current_plan_action"
  | "end_of_current_turn"
  | "start_of_next_own_turn"
  | "within_three_own_turns";
export type CreditRestriction = "general" | "restricted";
export type CreditDemandPurpose =
  | "breaker_for_current_plan"
  | "current_run"
  | "current_score_window"
  | "current_rez_window"
  | "foreground_plan"
  | "next_turn_setup"
  | "tactical_reserve"
  | "phase_reserve";

export type CreditDemand = {
  schemaVersion: typeof CREDIT_DEMAND_SCHEMA_VERSION;
  demandId: string;
  side: Side;
  sourcePlanId?: string;
  purpose: CreditDemandPurpose;
  priority: CreditDemandPriority;
  priorityRank: number;
  hardness: CreditDemandHardness;
  deadline: CreditDemandDeadline;
  currentCredits: number;
  targetCredits: number;
  gap: number;
  acceptedCreditRestrictions: CreditRestriction[];
  evidence: string[];
};

export type CreateCreditDemandParams = {
  demandId: string;
  side: Side;
  sourcePlanId?: string;
  purpose: CreditDemandPurpose;
  priority: CreditDemandPriority;
  hardness: CreditDemandHardness;
  deadline: CreditDemandDeadline;
  currentCredits: number;
  targetCredits: number;
  acceptedCreditRestrictions?: readonly CreditRestriction[];
  evidence?: readonly string[];
};

export type CreateSideCreditDemandParams = Omit<
  CreateCreditDemandParams,
  "side"
>;

export function createCreditDemand(
  params: CreateCreditDemandParams,
): CreditDemand {
  const currentCredits = wholeNonNegative(params.currentCredits);
  const targetCredits = wholeNonNegative(params.targetCredits);
  const gap = Math.max(0, targetCredits - currentCredits);
  const acceptedCreditRestrictions = uniqueRestrictions(
    params.acceptedCreditRestrictions ?? ["general"],
  );
  return {
    schemaVersion: CREDIT_DEMAND_SCHEMA_VERSION,
    demandId: params.demandId,
    side: params.side,
    ...(params.sourcePlanId ? { sourcePlanId: params.sourcePlanId } : {}),
    purpose: params.purpose,
    priority: params.priority,
    priorityRank: CREDIT_DEMAND_PRIORITY_RANK[params.priority],
    hardness: params.hardness,
    deadline: params.deadline,
    currentCredits,
    targetCredits,
    gap,
    acceptedCreditRestrictions,
    evidence: [
      ...(params.evidence ?? []),
      `credit_demand_side:${params.side}`,
      `credit_demand_purpose:${params.purpose}`,
      `credit_demand_priority:${params.priority}`,
      `credit_demand_hardness:${params.hardness}`,
      `credit_demand_deadline:${params.deadline}`,
      `credit_demand_current:${currentCredits}`,
      `credit_demand_target:${targetCredits}`,
      `credit_demand_gap:${gap}`,
    ],
  };
}

export function createRunnerCreditDemand(
  params: CreateSideCreditDemandParams,
): CreditDemand {
  return createCreditDemand({ ...params, side: "runner" });
}

export function createCorpCreditDemand(
  params: CreateSideCreditDemandParams,
): CreditDemand {
  return createCreditDemand({ ...params, side: "corp" });
}

export function compareCreditDemandPriority(
  left: CreditDemand,
  right: CreditDemand,
): number {
  return (
    right.priorityRank - left.priorityRank ||
    hardnessRank(right.hardness) - hardnessRank(left.hardness) ||
    deadlineRank(left.deadline) - deadlineRank(right.deadline) ||
    right.gap - left.gap ||
    left.demandId.localeCompare(right.demandId)
  );
}

function hardnessRank(hardness: CreditDemandHardness): number {
  return hardness === "hard" ? 1 : 0;
}

function deadlineRank(deadline: CreditDemandDeadline): number {
  switch (deadline) {
    case "before_current_plan_action":
      return 0;
    case "end_of_current_turn":
      return 1;
    case "start_of_next_own_turn":
      return 2;
    case "within_three_own_turns":
      return 3;
  }
}

function uniqueRestrictions(
  restrictions: readonly CreditRestriction[],
): CreditRestriction[] {
  const result = [...new Set(restrictions)];
  return result.length > 0 ? result : ["general"];
}

function wholeNonNegative(value: number): number {
  if (!Number.isFinite(value)) {
    throw new RangeError(`credit demand value must be finite: ${value}`);
  }
  return Math.max(0, Math.floor(value));
}
