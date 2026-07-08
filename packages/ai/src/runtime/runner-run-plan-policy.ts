import type { AiDecisionInput } from "@netgrid/shared";
import type { RunnerRunPlan } from "./runner-run-plan-types";
import { actionCreditCost } from "./action-cost";
import {
  runnerRunPlanCurrentEncounterRequiresBreak,
  runnerRunPlanCurrentEncounterSequence,
} from "./runner-run-plan-path-quote";
import type { SemanticRuntimeChoice } from "./semantic-runtime-types";

export function runnerRunPlanSemanticChoice(params: {
  input: AiDecisionInput;
  plan: RunnerRunPlan;
  choices: readonly SemanticRuntimeChoice[];
}): SemanticRuntimeChoice | undefined {
  if (params.input.side !== "runner" || !params.input.playerView.run) {
    return undefined;
  }
  const abortChoice = runnerRunPlanAbortChoice(params);
  if (abortChoice) return abortChoice;
  const encounterChoice = runnerRunPlanEncounterChoice(params);
  if (encounterChoice) return encounterChoice;
  const accessChoice = runnerRunPlanAccessChoice(params);
  if (accessChoice) return accessChoice;
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

function runnerRunPlanAccessChoice(params: {
  input: AiDecisionInput;
  plan: RunnerRunPlan;
  choices: readonly SemanticRuntimeChoice[];
}): SemanticRuntimeChoice | undefined {
  const accessChoices = params.choices.filter(
    (choice) => !choice.exclusion && runnerRunPlanAccessActionTypes.has(choice.action.type),
  );
  if (accessChoices.length === 0) return undefined;
  const scoreSelected = runnerRunPlanBestAccessChoice(accessChoices);
  const reserveTarget = runnerRunPlanAccessReserveTarget(params.plan);
  if (params.plan.revalidation.status === "invalid") {
    if (!scoreSelected) return undefined;
    return annotateRunnerRunPlanChoice({
      choice: scoreSelected,
      plan: params.plan,
      explanation:
        "RunnerRunPlan ist invalidiert; die Access-Entscheidung faellt auf die aktuelle semantische Bewertung zurueck.",
      extraEvidence: [
        `runner_run_plan_access_selected:${scoreSelected.action.type}`,
        `runner_run_plan_access_trash_policy:${params.plan.accessIntent?.trashPolicy ?? "none"}`,
        `runner_run_plan_access_reserve:${reserveTarget}`,
        "runner_run_plan_access_score_fallback:true",
        "runner_run_plan_access_fallback_reason:invalid_revalidation",
      ],
    });
  }
  const stealChoice = accessChoices.find(
    (choice) => choice.action.type === "steal_agenda",
  );
  if (stealChoice) {
    return annotateRunnerRunPlanChoice({
      choice: stealChoice,
      plan: params.plan,
      explanation: "RunnerRunPlan setzt den Run-Zweck durch Agenda-Steal fort.",
      extraEvidence: ["runner_run_plan_access_selected:steal_agenda"],
    });
  }
  const openAccessChoice = accessChoices.find(
    (choice) => choice.action.type === "access_card",
  );
  if (openAccessChoice) {
    return annotateRunnerRunPlanChoice({
      choice: openAccessChoice,
      plan: params.plan,
      explanation: "RunnerRunPlan setzt den Run-Zweck durch Zugriff fort.",
      extraEvidence: ["runner_run_plan_access_selected:access_card"],
    });
  }
  const trashChoice = accessChoices.find(
    (choice) => choice.action.type === "trash_accessed_card",
  );
  const declineChoice = accessChoices.find(
    (choice) => choice.action.type === "decline_trash",
  );
  const trashBreaksReserve =
    trashChoice !== undefined &&
    params.input.playerView.own.credits - actionCreditCost(trashChoice.action) <
      reserveTarget;
  const trashPolicy = params.plan.accessIntent?.trashPolicy;
  const declineLowValueChoice =
    declineChoice &&
    trashPolicy === "decline_low_value" &&
    (trashChoice === undefined || declineChoice.score >= trashChoice.score)
      ? declineChoice
      : undefined;
  const declineLowValueYieldedToScore =
    trashPolicy === "decline_low_value" &&
    trashChoice !== undefined &&
    declineChoice !== undefined &&
    trashChoice.score > declineChoice.score;
  const selected =
    trashChoice && trashPolicy === "must_trash_target"
      ? trashChoice
      : declineChoice && trashBreaksReserve
          ? declineChoice
          : declineLowValueChoice ?? scoreSelected;
  if (!selected) return undefined;
  return annotateRunnerRunPlanChoice({
    choice: selected,
    plan: params.plan,
    explanation: "RunnerRunPlan entscheidet den Zugriff anhand AccessIntent und Reserve.",
    extraEvidence: [
      `runner_run_plan_access_selected:${selected.action.type}`,
      `runner_run_plan_access_trash_policy:${trashPolicy ?? "none"}`,
      `runner_run_plan_access_reserve:${reserveTarget}`,
      ...(trashBreaksReserve ? ["runner_run_plan_access_trash_breaks_reserve:true"] : []),
      ...(declineLowValueYieldedToScore
        ? ["runner_run_plan_access_decline_low_value_yielded_to_score:true"]
        : []),
    ],
  });
}

function runnerRunPlanAbortChoice(params: {
  plan: RunnerRunPlan;
  choices: readonly SemanticRuntimeChoice[];
}): SemanticRuntimeChoice | undefined {
  if (
    params.plan.revalidation.status !== "abort_recommended" &&
    params.plan.revalidation.status !== "invalid"
  ) {
    return undefined;
  }
  const jackOutChoice = params.choices.find(
    (choice) => !choice.exclusion && choice.action.type === "jack_out",
  );
  if (!jackOutChoice) return undefined;
  return annotateRunnerRunPlanChoice({
    choice: jackOutChoice,
    plan: params.plan,
    explanation:
      "RunnerRunPlan bricht den Run nach Revalidation ab, weil das Ziel nicht mehr belastbar erreichbar ist.",
    extraEvidence: [
      "runner_run_plan_abort_recommended:true",
      `runner_run_plan_abort_status:${params.plan.revalidation.status}`,
      ...params.plan.revalidation.reasons.map(
        (reason) => `runner_run_plan_abort_reason:${reason}`,
      ),
    ],
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

  const requiredBreakMissing = runnerRunPlanCurrentEncounterRequiresBreak({
    input: params.input,
  });
  if (!encounterContinueWillEndRun(params.input) && !requiredBreakMissing) {
    return undefined;
  }
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
      ...(requiredBreakMissing
        ? ["runner_run_plan_encounter_required_break_missing:true"]
        : []),
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
      `runner_run_plan_budget_available:${plan.budget.availableCredits}`,
      `runner_run_plan_budget_reserved:${runnerRunPlanAccessReserveTarget(plan)}`,
      `runner_run_plan_path_quote_status:${plan.pathQuote.quoteStatus}`,
      `runner_run_plan_path_quote_total_known_cost:${plan.pathQuote.totalKnownCost}`,
      `runner_run_plan_path_quote_expected_remaining:${plan.pathQuote.expectedRemainingCredits}`,
      `runner_run_plan_path_quote_can_reach:${plan.pathQuote.canReachAccess}`,
      ...(plan.pathQuote.cannotReachReason
        ? [`runner_run_plan_path_quote_cannot_reach:${plan.pathQuote.cannotReachReason}`]
        : []),
      ...(plan.currentObligation
        ? [`runner_run_plan_current_obligation:${plan.currentObligation.kind}`]
        : []),
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

function runnerRunPlanAccessReserveTarget(plan: RunnerRunPlan): number {
  return Math.max(
    0,
    plan.accessIntent?.reserveForStealOrTrash ?? 0,
    plan.reserve.preserveStealOrTrashCredits,
    plan.budget.reservedCreditsForSteal,
    plan.budget.reservedCreditsForTrash,
    plan.budget.reservedCreditsAfterRun,
  );
}

function runnerRunPlanAccessTypePriority(actionType: string): number {
  if (actionType === "steal_agenda") return 4;
  if (actionType === "access_card") return 3;
  if (actionType === "trash_accessed_card") return 2;
  if (actionType === "decline_trash") return 1;
  return 0;
}

function runnerRunPlanBestAccessChoice(
  choices: readonly SemanticRuntimeChoice[],
): SemanticRuntimeChoice | undefined {
  return [...choices].sort(
    (left, right) =>
      right.score - left.score ||
      runnerRunPlanAccessTypePriority(right.action.type) -
        runnerRunPlanAccessTypePriority(left.action.type),
  )[0];
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

const runnerRunPlanAccessActionTypes = new Set([
  "access_card",
  "steal_agenda",
  "trash_accessed_card",
  "decline_trash",
]);
