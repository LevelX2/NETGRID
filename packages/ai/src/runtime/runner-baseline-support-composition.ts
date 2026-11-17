import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";

import { createDeckCapabilitiesContext } from "./deck-capabilities-context";
import {
  createRunnerProgramInstallTrashContext,
  type RunnerProgramInstallTrashContextDependencies,
} from "./runner-program-install-trash-context";
import {
  createRunnerVisibleCardDiscardComposition,
  type RunnerVisibleCardDiscardCompositionDependencies,
} from "./runner-visible-card-discard-composition";
import { runnerStrategicIntentForInput } from "./runner-strategic-intent-context";
import {
  selectedChoicesForDecision as selectedChoicesForRuntimeDecision,
  type SelectedChoicesForDecisionDependencies,
} from "./selected-choices-for-decision";
import { createVisibleIcebreakerProgramPredicate } from "./visible-icebreaker-program";
import type { ResidentPlanPortfolio } from "../plans/resident-plan-portfolio";
import type { AiCardHint } from "../ai-hints";

export type RunnerBaselineSupportCompositionDependencies = {
  visibleBreakerRolesForAi: (card: VisibleCard) => readonly string[];
  hintForDefinitionId: (definitionId: string) => AiCardHint | undefined;
} & Omit<
  SelectedChoicesForDecisionDependencies,
  | "discardKeepScore"
  | "rolesForCardId"
  | "effectsForCardId"
  | "selectedRunnerProgramInstallTrashOptionIds"
  | "selectedRunnerForcedProgramTrashOptionIds"
  | "selectedRunnerMemoryCheckpointTrashOptionIds"
> &
  RunnerProgramInstallTrashContextDependencies &
  Omit<
    RunnerVisibleCardDiscardCompositionDependencies,
    "isVisibleIcebreakerProgram"
  >;

export function createRunnerBaselineSupportComposition(
  dependencies: RunnerBaselineSupportCompositionDependencies,
) {
  const { deckCapabilitiesForInput } = createDeckCapabilitiesContext();
  const isVisibleIcebreakerProgram = createVisibleIcebreakerProgramPredicate(
    dependencies.visibleBreakerRolesForAi,
  );
  const {
    visibleCardPlayOrInstallCostForAi,
    runnerCardLooksLikeCreditPayout,
    runnerBadPublicityOrTraceTechCard,
    runnerCardAddressesVisibleBreakerNeed,
    visibleBreakerCardCanAddressIce,
    discardKeepScore,
  } = createRunnerVisibleCardDiscardComposition({
    visibleCardDefinition: dependencies.visibleCardDefinition,
    isVisibleIcebreakerProgram,
    assessKnownRezzedIcePath: dependencies.assessKnownRezzedIcePath,
    visibleBreakerRolesForAi: dependencies.visibleBreakerRolesForAi,
    rolesForCardId: dependencies.rolesForCardId,
    cardDefinitionTypeForAi: dependencies.cardDefinitionTypeForAi,
    isRunnerEconomyRole: dependencies.isRunnerEconomyRole,
  });

  const {
    selectedRunnerProgramInstallTrashOptionIds,
    selectedRunnerForcedProgramTrashOptionIds,
    selectedRunnerMemoryCheckpointTrashOptionIds,
    runnerProgramInstallTrashAssessmentForAction,
    runnerProgramInstallTrashAssessmentForCard,
  } = createRunnerProgramInstallTrashContext({
    safeNonNegativeInteger: dependencies.safeNonNegativeInteger,
    visibleMemoryCost: dependencies.visibleMemoryCost,
    visibleCardsByInstanceId: dependencies.visibleCardsByInstanceId,
    visibleBreakerRoleCounts: dependencies.visibleBreakerRoleCounts,
    visibleBreakerRoles: dependencies.visibleBreakerRoles,
    rolesForCardId: dependencies.rolesForCardId,
    isRunnerPressureRole: dependencies.isRunnerPressureRole,
    isRunnerEconomyRole: dependencies.isRunnerEconomyRole,
    visibleCounterValue: dependencies.visibleCounterValue,
    visibleInstallCost: dependencies.visibleInstallCost,
  });

  const selectedChoicesDependencies: SelectedChoicesForDecisionDependencies = {
    evaluateCorpOpeningHand: dependencies.evaluateCorpOpeningHand,
    evaluateRunnerOpeningHand: dependencies.evaluateRunnerOpeningHand,
    discardKeepScore: (input, card) => discardKeepScore(input, card),
    selectedRunnerProgramInstallTrashOptionIds:
      selectedRunnerProgramInstallTrashOptionIds,
    selectedRunnerForcedProgramTrashOptionIds:
      selectedRunnerForcedProgramTrashOptionIds,
    selectedRunnerMemoryCheckpointTrashOptionIds:
      selectedRunnerMemoryCheckpointTrashOptionIds,
    extractAiFeatures: dependencies.extractAiFeatures,
    rolesForCardId: dependencies.rolesForCardId,
    effectsForCardId: (definitionId) =>
      definitionId
        ? (dependencies.hintForDefinitionId(definitionId)?.effects ?? [])
        : [],
  };
  function selectedChoicesForDecision(
    input: AiDecisionInput,
    action: LegalAction,
    currentPortfolio?: ResidentPlanPortfolio,
  ) {
    return selectedChoicesForRuntimeDecision(
      input,
      action,
      selectedChoicesDependencies,
      currentPortfolio,
    );
  }

  return {
    selectedChoicesForDecision,
    discardKeepScore,
    deckCapabilitiesForInput,
    runnerStrategicIntentForInput,
    isVisibleIcebreakerProgram,
    visibleCardPlayOrInstallCostForAi,
    runnerCardLooksLikeCreditPayout,
    runnerBadPublicityOrTraceTechCard,
    runnerCardAddressesVisibleBreakerNeed,
    visibleBreakerCardCanAddressIce,
    runnerProgramInstallTrashAssessmentForAction,
    runnerProgramInstallTrashAssessmentForCard,
  };
}
