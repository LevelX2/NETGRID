import type { Side } from "@netgrid/shared";
import {
  TACTICAL_PLAN_SCHEMA_VERSION,
  type PlanBlocker,
  type PlanLifecycle,
  type PlanMappingStatus,
  type PlanScoreBreakdown,
  type PlanStep,
  type PlanStepKind,
  type PlanTarget,
  type RequiredCapability,
  type TacticalPlan,
  type TacticalPlanType,
} from "./tactical-plan-types";

export function createPlanStep(params: {
  stepId: string;
  kind: PlanStepKind;
  desiredActionSemantics: string[];
  requiredCapabilities?: RequiredCapability[];
  mappingStatus?: PlanMappingStatus;
  actionCandidateIds?: string[];
  rationale?: string[];
}): PlanStep {
  return {
    stepId: params.stepId,
    kind: params.kind,
    desiredActionSemantics: [...params.desiredActionSemantics],
    requiredCapabilities: [...(params.requiredCapabilities ?? [])],
    ...(params.mappingStatus ? { mappingStatus: params.mappingStatus } : {}),
    actionCandidateIds: [...(params.actionCandidateIds ?? [])],
    rationale: [...(params.rationale ?? [])],
  };
}

export function createTacticalPlan(params: {
  planId: string;
  side: Side;
  type: TacticalPlanType;
  status?: PlanLifecycle;
  priority: number;
  horizonTurns: number;
  target?: PlanTarget;
  requiredCapabilities?: RequiredCapability[];
  blockers?: PlanBlocker[];
  currentStep: PlanStep;
  nextSteps?: PlanStep[];
  evidence?: string[];
  scoreBreakdown?: PlanScoreBreakdown[];
  stateVersion: number;
}): TacticalPlan {
  const blockers = [...(params.blockers ?? [])];
  const status =
    params.status ?? (blockers.length > 0 ? "blocked" : "proposed");
  return {
    schemaVersion: TACTICAL_PLAN_SCHEMA_VERSION,
    planId: params.planId,
    side: params.side,
    type: params.type,
    status,
    priority: params.priority,
    horizonTurns: params.horizonTurns,
    ...(params.target ? { target: params.target } : {}),
    requiredCapabilities: [...(params.requiredCapabilities ?? [])],
    blockers,
    currentStep: params.currentStep,
    nextSteps: [...(params.nextSteps ?? [])],
    evidence: [...(params.evidence ?? [])],
    scoreBreakdown: [...(params.scoreBreakdown ?? [])],
    createdAtStateVersion: params.stateVersion,
    updatedAtStateVersion: params.stateVersion,
  };
}
