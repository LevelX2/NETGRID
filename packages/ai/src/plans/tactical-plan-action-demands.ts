import {
  createActionDemand,
  type ActionDemand,
  type ActionDemandDeadline,
  type ActionDemandHardness,
  type ActionDemandPriority,
  type ActionDemandPurpose,
  type ActionDemandRestriction,
} from "./action-demand";
import type { PlanStepKind, TacticalPlan } from "./tactical-plan-types";

const SCORE_ACTION_STEPS = new Set<PlanStepKind>([
  "install_or_prepare_agenda",
  "gain_action_capacity",
  "convert_advancement",
  "advance_score_card",
  "score_agenda",
]);
const ACTION_CONSUMING_SCORE_STEPS = new Set<PlanStepKind>([
  "install_or_prepare_agenda",
  "convert_advancement",
  "advance_score_card",
]);

export function deriveTacticalPlanActionDemands(
  plan: TacticalPlan,
  currentActions: number,
): ActionDemand[] {
  assertNonNegativeSafeInteger(currentActions, "currentActions");
  const purpose = actionDemandPurpose(plan);
  if (!purpose) return [];
  const targetActions = targetActionsForPlan(plan, purpose);
  if (targetActions <= 0) return [];
  const hardness = actionDemandHardness(plan);
  const deadline = actionDemandDeadline(plan, hardness);
  return [
    createActionDemand({
      demandId: `${plan.planId}:actions`,
      side: plan.side,
      sourcePlanId: plan.planId,
      purpose,
      priority: actionDemandPriority(purpose, hardness),
      hardness,
      deadline,
      currentActions,
      targetActions,
      acceptedRestrictions: acceptedRestrictionsForPurpose(purpose),
      requiredActionTypes: requiredActionTypesForPurpose(purpose),
      evidence: [
        `action_demand_source_plan:${plan.planId}`,
        `action_demand_source_step:${plan.currentStep.kind}`,
        `action_demand_target_from_plan:${targetActions}`,
      ],
    }),
  ];
}

export function publishTacticalPlanActionDemands(
  plan: TacticalPlan,
  currentActions: number,
): TacticalPlan {
  assertNonNegativeSafeInteger(currentActions, "currentActions");
  if ((plan.actionDemands?.length ?? 0) > 0) {
    return {
      ...plan,
      actionDemands: plan.actionDemands!.map((demand) =>
        createActionDemand({
          ...demand,
          currentActions,
          evidence: demand.evidence,
        }),
      ),
    };
  }
  const actionDemands = deriveTacticalPlanActionDemands(plan, currentActions);
  return actionDemands.length > 0 ? { ...plan, actionDemands } : plan;
}

export function primaryActionDemandForPlan(
  plan: TacticalPlan,
  currentActions: number,
): ActionDemand | undefined {
  return deriveTacticalPlanActionDemands(plan, currentActions)[0];
}

function actionDemandPurpose(
  plan: TacticalPlan,
): ActionDemandPurpose | undefined {
  if (
    plan.side === "corp" &&
    (plan.type === "corp.create_score_window" ||
      SCORE_ACTION_STEPS.has(plan.currentStep.kind))
  )
    return "current_score_closeout";
  if (
    plan.side === "corp" &&
    [
      "protect_remote",
      "find_remote_protection",
      "build_remote",
      "rez_outer_ice",
    ].includes(plan.currentStep.kind)
  )
    return "current_remote_protection";
  if (
    plan.side === "runner" &&
    (plan.type === "runner.obtain_breaker_coverage" ||
      plan.currentStep.kind === "install_breaker")
  )
    return "current_breaker_install";
  if (
    plan.side === "runner" &&
    (plan.type === "runner.contest_remote" ||
      plan.type === "runner.opportunistic_central_run" ||
      plan.currentStep.kind === "run_target" ||
      plan.currentStep.kind === "probe_central")
  )
    return "current_run";
  if (
    plan.side === "runner" &&
    (plan.type === "runner.clear_tags_or_survive" ||
      plan.type === "runner.survival_defense" ||
      plan.type === "runner.restore_hand_buffer" ||
      ["clear_tags", "find_survival_answer", "draw_hand_buffer"].includes(
        plan.currentStep.kind,
      ))
  )
    return "current_survival_sequence";
  if (plan.currentStep.followupBudget) return "foreground_plan";
  return undefined;
}

function targetActionsForPlan(
  plan: TacticalPlan,
  purpose: ActionDemandPurpose,
): number {
  const budgetTarget = Math.max(
    0,
    plan.currentStep.followupBudget?.requiredFollowupActions ?? 0,
  );
  if (purpose === "current_score_closeout") {
    const scoreSequenceActions = [plan.currentStep, ...plan.nextSteps].filter(
      (step) => ACTION_CONSUMING_SCORE_STEPS.has(step.kind),
    ).length;
    return boundedTarget(Math.max(1, budgetTarget, scoreSequenceActions));
  }
  return boundedTarget(Math.max(1, budgetTarget));
}

function actionDemandHardness(plan: TacticalPlan): ActionDemandHardness {
  return plan.blockers.some((blocker) => blocker.severity === "hard")
    ? "hard"
    : "soft";
}

function actionDemandDeadline(
  plan: TacticalPlan,
  hardness: ActionDemandHardness,
): ActionDemandDeadline {
  if (hardness === "hard") return "before_current_plan_action";
  if (plan.currentStep.followupBudget?.horizon === "next_turn_allowed")
    return "start_of_next_own_turn";
  if (plan.horizonTurns > 1) return "within_three_own_turns";
  return "end_of_current_turn";
}

function actionDemandPriority(
  purpose: ActionDemandPurpose,
  hardness: ActionDemandHardness,
): ActionDemandPriority {
  if (hardness === "hard") return "acute_hard_plan_blocker";
  if (purpose === "next_turn_setup") return "next_own_turn";
  if (purpose === "tactical_reserve") return "tactical_reserve";
  if (purpose === "phase_reserve") return "phase_reserve";
  return "current_foreground_plan";
}

function acceptedRestrictionsForPurpose(
  purpose: ActionDemandPurpose,
): ActionDemandRestriction[] {
  switch (purpose) {
    case "current_remote_protection":
      return ["unrestricted", "install_only"];
    case "current_breaker_install":
      return ["unrestricted", "install_only", "program_install_only"];
    case "current_run":
      return ["unrestricted", "run_only"];
    default:
      return ["unrestricted"];
  }
}

function requiredActionTypesForPurpose(purpose: ActionDemandPurpose): string[] {
  switch (purpose) {
    case "current_score_closeout":
      return ["install_card", "advance_card", "score_agenda"];
    case "current_remote_protection":
    case "current_breaker_install":
      return ["install_card"];
    case "current_run":
      return ["start_run"];
    case "current_survival_sequence":
      return ["draw_card", "remove_tag", "play_event", "install_card"];
    default:
      return [];
  }
}

function boundedTarget(value: number): number {
  assertNonNegativeSafeInteger(value, "targetActions");
  return Math.min(8, value);
}

function assertNonNegativeSafeInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative safe integer.`);
  }
}
