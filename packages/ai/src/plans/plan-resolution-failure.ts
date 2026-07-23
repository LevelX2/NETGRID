import type { Side } from "@netgrid/shared";

export const PLAN_RESOLUTION_FAILURE_CODES = [
  "missing_plan_module_coverage",
  "missing_action_semantics",
  "invalid_plan_identity",
  "step_capability_mismatch",
  "step_target_mismatch",
  "no_current_route_head",
  "priority_claim_rejected",
  "resource_claim_conflict",
  "invalid_support_graph",
  "stale_or_future_action_reference",
  "commitment_invalidated",
  "window_origin_missing",
  "executor_invariant_broken",
  "end_turn_with_usable_capacity",
  "scheduler_replan_exhausted",
] as const;

export type PlanResolutionFailureCode =
  (typeof PLAN_RESOLUTION_FAILURE_CODES)[number];

export type PlanResolutionFailureOwner =
  | "rules_contract"
  | "window_resolution"
  | "plan_registry"
  | "action_semantics"
  | "plan_module"
  | "priority_policy"
  | "resource_ledger"
  | "support_graph"
  | "continuation"
  | "scheduler";

export type PlanResolutionFailureContextInput = {
  side: Side;
  stateVersion: number;
  timingPoint: string;
  legalActionTypes: readonly string[];
  owner: PlanResolutionFailureOwner;
  removalCondition: string;
  planInstanceId?: string;
  stepId?: string;
  candidateCount?: number;
  assessmentCount?: number;
  routeCount?: number;
};

export type PlanResolutionFailureContext = {
  side: Side;
  stateVersion: number;
  timingPoint: string;
  legalActionTypes: string[];
  owner: PlanResolutionFailureOwner;
  removalCondition: string;
  planInstanceId?: string;
  stepId?: string;
  candidateCount?: number;
  assessmentCount?: number;
  routeCount?: number;
};

export class PlanResolutionFailure extends Error {
  readonly code: PlanResolutionFailureCode;
  readonly context: PlanResolutionFailureContext;

  constructor(
    code: PlanResolutionFailureCode,
    context: PlanResolutionFailureContextInput,
  ) {
    const normalizedContext = normalizePlanResolutionFailureContext(context);
    super(formatPlanResolutionFailureMessage(code, normalizedContext));
    this.name = "PlanResolutionFailure";
    this.code = code;
    this.context = normalizedContext;
  }
}

export function planResolutionFailureEvidence(
  failure: PlanResolutionFailure,
): string[] {
  const context = failure.context;
  return [
    `plan_resolution_failure:${failure.code}`,
    `plan_resolution_owner:${context.owner}`,
    `plan_resolution_side:${context.side}`,
    `plan_resolution_state_version:${context.stateVersion}`,
    `plan_resolution_timing:${context.timingPoint}`,
    `plan_resolution_legal_action_types:${context.legalActionTypes.join(",") || "none"}`,
    `plan_resolution_removal_condition:${context.removalCondition}`,
    ...(context.planInstanceId
      ? [`plan_resolution_instance:${context.planInstanceId}`]
      : []),
    ...(context.stepId ? [`plan_resolution_step:${context.stepId}`] : []),
    ...(context.candidateCount !== undefined
      ? [`plan_resolution_candidate_count:${context.candidateCount}`]
      : []),
    ...(context.assessmentCount !== undefined
      ? [`plan_resolution_assessment_count:${context.assessmentCount}`]
      : []),
    ...(context.routeCount !== undefined
      ? [`plan_resolution_route_count:${context.routeCount}`]
      : []),
  ];
}

function normalizePlanResolutionFailureContext(
  context: PlanResolutionFailureContextInput,
): PlanResolutionFailureContext {
  return {
    side: context.side,
    stateVersion: nonNegativeInteger(context.stateVersion),
    timingPoint: redactedToken(context.timingPoint, "unknown"),
    legalActionTypes: [
      ...new Set(context.legalActionTypes.map((entry) => redactedToken(entry))),
    ]
      .filter(Boolean)
      .sort(),
    owner: context.owner,
    removalCondition: redactedText(context.removalCondition),
    ...(context.planInstanceId
      ? { planInstanceId: redactedToken(context.planInstanceId) }
      : {}),
    ...(context.stepId ? { stepId: redactedToken(context.stepId) } : {}),
    ...(context.candidateCount !== undefined
      ? { candidateCount: nonNegativeInteger(context.candidateCount) }
      : {}),
    ...(context.assessmentCount !== undefined
      ? { assessmentCount: nonNegativeInteger(context.assessmentCount) }
      : {}),
    ...(context.routeCount !== undefined
      ? { routeCount: nonNegativeInteger(context.routeCount) }
      : {}),
  };
}

function formatPlanResolutionFailureMessage(
  code: PlanResolutionFailureCode,
  context: PlanResolutionFailureContext,
): string {
  return [
    `Plan resolution failed: ${code}`,
    `side=${context.side}`,
    `stateVersion=${context.stateVersion}`,
    `timing=${context.timingPoint}`,
    `actions=${context.legalActionTypes.join(",") || "none"}`,
    `owner=${context.owner}`,
  ].join(" ");
}

function nonNegativeInteger(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function redactedToken(value: string, fallback = ""): string {
  const normalized = value
    .trim()
    .replace(/[^a-zA-Z0-9_.:-]+/g, "_")
    .slice(0, 96);
  return normalized || fallback;
}

function redactedText(value: string): string {
  return value
    .trim()
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 240);
}
