import type { Side } from "@netgrid/shared";

export const ACTION_DEMAND_SCHEMA_VERSION = "action-demand-v1" as const;

export const ACTION_DEMAND_PRIORITY_RANK = {
  acute_hard_plan_blocker: 5,
  current_foreground_plan: 4,
  next_own_turn: 3,
  tactical_reserve: 2,
  phase_reserve: 1,
} as const;

export type ActionDemandPriority = keyof typeof ACTION_DEMAND_PRIORITY_RANK;
export type ActionDemandHardness = "hard" | "soft";
export type ActionDemandDeadline =
  | "before_current_plan_action"
  | "end_of_current_turn"
  | "start_of_next_own_turn"
  | "within_three_own_turns";
export type ActionDemandRestriction =
  | "unrestricted"
  | "install_only"
  | "program_install_only"
  | "run_only";
export type ActionDemandPurpose =
  | "current_score_closeout"
  | "current_remote_protection"
  | "current_breaker_install"
  | "current_run"
  | "current_survival_sequence"
  | "foreground_plan"
  | "next_turn_setup"
  | "tactical_reserve"
  | "phase_reserve";

export type ActionDemand = {
  schemaVersion: typeof ACTION_DEMAND_SCHEMA_VERSION;
  demandId: string;
  side: Side;
  sourcePlanId?: string;
  purpose: ActionDemandPurpose;
  priority: ActionDemandPriority;
  priorityRank: number;
  hardness: ActionDemandHardness;
  deadline: ActionDemandDeadline;
  currentActions: number;
  targetActions: number;
  gap: number;
  acceptedRestrictions: ActionDemandRestriction[];
  requiredActionTypes: string[];
  evidence: string[];
};

export type CreateActionDemandParams = {
  demandId: string;
  side: Side;
  sourcePlanId?: string;
  purpose: ActionDemandPurpose;
  priority: ActionDemandPriority;
  hardness: ActionDemandHardness;
  deadline: ActionDemandDeadline;
  currentActions: number;
  targetActions: number;
  acceptedRestrictions?: readonly ActionDemandRestriction[];
  requiredActionTypes?: readonly string[];
  evidence?: readonly string[];
};

export type CreateSideActionDemandParams = Omit<
  CreateActionDemandParams,
  "side"
>;

export function createActionDemand(
  params: CreateActionDemandParams,
): ActionDemand {
  const { currentActions, targetActions } = params;
  for (const count of [currentActions, targetActions]) {
    if (!Number.isSafeInteger(count) || count < 0) {
      throw new RangeError(
        "Invalid action count for demand " + params.demandId + ": " + count,
      );
    }
  }
  const gap = Math.max(0, targetActions - currentActions);
  const acceptedRestrictions = [
    ...new Set(params.acceptedRestrictions ?? (["unrestricted"] as const)),
  ];
  const requiredActionTypes = uniqueStrings(params.requiredActionTypes ?? []);
  const currentEvidence = [
    `action_demand_side:${params.side}`,
    `action_demand_purpose:${params.purpose}`,
    `action_demand_priority:${params.priority}`,
    `action_demand_hardness:${params.hardness}`,
    `action_demand_deadline:${params.deadline}`,
    `action_demand_current:${currentActions}`,
    `action_demand_target:${targetActions}`,
    `action_demand_gap:${gap}`,
    `action_demand_restrictions:${acceptedRestrictions.join(",")}`,
    `action_demand_action_types:${requiredActionTypes.join(",") || "any"}`,
  ];
  const currentEvidencePrefixes = new Set(
    currentEvidence.map((fact) => fact.split(":")[0]),
  );
  return {
    schemaVersion: ACTION_DEMAND_SCHEMA_VERSION,
    demandId: params.demandId,
    side: params.side,
    ...(params.sourcePlanId ? { sourcePlanId: params.sourcePlanId } : {}),
    purpose: params.purpose,
    priority: params.priority,
    priorityRank: ACTION_DEMAND_PRIORITY_RANK[params.priority],
    hardness: params.hardness,
    deadline: params.deadline,
    currentActions,
    targetActions,
    gap,
    acceptedRestrictions,
    requiredActionTypes,
    evidence: [
      ...(params.evidence ?? []).filter(
        (value) => !currentEvidencePrefixes.has(value.split(":")[0] ?? ""),
      ),
      ...currentEvidence,
    ],
  };
}

export function createRunnerActionDemand(
  params: CreateSideActionDemandParams,
): ActionDemand {
  return createActionDemand({ ...params, side: "runner" });
}

export function createCorpActionDemand(
  params: CreateSideActionDemandParams,
): ActionDemand {
  return createActionDemand({ ...params, side: "corp" });
}

export function compareActionDemandPriority(
  left: ActionDemand,
  right: ActionDemand,
): number {
  return (
    right.priorityRank - left.priorityRank ||
    hardnessRank(right.hardness) - hardnessRank(left.hardness) ||
    deadlineRank(left.deadline) - deadlineRank(right.deadline) ||
    right.gap - left.gap ||
    left.demandId.localeCompare(right.demandId)
  );
}

function hardnessRank(hardness: ActionDemandHardness): number {
  return hardness === "hard" ? 1 : 0;
}

function deadlineRank(deadline: ActionDemandDeadline): number {
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

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))];
}
