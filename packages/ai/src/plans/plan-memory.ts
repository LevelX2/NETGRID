import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { resetStrategicIntentMemory } from "../strategic-intent-memory";
import { TACTICAL_PLAN_SCHEMA_VERSION } from "./tactical-plan-types";
import type {
  PlanProgressionStatus,
  PlanStep,
  TacticalPlan,
  TacticalPlanMemorySnapshot,
  TacticalPlanRuntimeResult,
} from "./tactical-plan-types";

const tacticalPlanMemoryByKey = new Map<string, TacticalPlanMemorySnapshot>();

export function getTacticalPlanMemorySnapshot(
  input: AiDecisionInput,
): TacticalPlanMemorySnapshot | undefined {
  if (input.playerView.winner !== null) {
    tacticalPlanMemoryByKey.delete(tacticalPlanMemoryKey(input));
    return undefined;
  }
  return tacticalPlanMemoryByKey.get(tacticalPlanMemoryKey(input));
}

export function rememberTacticalPlanRuntime(
  input: AiDecisionInput,
  result: TacticalPlanRuntimeResult,
  selectedAction: LegalAction,
): TacticalPlanMemorySnapshot | undefined {
  if (input.playerView.winner !== null) {
    tacticalPlanMemoryByKey.delete(tacticalPlanMemoryKey(input));
    return undefined;
  }
  const selectedPlan = result.selectedPlan;
  const selectedStep = result.selectedStep;
  if (!selectedPlan || !selectedStep) return undefined;
  const snapshot = createTacticalPlanMemorySnapshot({
    input,
    plan: selectedPlan,
    step: selectedStep,
    selectedAction,
    ...(result.previousPlan ? { previousPlan: result.previousPlan } : {}),
    ...(result.planProgressionReason
      ? { planProgressionReason: result.planProgressionReason }
      : {}),
    ...(result.whyPlanAbandoned
      ? { whyPlanAbandoned: result.whyPlanAbandoned }
      : {}),
  });
  tacticalPlanMemoryByKey.set(tacticalPlanMemoryKey(input), snapshot);
  return snapshot;
}

export function resetTacticalPlanMemory(): void {
  tacticalPlanMemoryByKey.clear();
  resetStrategicIntentMemory();
}

function tacticalPlanMemoryKey(input: AiDecisionInput): string {
  return `${tacticalPlanMemoryContextId(input)}:${input.side}:${input.profileId}`;
}

function tacticalPlanMemoryContextId(input: AiDecisionInput): string {
  const [decisionScope] = input.decisionId.split(":");
  if (decisionScope && decisionScope.length > 0) return decisionScope;
  return input.seed;
}


function samePlanLine(
  plan: TacticalPlan,
  previousPlan: TacticalPlanMemorySnapshot,
): boolean {
  if (plan.type !== previousPlan.type) return false;
  if (!plan.target && !previousPlan.target) return true;
  return plan.target?.kind === previousPlan.target?.kind &&
    plan.target?.id === previousPlan.target?.id;
}

export function createTacticalPlanMemorySnapshot(params: {
  input: AiDecisionInput;
  plan: TacticalPlan;
  step: PlanStep;
  selectedAction: LegalAction;
  previousPlan?: TacticalPlanMemorySnapshot;
  planProgressionReason?: string;
  whyPlanAbandoned?: string;
}): TacticalPlanMemorySnapshot {
  const status = planMemoryStatus(params.plan, params.step);
  const ttlDecisionsRemaining =
    params.plan.type === "runner.opportunistic_central_run"
      ? Math.max(0, (params.previousPlan?.ttlDecisionsRemaining ?? 1) - 1)
      : 2;
  return {
    schemaVersion: TACTICAL_PLAN_SCHEMA_VERSION,
    memoryId: tacticalPlanMemoryKey(params.input),
    side: params.plan.side,
    planId: params.plan.planId,
    type: params.plan.type,
    status,
    ...(params.plan.target ? { target: params.plan.target } : {}),
    selectedStepKind: params.step.kind,
    selectedActionId: params.selectedAction.actionId,
    blockedBy: params.plan.blockers.map((blocker) => blocker.kind),
    ttlDecisionsRemaining,
    planProgressionReason:
      params.planProgressionReason ??
      (params.previousPlan && samePlanLine(params.plan, params.previousPlan)
        ? "continued_previous_plan"
        : "selected_new_plan"),
    ...(params.whyPlanAbandoned
      ? { whyPlanAbandoned: params.whyPlanAbandoned }
      : {}),
    updatedAtStateVersion: params.input.playerView.stateVersion,
  };
}

function planMemoryStatus(
  plan: TacticalPlan,
  step: PlanStep,
): PlanProgressionStatus {
  if (plan.status === "abandoned") return "abandoned";
  if (plan.status === "blocked") return "blocked";
  if (step.mappingStatus === "matched") {
    if (plan.type === "runner.opportunistic_central_run") return "satisfied";
    if (plan.type === "runner.cash_out_credit_bank") return "satisfied";
    if (plan.type === "corp.rez_defense") return "satisfied";
    if (plan.type === "corp.create_score_window" && step.kind === "score_agenda") {
      return "satisfied";
    }
    return "progressing";
  }
  return "active";
}
