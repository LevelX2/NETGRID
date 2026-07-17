import type { AiDecisionInput } from "@netgrid/shared";
import type { PlanStepMappingResult } from "../../tactical-plans";
import type { SemanticRuntimeChoice } from "../semantic-runtime-types";
import {
  semanticRuntimeChoiceStrategicFitLevel,
  tacticalPlanCorpBoardTriageMismatchShouldYield,
} from "./semantic-choice-ranking-support";

export function tacticalPlanCorpScoreConversionBlocksOffPlanOverride(
  mapping: PlanStepMappingResult,
  overrideChoice: SemanticRuntimeChoice,
  mappedActionIds: ReadonlySet<string>,
): boolean {
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
