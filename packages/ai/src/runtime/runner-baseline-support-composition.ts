import type { VisibleCard } from "@netgrid/shared";

import { createDeckCapabilitiesContext } from "./deck-capabilities-context";
import {
  createRunnerBaselinePlanGuardContext,
  type RunnerBaselinePlanGuardContextDependencies,
} from "./runner-baseline-plan-guard-context";
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
    };

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

  return {
    runnerHasConditionalPaymentContinueDecision,
    baselineShellTradersPlanIsVisible,
    deckCapabilitiesForInput,
    runnerStrategicIntentForInput,
    isVisibleIcebreakerProgram,
    runnerRunOnlyActionAdjustedSemanticChoice,
  };
}
