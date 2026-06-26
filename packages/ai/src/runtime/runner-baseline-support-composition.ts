import type { VisibleCard } from "@netgrid/shared";

import {
  createLegacyDecisionContext,
  type LegacyDecisionContextDependencies,
} from "../legacy/legacy-decision-context";
import { createDeckCapabilitiesContext } from "./deck-capabilities-context";
import {
  createRunnerBaselinePlanGuardContext,
  type RunnerBaselinePlanGuardContextDependencies,
} from "./runner-baseline-plan-guard-context";
import {
  createRunnerProgramPressureComposition,
  type RunnerProgramPressureCompositionDependencies,
} from "./runner-program-pressure-composition";
import {
  createRunnerVisibleCardDiscardComposition,
  type RunnerVisibleCardDiscardCompositionDependencies,
} from "./runner-visible-card-discard-composition";
import {
  createRunnerRunOnlyActionContext,
  type RunnerRunOnlyActionAdjustmentDependencies,
} from "./runner-run-only-action-adjustment";
import { createRunnerStrategicIntentContext } from "./runner-strategic-intent-context";
import { createVisibleIcebreakerProgramPredicate } from "./visible-icebreaker-program";

export type RunnerBaselineSupportCompositionDependencies =
  RunnerBaselinePlanGuardContextDependencies &
    RunnerRunOnlyActionAdjustmentDependencies & {
      visibleBreakerRolesForAi: (card: VisibleCard) => readonly string[];
    } &
    Omit<
      LegacyDecisionContextDependencies,
      | "discardKeepScore"
      | "rolesForCardId"
      | "selectedRunnerProgramInstallTrashOptionIds"
      | "selectedRunnerForcedProgramTrashOptionIds"
    > &
    RunnerProgramPressureCompositionDependencies &
    Omit<
      RunnerVisibleCardDiscardCompositionDependencies,
      "isVisibleIcebreakerProgram"
    >;

export function createRunnerBaselineSupportComposition(
  dependencies: RunnerBaselineSupportCompositionDependencies,
) {
  const {
    runnerHasConditionalPaymentContinueDecision,
    baselineShellTradersPlanIsVisible,
  } = createRunnerBaselinePlanGuardContext({
    delayedInstallAbilityForAction:
      dependencies.delayedInstallAbilityForAction,
    runnerHasInstalledPrograms: dependencies.runnerHasInstalledPrograms,
  });

  const { deckCapabilitiesForInput } = createDeckCapabilitiesContext();
  const { runnerStrategicIntentForInput } =
    createRunnerStrategicIntentContext();
  const isVisibleIcebreakerProgram =
    createVisibleIcebreakerProgramPredicate(
      dependencies.visibleBreakerRolesForAi,
    );
  const { runnerRunOnlyActionAdjustedSemanticChoice } =
    createRunnerRunOnlyActionContext({
      compareAction: dependencies.compareAction,
    });

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
    runnerProgramInstallTrashAssessment,
    runnerProgramInstallTrashAssessmentForAction,
    runnerProgramInstallDisplacementPenalty,
    runnerProgramSacrificeExclusion,
    runnerMuPressureInstallScoreComponent,
    runnerMuPressureFundingScoreComponent,
    runnerMuPressureInstallPriorityBonus,
    runnerMuPressureFundingPriorityBonus,
    runnerMuPressureActionEvidence,
  } = createRunnerProgramPressureComposition({
    safeNonNegativeInteger: dependencies.safeNonNegativeInteger,
    findVisibleCard: dependencies.findVisibleCard,
    visibleMemoryCost: dependencies.visibleMemoryCost,
    visibleCardsByInstanceId: dependencies.visibleCardsByInstanceId,
    visibleBreakerRoleCounts: dependencies.visibleBreakerRoleCounts,
    visibleBreakerRoles: dependencies.visibleBreakerRoles,
    rolesForCardId: dependencies.rolesForCardId,
    isRunnerPressureRole: dependencies.isRunnerPressureRole,
    isRunnerEconomyRole: dependencies.isRunnerEconomyRole,
    visibleCounterValue: dependencies.visibleCounterValue,
    visibleInstallCost: dependencies.visibleInstallCost,
    actionCreditCost: dependencies.actionCreditCost,
    rolesForAction: dependencies.rolesForAction,
  });

  const { decisionFromChoices, selectedChoicesForDecision } =
    createLegacyDecisionContext({
      evaluateCorpOpeningHand: dependencies.evaluateCorpOpeningHand,
      evaluateRunnerOpeningHand:
        dependencies.evaluateRunnerOpeningHand,
      discardKeepScore: (input, card) => discardKeepScore(input, card),
      selectedRunnerProgramInstallTrashOptionIds:
        selectedRunnerProgramInstallTrashOptionIds,
      selectedRunnerForcedProgramTrashOptionIds:
        selectedRunnerForcedProgramTrashOptionIds,
      extractAiFeatures: dependencies.extractAiFeatures,
      rolesForCardId: dependencies.rolesForCardId,
      scrubEvidence: dependencies.scrubEvidence,
    });

  return {
    runnerHasConditionalPaymentContinueDecision,
    baselineShellTradersPlanIsVisible,
    decisionFromChoices,
    selectedChoicesForDecision,
    deckCapabilitiesForInput,
    runnerStrategicIntentForInput,
    isVisibleIcebreakerProgram,
    runnerRunOnlyActionAdjustedSemanticChoice,
    visibleCardPlayOrInstallCostForAi,
    runnerCardLooksLikeCreditPayout,
    runnerBadPublicityOrTraceTechCard,
    runnerCardAddressesVisibleBreakerNeed,
    visibleBreakerCardCanAddressIce,
    discardKeepScore,
    selectedRunnerProgramInstallTrashOptionIds,
    selectedRunnerForcedProgramTrashOptionIds,
    runnerProgramInstallTrashAssessment,
    runnerProgramInstallTrashAssessmentForAction,
    runnerProgramInstallDisplacementPenalty,
    runnerProgramSacrificeExclusion,
    runnerMuPressureInstallScoreComponent,
    runnerMuPressureFundingScoreComponent,
    runnerMuPressureInstallPriorityBonus,
    runnerMuPressureFundingPriorityBonus,
    runnerMuPressureActionEvidence,
  };
}
