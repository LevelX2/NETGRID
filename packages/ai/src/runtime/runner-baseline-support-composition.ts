import type { VisibleCard } from "@netgrid/shared";

import { createDeckCapabilitiesContext } from "./deck-capabilities-context";
import {
  createRunnerBaselinePlanGuardContext,
  type RunnerBaselinePlanGuardContextDependencies,
} from "./runner-baseline-plan-guard-context";
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

  return {
    runnerHasConditionalPaymentContinueDecision,
    baselineShellTradersPlanIsVisible,
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
  };
}
