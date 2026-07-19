import type { AiDecisionInput } from "@netgrid/shared";
import type { PlanStepMappingResult } from "../../tactical-plans";
import type {
  SemanticRuntimeChoice,
  TacticalPlanMappedChoiceResult,
} from "../semantic-runtime-types";
import {
  strongerExistingCorpOverrideMustBePreserved,
  urgentCorpSemanticChoice,
} from "./corp-plan-overrides";
import { bestSemanticRuntimeChoice } from "./mapped-choice-policies";
import {
  mappedPlanHasImmediateVisibleRunPayoff,
  semanticRuntimeChoiceHasPositiveDevelopmentCommitment,
  semanticRuntimeChoiceIsAcuteHandBufferDraw,
  semanticRuntimeChoiceIsDamagePressureHandBufferDraw,
  semanticRuntimeChoiceIsProjectedRun,
} from "./runner-plan-overrides";
import {
  roundScore,
  semanticRuntimeChoiceHasScoreBreakdownComponent,
  semanticRuntimeChoiceStrategicFitLevel,
  semanticRuntimeChoiceWithAddedEvidence,
} from "./semantic-choice-ranking-support";

export function initialMappedChoiceOverride(
  input: AiDecisionInput,
  choices: readonly SemanticRuntimeChoice[],
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice | undefined,
): {
  overrideChoice: SemanticRuntimeChoice | undefined;
  terminalResult?: TacticalPlanMappedChoiceResult;
} {
  const urgentCorpChoice = urgentCorpSemanticChoice(input, choices);
  if (
    urgentCorpChoice &&
    urgentCorpChoice.action.actionId !== mappedChoice.action.actionId
  ) {
    const reason =
      urgentCorpChoice.action.type === "score_agenda"
        ? "corp_scoreable_agenda_controller"
        : semanticRuntimeChoiceHasScoreBreakdownComponent(
              urgentCorpChoice,
              "corp_matchpoint_hq_protection_alignment",
            )
          ? "corp_matchpoint_central_protection_controller"
          : "corp_active_remote_agenda_advance_controller";
    const scoreGap = roundScore(urgentCorpChoice.score - mappedChoice.score);
    return {
      overrideChoice,
      terminalResult: {
        outcome: "semantic_choice_selected",
        choice: semanticRuntimeChoiceWithAddedEvidence(urgentCorpChoice, [
          "tactical_plan_mapping_outcome:semantic_choice_selected",
          `tactical_plan_mapping_override_reason:${reason}`,
          `tactical_plan_mapping_score_gap:${scoreGap}`,
        ]),
        overrideChoice: urgentCorpChoice,
        overriddenMappedChoice: mappedChoice,
        overrideReason: reason,
        overrideThreshold: Number.NEGATIVE_INFINITY,
        scoreGap,
      },
    };
  }

  if (semanticRuntimeChoiceStrategicFitLevel(mappedChoice) === "none") {
    const strategicOverrideChoice = bestSemanticRuntimeChoice(
      choices.filter(
        (choice) =>
          !choice.exclusion &&
          semanticRuntimeChoiceStrategicFitLevel(choice) !== "none",
      ),
    );
    if (
      strategicOverrideChoice &&
      strategicOverrideChoice.score > 0 &&
      strategicOverrideChoice.score > mappedChoice.score &&
      !strongerExistingCorpOverrideMustBePreserved(
        mapping,
        overrideChoice,
        strategicOverrideChoice,
      )
    ) {
      overrideChoice = strategicOverrideChoice;
    }
  }

  if (
    semanticRuntimeChoiceIsProjectedRun(mappedChoice) &&
    !mappedPlanHasImmediateVisibleRunPayoff(mapping.plan, mappedChoice)
  ) {
    const acuteHandBufferOverride = bestSemanticRuntimeChoice(
      choices.filter(
        (choice) =>
          !choice.exclusion &&
          semanticRuntimeChoiceIsAcuteHandBufferDraw(choice),
      ),
    );
    if (
      acuteHandBufferOverride &&
      !semanticRuntimeChoiceHasPositiveDevelopmentCommitment(overrideChoice)
    ) {
      overrideChoice = acuteHandBufferOverride;
    }
  }

  if (
    overrideChoice?.action.actionId === mappedChoice.action.actionId &&
    mapping.plan.type === "runner.build_credit_bank" &&
    mapping.plan.evidence.includes("runner_bank_concrete_funding_need:false")
  ) {
    const damagePressureDraw = bestSemanticRuntimeChoice(
      choices.filter(
        (choice) =>
          !choice.exclusion &&
          choice.action.actionId !== mappedChoice.action.actionId &&
          semanticRuntimeChoiceIsDamagePressureHandBufferDraw(choice),
      ),
    );
    if (damagePressureDraw) overrideChoice = damagePressureDraw;
  }

  return { overrideChoice };
}
