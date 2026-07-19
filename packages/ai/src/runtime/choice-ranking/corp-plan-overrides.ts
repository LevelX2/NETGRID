import type { AiDecisionInput } from "@netgrid/shared";
import type { PlanStepMappingResult } from "../../tactical-plans";
import type { SemanticRuntimeChoice } from "../semantic-runtime-types";
import {
  semanticRuntimeChoiceHasScoreBreakdownComponent,
  semanticRuntimeChoiceStrategicFitLevel,
  tacticalPlanCorpBoardTriageMismatchShouldYield,
} from "./semantic-choice-ranking-support";

export function strongerExistingCorpOverrideMustBePreserved(
  mapping: PlanStepMappingResult,
  existingOverride: SemanticRuntimeChoice | undefined,
  strategicOverride: SemanticRuntimeChoice,
): boolean {
  if (!existingOverride || existingOverride.score < strategicOverride.score) {
    return false;
  }
  if (mapping.plan.side === "runner") return true;
  return existingOverride.scoreBreakdown.some((component) =>
    ["corp_board_triage_alignment", "corp_operation_burst_economy"].includes(
      component.key,
    ),
  );
}

export function tacticalPlanCorpScoreConversionBlocksOffPlanOverride(
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
  mappedActionIds: ReadonlySet<string>,
): boolean {
  if (
    mappedChoice.action.type === "install_card" &&
    mappedChoice.score < 0 &&
    overrideChoice.score > 0 &&
    mappedChoice.scoreBreakdown.some(
      (component) =>
        component.value < 0 &&
        (component.key === "corp_game_ending_scoreline_exposure_penalty" ||
          component.key === "corp_unsafe_delayed_scoreline_exposure"),
    )
  ) {
    return false;
  }
  if (
    mappedChoice.score < 0 &&
    overrideChoice.score > 0 &&
    mappedChoice.scoreBreakdown.some(
      (component) =>
        component.key === "corp_remote_sprawl_penalty" && component.value < 0,
    )
  ) {
    return false;
  }
  return (
    mapping.plan.side === "corp" &&
    mapping.plan.type === "corp.create_score_window" &&
    (mapping.plan.status === "active" ||
      mapping.plan.status === "progressing") &&
    mapping.plan.evidence.includes(
      "corp_score_conversion_same_turn_guaranteed:true",
    ) &&
    mapping.plan.evidence.includes(
      "corp_score_sequence:same_turn_conversion",
    ) &&
    !mappedActionIds.has(overrideChoice.action.actionId)
  );
}

export function tacticalPlanCorpEconomyActivationBlocksOffPlanOverride(
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
  mappedActionIds: ReadonlySet<string>,
): boolean {
  if (
    tacticalPlanCorpBoardTriageMismatchShouldYield(
      mappedChoice,
      overrideChoice,
      overrideChoice.score - mappedChoice.score,
    )
  ) {
    return false;
  }
  if (
    overrideChoice.score > mappedChoice.score &&
    semanticRuntimeChoiceStrategicFitLevel(overrideChoice) !== "none" &&
    semanticRuntimeChoiceStrategicFitLevel(mappedChoice) === "none"
  ) {
    return false;
  }
  return (
    mapping.plan.side === "corp" &&
    (mapping.plan.type === "corp.develop_finite_economy" ||
      mapping.plan.type === "corp.activate_persistent_economy") &&
    (mapping.plan.status === "active" ||
      mapping.plan.status === "progressing") &&
    !mappedActionIds.has(overrideChoice.action.actionId)
  );
}

export function tacticalPlanCorpScorelineSupportBlocksOffPlanOverride(
  input: AiDecisionInput,
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
  mappedActionIds: ReadonlySet<string>,
): boolean {
  if (
    mappedChoice.score < 0 &&
    overrideChoice.score > 0 &&
    mappedChoice.scoreBreakdown.some(
      (component) =>
        component.key === "corp_board_triage_mismatch" && component.value < 0,
    ) &&
    overrideChoice.scoreBreakdown.some(
      (component) =>
        component.key === "corp_ice_placement_evaluator" &&
        component.value > 0 &&
        component.reason?.includes("rez_affordable:true") &&
        component.reason.includes("recommendation:install_now") &&
        /server:(hq|rd)(?:\||$)/.test(component.reason),
    )
  ) {
    return false;
  }

  if (
    mappedChoice.scoreBreakdown.some(
      (component) =>
        component.key === "corp_passive_scoreline_available" &&
        component.value < 0,
    ) &&
    overrideChoice.action.type === "advance_card" &&
    overrideChoice.score > mappedChoice.score
  ) {
    return false;
  }
  if (
    mappedChoice.scoreBreakdown.some(
      (component) =>
        (component.key === "corp_non_agenda_root_blocks_score_remote" ||
          component.key ===
            "corp_remote_scoreline_unfunded_ice_install_penalty" ||
          component.key === "corp_remote_sprawl_penalty") &&
        component.value < 0,
    ) &&
    overrideChoice.score > mappedChoice.score
  ) {
    return false;
  }
  if (
    overrideChoice.scoreBreakdown.some(
      (component) =>
        component.key === "corp_protected_matchpoint_scoreline" &&
        component.value > 0,
    )
  ) {
    return false;
  }
  if (
    tacticalPlanCorpBoardTriageMismatchShouldYield(
      mappedChoice,
      overrideChoice,
      overrideChoice.score - mappedChoice.score,
    )
  ) {
    return false;
  }
  if (
    tacticalPlanBuildRezReserveBurstEconomyShouldYield(
      input,
      mapping,
      mappedChoice,
      overrideChoice,
    )
  ) {
    return false;
  }
  return (
    mapping.plan.side === "corp" &&
    mapping.plan.type === "corp.create_score_window" &&
    mapping.plan.status === "progressing" &&
    (mapping.step.kind === "protect_remote" ||
      mapping.step.kind === "build_rez_reserve") &&
    !mappedActionIds.has(overrideChoice.action.actionId)
  );
}

function tacticalPlanBuildRezReserveBurstEconomyShouldYield(
  input: AiDecisionInput,
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
): boolean {
  if (
    mapping.plan.side !== "corp" ||
    mapping.plan.type !== "corp.create_score_window" ||
    mapping.plan.status !== "progressing" ||
    mapping.step.kind !== "build_rez_reserve" ||
    mappedChoice.action.type !== "gain_credit" ||
    overrideChoice.action.type !== "play_operation" ||
    overrideChoice.score <= mappedChoice.score ||
    input.playerView.own.stackOrRdCount <= 0
  ) {
    return false;
  }
  return overrideChoice.scoreBreakdown.some(
    (component) =>
      component.key === "corp_operation_burst_economy" && component.value > 0,
  );
}

const CORP_ACTIVE_REMOTE_ADVANCE_RUNNER_CREDIT_CEILING = 20;
const CORP_ACTIVE_REMOTE_ADVANCE_CRITICAL_CREDIT_CEILING = 2;

export function urgentCorpSemanticChoice(
  input: AiDecisionInput,
  choices: readonly SemanticRuntimeChoice[],
): SemanticRuntimeChoice | undefined {
  if (input.side !== "corp") return undefined;
  const viableChoices = choices.filter((choice) => !choice.exclusion);
  const scoreableAgenda = viableChoices
    .filter((choice) => choice.action.type === "score_agenda")
    .sort((left, right) => right.score - left.score)[0];
  if (scoreableAgenda) return scoreableAgenda;
  const matchpointProtection = viableChoices
    .filter(
      (choice) =>
        semanticRuntimeChoiceHasPositiveScoreBreakdownComponent(
          choice,
          "corp_matchpoint_hq_protection_alignment",
        ) &&
        !semanticRuntimeChoiceHasAnyScoreBreakdownComponent(choice, [
          "corp_matchpoint_hq_protection_mismatch",
          "corp_central_unrezzable_ice_install_stop",
          "corp_active_scoreline_off_path_spend",
        ]),
    )
    .sort((left, right) => right.score - left.score)[0];
  if (matchpointProtection) return matchpointProtection;

  const visibleRunnerCredits = input.playerView.opponent?.credits ?? 0;
  if (
    visibleRunnerCredits >= CORP_ACTIVE_REMOTE_ADVANCE_RUNNER_CREDIT_CEILING
  ) {
    return undefined;
  }

  return viableChoices
    .filter(
      (choice) =>
        choice.action.type === "advance_card" &&
        choice.scoreBreakdown.some(
          (component) =>
            component.key === "corp_active_remote_agenda_advance_clock" &&
            component.value > 0 &&
            component.reason?.includes(
              "runner_cannot_contest_before_score:true",
            ) === true,
        ) &&
        !semanticRuntimeChoiceHasAnyScoreBreakdownComponent(choice, [
          "corp_active_remote_agenda_unsafe_advance",
          "corp_active_remote_agenda_underfunded_advance",
          "corp_contestable_remote_score_penalty",
          "corp_trace_without_conversion_window",
          "corp_last_click_trace_without_payoff",
        ]) &&
        !semanticRuntimeChoiceHasDeckoutAgendaFloodMismatch(choice) &&
        !(
          input.playerView.own.credits <=
            CORP_ACTIVE_REMOTE_ADVANCE_CRITICAL_CREDIT_CEILING &&
          semanticRuntimeChoiceHasUnsafeScoringWindow(choice)
        ),
    )
    .sort((left, right) => right.score - left.score)[0];
}

function semanticRuntimeChoiceHasDeckoutAgendaFloodMismatch(
  choice: SemanticRuntimeChoice,
): boolean {
  return choice.scoreBreakdown.some(
    (component) =>
      component.key === "corp_board_triage_mismatch" &&
      component.value < 0 &&
      component.reason?.includes("corp_deckout_agenda_flood:true") === true,
  );
}

function semanticRuntimeChoiceHasUnsafeScoringWindow(
  choice: SemanticRuntimeChoice,
): boolean {
  return choice.scoreBreakdown.some(
    (component) =>
      (component.key === "corp_scoring_window_assessment" ||
        component.key === "corp_board_triage_alignment" ||
        component.key === "corp_board_triage_mismatch") &&
      component.reason?.includes("window_kind:unsafe") === true &&
      !(
        component.reason.includes("runner_can_contest_before_score:false") &&
        component.reason.includes("runner_can_reach_access_before_score:false")
      ),
  );
}

function semanticRuntimeChoiceHasPositiveScoreBreakdownComponent(
  choice: SemanticRuntimeChoice,
  key: string,
): boolean {
  return choice.scoreBreakdown.some(
    (component) => component.key === key && component.value > 0,
  );
}

function semanticRuntimeChoiceHasAnyScoreBreakdownComponent(
  choice: SemanticRuntimeChoice,
  keys: readonly string[],
): boolean {
  return keys.some((key) =>
    semanticRuntimeChoiceHasScoreBreakdownComponent(choice, key),
  );
}
