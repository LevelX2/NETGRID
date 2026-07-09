import type { AiDecisionInput } from "@netgrid/shared";
import type { RunnerRunPlan } from "./runner-run-plan-types";
import { actionCreditCost } from "./action-cost";
import { currentEncounteredIceCard } from "./current-encounter";
import { isImmediateSafetyThreatSubroutine } from "./encounter-subroutine";
import {
  quoteRunnerRunPath,
  runnerRunPlanCurrentEncounterRequiresBreak,
  runnerRunPlanCurrentEncounterSafeSequence,
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
  const abortYieldChoice = runnerRunPlanAbortYieldContinueChoice(params);
  if (abortYieldChoice) return abortYieldChoice;
  const abortChoice = runnerRunPlanAbortChoice(params);
  if (abortChoice) return abortChoice;
  const encounterChoice = runnerRunPlanEncounterChoice(params);
  if (encounterChoice) return encounterChoice;
  const accessChoice = runnerRunPlanAccessChoice(params);
  if (accessChoice) return accessChoice;
  const selected =
    runnerRunPlanBestRelevantChoice(params.choices) ??
    params.choices.find((choice) => !choice.exclusion);
  if (!selected) return undefined;
  return annotateRunnerRunPlanChoice({
    choice: selected,
    plan: params.plan,
    extraEvidence: [],
    explanation:
      "RunnerRunPlan führt die Entscheidung im aktiven Run anhand aktueller LegalActions.",
  });
}

function runnerRunPlanAbortYieldContinueChoice(params: {
  input: AiDecisionInput;
  plan: RunnerRunPlan;
  choices: readonly SemanticRuntimeChoice[];
}): SemanticRuntimeChoice | undefined {
  if (params.plan.revalidation.status !== "abort_recommended") {
    return undefined;
  }
  const run = params.input.playerView.run;
  if (!run || run.phase !== "movement") return undefined;
  const jackOutChoice = params.choices.find(
    (choice) => !choice.exclusion && choice.action.type === "jack_out",
  );
  const continueChoice = [...params.choices]
    .filter(
      (choice) =>
        !choice.exclusion &&
        choice.action.type === "continue_run" &&
        choice.action.payload?.encounterWillEndRun !== true,
    )
    .sort((left, right) => right.score - left.score)[0];
  if (!jackOutChoice || !continueChoice) return undefined;
  if (continueChoice.score <= jackOutChoice.score) return undefined;
  if (currentEncounterHasUnbrokenSafetyThreat(params.input)) return undefined;
  return annotateRunnerRunPlanChoice({
    choice: continueChoice,
    plan: params.plan,
    explanation:
      "RunnerRunPlan setzt den Run im Bewegungsfenster fort, weil Fortsetzen sichtbar besser ist als Jack-out und kein Encounter-Ende droht.",
    extraEvidence: [
      "runner_run_plan_abort_yielded_to_continue:true",
      `runner_run_plan_abort_status:${params.plan.revalidation.status}`,
      `runner_run_plan_continue_score:${continueChoice.score}`,
      `runner_run_plan_jack_out_score:${jackOutChoice.score}`,
      ...params.plan.revalidation.reasons.map(
        (reason) => `runner_run_plan_abort_yield_reason:${reason}`,
      ),
    ],
  });
}

function runnerRunPlanAccessChoice(params: {
  input: AiDecisionInput;
  plan: RunnerRunPlan;
  choices: readonly SemanticRuntimeChoice[];
}): SemanticRuntimeChoice | undefined {
  const accessChoices = params.choices.filter(
    (choice) =>
      !choice.exclusion &&
      runnerRunPlanAccessActionTypes.has(choice.action.type),
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
        : (declineLowValueChoice ?? scoreSelected);
  if (!selected) return undefined;
  return annotateRunnerRunPlanChoice({
    choice: selected,
    plan: params.plan,
    explanation:
      "RunnerRunPlan entscheidet den Zugriff anhand AccessIntent und Reserve.",
    extraEvidence: [
      `runner_run_plan_access_selected:${selected.action.type}`,
      `runner_run_plan_access_trash_policy:${trashPolicy ?? "none"}`,
      `runner_run_plan_access_reserve:${reserveTarget}`,
      ...(trashBreaksReserve
        ? ["runner_run_plan_access_trash_breaks_reserve:true"]
        : []),
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
  if (!jackOutChoice) {
    const continueChoice = params.choices.find(
      (choice) =>
        !choice.exclusion &&
        choice.action.type === "continue_run" &&
        choice.action.payload?.encounterContinue === true,
    );
    if (!continueChoice) return undefined;
    return annotateRunnerRunPlanChoice({
      choice: continueChoice,
      plan: params.plan,
      explanation:
        "RunnerRunPlan lässt die Encounter-Subroutinen auslösen, weil keine access-erhaltende Sequenz bezahlbar ist und kein Jack-out legal ist.",
      extraEvidence: [
        "runner_run_plan_conserve_credits:true",
        "runner_run_plan_encounter_sequence_missing:true",
        "runner_run_plan_no_jack_out_available:true",
      ],
    });
  }
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
  const safeSequence = runnerRunPlanCurrentEncounterSafeSequence({
    input: params.input,
    plan: params.plan,
  });
  const safeSequenceActionId = safeSequence?.steps[0]?.actionId;
  if (safeSequenceActionId) {
    const safetyChoice = params.choices.find(
      (choice) =>
        !choice.exclusion && choice.action.actionId === safeSequenceActionId,
    );
    if (safetyChoice) {
      return annotateRunnerRunPlanChoice({
        choice: safetyChoice,
        plan: params.plan,
        explanation:
          "RunnerRunPlan wählt den nächsten Safety-Step, um unmittelbaren permanenten Schaden oder Programmverlust zu verhindern.",
        extraEvidence: [
          "runner_run_plan_safety_sequence_selected:true",
          `runner_run_plan_sequence_cost:${safeSequence.totalCost}`,
          `runner_run_plan_sequence_uses_pump:${safeSequence.usesPump}`,
          `runner_run_plan_sequence_uses_break:${safeSequence.usesBreak}`,
          ...safeSequence.riskTags.map(
            (riskTag) => `runner_run_plan_sequence_risk:${riskTag}`,
          ),
          ...(safeSequence.evidence ?? []),
        ],
      });
    }
  }

  const sequence = runnerRunPlanCurrentEncounterSequence({
    input: params.input,
    plan: params.plan,
  });
  const sequenceActionId = sequence?.steps[0]?.actionId;
  if (sequenceActionId) {
    const conserveChoice = runnerRunPlanConserveCreditsChoice({
      input: params.input,
      plan: params.plan,
      choices: params.choices,
    });
    if (conserveChoice) return conserveChoice;
    const sequenceChoice = params.choices.find(
      (choice) =>
        !choice.exclusion && choice.action.actionId === sequenceActionId,
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

function runnerRunPlanConserveCreditsChoice(params: {
  input: AiDecisionInput;
  plan: RunnerRunPlan;
  choices: readonly SemanticRuntimeChoice[];
}): SemanticRuntimeChoice | undefined {
  const pathQuote = quoteRunnerRunPath(params.input, params.plan);
  if (pathQuote.canReachAccess) return undefined;
  const continueChoice = params.choices.find(
    (choice) =>
      !choice.exclusion &&
      choice.action.type === "continue_run" &&
      choice.action.payload?.encounterContinue === true &&
      choice.action.payload?.encounterWillEndRun === true,
  );
  if (!continueChoice) return undefined;
  if (currentEncounterHasUnbrokenSafetyThreat(params.input)) return undefined;
  return annotateRunnerRunPlanChoice({
    choice: continueChoice,
    plan: params.plan,
    explanation:
      "RunnerRunPlan spart Encounter-Kosten, weil der bekannte Restpfad den Zugriff nicht mehr erreicht.",
    extraEvidence: [
      "runner_run_plan_conserve_credits:true",
      `runner_run_plan_conserve_reason:${pathQuote.cannotReachReason ?? "cannot_reach_access"}`,
      `runner_run_plan_conserve_total_known_cost:${pathQuote.totalKnownCost}`,
      `runner_run_plan_conserve_expected_remaining:${pathQuote.expectedRemainingCredits}`,
    ],
  });
}

function currentEncounterHasUnbrokenSafetyThreat(input: AiDecisionInput): boolean {
  const continueAction = input.legalActions.find(
    (action) =>
      action.type === "continue_run" &&
      action.payload?.encounterContinue === true,
  );
  const subroutines =
    currentEncounteredIceCard(input)?.effectiveRunQuote?.subroutines ?? [];
  if (subroutines.length === 0) return false;
  const subroutineIds =
    typeof continueAction?.payload?.encounterSubroutineIds === "string"
      ? new Set(
          continueAction.payload.encounterSubroutineIds
            .split(",")
            .filter((id) => id.length > 0),
        )
      : undefined;
  const unbrokenSubroutines =
    subroutineIds && subroutineIds.size > 0
      ? subroutines.filter((subroutine) => subroutineIds.has(subroutine.id))
      : continueAction?.payload?.unbrokenSubroutineCount
        ? subroutines
        : [];
  return unbrokenSubroutines.some(isImmediateSafetyThreatSubroutine);
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
      ...runnerRunPlanSpecialBudgetEvidence(plan),
      `runner_run_plan_path_quote_status:${plan.pathQuote.quoteStatus}`,
      `runner_run_plan_path_quote_total_known_cost:${plan.pathQuote.totalKnownCost}`,
      `runner_run_plan_path_quote_expected_remaining:${plan.pathQuote.expectedRemainingCredits}`,
      `runner_run_plan_path_quote_can_reach:${plan.pathQuote.canReachAccess}`,
      ...(plan.pathQuote.cannotReachReason
        ? [
            `runner_run_plan_path_quote_cannot_reach:${plan.pathQuote.cannotReachReason}`,
          ]
        : []),
      ...(plan.currentObligation
        ? [`runner_run_plan_current_obligation:${plan.currentObligation.kind}`]
        : []),
      ...params.extraEvidence,
    ],
  };
}

function runnerRunPlanSpecialBudgetEvidence(plan: RunnerRunPlan): string[] {
  return [
    plan.budget.runOnlyCredits > 0
      ? `runner_run_plan_budget_run_only:${plan.budget.runOnlyCredits}`
      : undefined,
    plan.budget.recurringBreakerCredits > 0
      ? `runner_run_plan_budget_recurring_breaker:${plan.budget.recurringBreakerCredits}`
      : undefined,
    plan.budget.recurringKillerCredits > 0
      ? `runner_run_plan_budget_recurring_killer:${plan.budget.recurringKillerCredits}`
      : undefined,
    plan.budget.recurringLinkCredits > 0
      ? `runner_run_plan_budget_recurring_link:${plan.budget.recurringLinkCredits}`
      : undefined,
    plan.budget.stealthCredits > 0
      ? `runner_run_plan_budget_stealth:${plan.budget.stealthCredits}`
      : undefined,
    plan.budget.nonNoisyBreakerCredits > 0
      ? `runner_run_plan_budget_non_noisy_breaker:${plan.budget.nonNoisyBreakerCredits}`
      : undefined,
    plan.budget.maxSpendThisRun !== undefined
      ? `runner_run_plan_budget_max_spend:${plan.budget.maxSpendThisRun}`
      : undefined,
  ].filter((entry): entry is string => entry !== undefined);
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

function runnerRunPlanBestRelevantChoice(
  choices: readonly SemanticRuntimeChoice[],
): SemanticRuntimeChoice | undefined {
  return [...choices]
    .filter(
      (choice) =>
        !choice.exclusion &&
        runnerRunPlanRelevantActionTypes.has(choice.action.type),
    )
    .sort(
      (left, right) =>
        right.score - left.score ||
        runnerRunPlanFallbackTypePriority(right.action.type) -
          runnerRunPlanFallbackTypePriority(left.action.type),
    )[0];
}

function runnerRunPlanFallbackTypePriority(actionType: string): number {
  if (actionType === "steal_agenda") return 8;
  if (actionType === "access_card") return 7;
  if (actionType === "trash_accessed_card") return 6;
  if (actionType === "decline_trash") return 5;
  if (actionType === "continue_run") return 4;
  if (actionType === "break_subroutine") return 3;
  if (actionType === "pump_breaker") return 2;
  if (actionType === "jack_out") return 1;
  return 0;
}

const runnerRunPlanAccessActionTypes = new Set([
  "access_card",
  "steal_agenda",
  "trash_accessed_card",
  "decline_trash",
]);
