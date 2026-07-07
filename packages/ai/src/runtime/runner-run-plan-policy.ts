import type { AiDecisionInput } from "@netgrid/shared";
import type { RunnerRunPlan } from "./runner-run-plan-types";
import type { SemanticRuntimeChoice } from "./semantic-runtime-types";

export function runnerRunPlanSemanticChoice(params: {
  input: AiDecisionInput;
  plan: RunnerRunPlan;
  choices: readonly SemanticRuntimeChoice[];
}): SemanticRuntimeChoice | undefined {
  if (params.input.side !== "runner" || !params.input.playerView.run) {
    return undefined;
  }
  const selected =
    params.choices.find(
      (choice) =>
        !choice.exclusion &&
        runnerRunPlanRelevantActionTypes.has(choice.action.type),
    ) ?? params.choices.find((choice) => !choice.exclusion);
  if (!selected) return undefined;
  return {
    ...selected,
    reasonCode: `runner.run_plan.${selected.scopeId}`,
    explanation:
      "RunnerRunPlan führt die Entscheidung im aktiven Run anhand aktueller LegalActions.",
    evidence: [
      ...selected.evidence,
      "runner_run_plan_active:true",
      `runner_run_plan_id:${params.plan.id}`,
      `runner_run_plan_lifecycle:${params.plan.lifecycle}`,
      `runner_run_plan_origin:${params.plan.origin}`,
      `runner_run_plan_objective:${params.plan.objective.kind}`,
      `runner_run_plan_target:${params.plan.targetServer.id}`,
      `runner_run_plan_revalidation:${params.plan.revalidation.status}`,
    ],
  };
}

const runnerRunPlanRelevantActionTypes = new Set([
  "pump_breaker",
  "break_subroutine",
  "continue_run",
  "jack_out",
  "access_card",
  "steal_agenda",
  "trash_accessed_card",
  "decline_trash",
]);
