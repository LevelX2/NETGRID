import type { AiDecisionInput } from "@netgrid/shared";
import type { RunnerRunPlan } from "./runner-run-plan-types";
import { runnerRunPlanCurrentEncounterSequence } from "./runner-run-plan-path-quote";
import type { SemanticRuntimeChoice } from "./semantic-runtime-types";

export function runnerRunPlanSemanticChoice(params: {
  input: AiDecisionInput;
  plan: RunnerRunPlan;
  choices: readonly SemanticRuntimeChoice[];
}): SemanticRuntimeChoice | undefined {
  if (params.input.side !== "runner" || !params.input.playerView.run) {
    return undefined;
  }
  const encounterChoice = runnerRunPlanEncounterChoice(params);
  if (encounterChoice) return encounterChoice;
  const selected =
    params.choices.find(
      (choice) =>
        !choice.exclusion &&
        runnerRunPlanRelevantActionTypes.has(choice.action.type),
    ) ?? params.choices.find((choice) => !choice.exclusion);
  if (!selected) return undefined;
  return annotateRunnerRunPlanChoice({
    choice: selected,
    plan: params.plan,
    extraEvidence: [],
    explanation:
      "RunnerRunPlan führt die Entscheidung im aktiven Run anhand aktueller LegalActions.",
  });
}

function runnerRunPlanEncounterChoice(params: {
  input: AiDecisionInput;
  plan: RunnerRunPlan;
  choices: readonly SemanticRuntimeChoice[];
}): SemanticRuntimeChoice | undefined {
  const sequence = runnerRunPlanCurrentEncounterSequence({
    input: params.input,
    plan: params.plan,
  });
  const sequenceActionId = sequence?.steps[0]?.actionId;
  if (sequenceActionId) {
    const sequenceChoice = params.choices.find(
      (choice) => !choice.exclusion && choice.action.actionId === sequenceActionId,
    );
    if (sequenceChoice) {
      return annotateRunnerRunPlanChoice({
        choice: sequenceChoice,
        plan: params.plan,
        explanation:
          "RunnerRunPlan wählt den nächsten legalen Step der aktuellen Encounter-Sequenz.",
        extraEvidence: [
          "runner_run_plan_sequence_selected:true",
          `runner_run_plan_sequence_cost:${sequence.totalCost}`,
          `runner_run_plan_sequence_uses_pump:${sequence.usesPump}`,
          `runner_run_plan_sequence_uses_break:${sequence.usesBreak}`,
          ...sequence.riskTags.map(
            (riskTag) => `runner_run_plan_sequence_risk:${riskTag}`,
          ),
          ...(sequence.evidence ?? []),
        ],
      });
    }
  }

  if (!encounterContinueWillEndRun(params.input)) return undefined;
  const jackOutChoice = params.choices.find(
    (choice) => !choice.exclusion && choice.action.type === "jack_out",
  );
  if (!jackOutChoice) return undefined;
  return annotateRunnerRunPlanChoice({
    choice: jackOutChoice,
    plan: params.plan,
    explanation:
      "RunnerRunPlan bricht den Run ab, weil keine access-erhaltende Encounter-Sequenz quotierbar ist.",
    extraEvidence: [
      "runner_run_plan_abort_recommended:true",
      "runner_run_plan_encounter_sequence_missing:true",
    ],
  });
}

function annotateRunnerRunPlanChoice(params: {
  choice: SemanticRuntimeChoice;
  plan: RunnerRunPlan;
  explanation: string;
  extraEvidence: readonly string[];
}): SemanticRuntimeChoice {
  const { choice, plan } = params;
  return {
    ...choice,
    reasonCode: `runner.run_plan.${choice.scopeId}`,
    explanation: params.explanation,
    evidence: [
      ...choice.evidence,
      "runner_run_plan_active:true",
      `runner_run_plan_id:${plan.id}`,
      `runner_run_plan_lifecycle:${plan.lifecycle}`,
      `runner_run_plan_origin:${plan.origin}`,
      `runner_run_plan_objective:${plan.objective.kind}`,
      `runner_run_plan_target:${plan.targetServer.id}`,
      `runner_run_plan_revalidation:${plan.revalidation.status}`,
      ...params.extraEvidence,
    ],
  };
}

function encounterContinueWillEndRun(input: AiDecisionInput): boolean {
  return input.legalActions.some(
    (action) =>
      action.type === "continue_run" &&
      action.payload?.encounterContinue === true &&
      action.payload?.encounterWillEndRun === true,
  );
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
