import {
  createRunnerHandFundingContext,
} from "./runner-hand-funding-context";
import type { DeckCapabilityProfile } from "../deck-capabilities";
import type { RunnerHandDevelopmentEvaluation } from "../runner-hand-development";
import type { RunnerStrategicIntentProfile } from "../runner-strategic-intent";
import type { RunnerHandFundingTargetDependencies } from "./runner-hand-funding-target";
import {
  createRunnerLoanContext,
  type RunnerLoanContextDependencies,
} from "./runner-loan-context";
import {
  createRunnerPersistentInstallContext,
  type RunnerPersistentInstallContextDependencies,
} from "./runner-persistent-install-context";
import {
  createRunnerViral15JackOutContext,
  type RunnerViral15JackOutContextDependencies,
} from "./runner-viral15-jack-out-context";

export type RunnerDevelopmentSupportCompositionDependencies =
  RunnerLoanContextDependencies<
    DeckCapabilityProfile,
    RunnerStrategicIntentProfile,
    RunnerHandDevelopmentEvaluation
  > &
    RunnerViral15JackOutContextDependencies &
    RunnerHandFundingTargetDependencies &
    RunnerPersistentInstallContextDependencies<
      DeckCapabilityProfile,
      RunnerStrategicIntentProfile
    >;

export function createRunnerDevelopmentSupportComposition(
  dependencies: RunnerDevelopmentSupportCompositionDependencies,
) {
  const { runnerLoanLiabilityAssessment } = createRunnerLoanContext({
    highRiskLoanDefinitionId: dependencies.highRiskLoanDefinitionId,
    hintForDefinitionId: dependencies.hintForDefinitionId,
    sourceDefinitionIdForAction: dependencies.sourceDefinitionIdForAction,
    projectedCreditGainForAction:
      dependencies.projectedCreditGainForAction,
    actionCreditCost: dependencies.actionCreditCost,
    actionClickCost: dependencies.actionClickCost,
    deckCapabilitiesForInput: dependencies.deckCapabilitiesForInput,
    strategicIntentForInput: dependencies.strategicIntentForInput,
    handDevelopmentEvaluations:
      dependencies.handDevelopmentEvaluations,
    economyPosture: dependencies.economyPosture,
    runTargets: dependencies.runTargets,
    visibleCardPlayOrInstallCost:
      dependencies.visibleCardPlayOrInstallCost,
    rolesForCardId: dependencies.rolesForCardId,
    cardAddressesVisibleBreakerNeed:
      dependencies.cardAddressesVisibleBreakerNeed,
    isRunnerEconomyRole: dependencies.isRunnerEconomyRole,
    isRunnerPressureRole: dependencies.isRunnerPressureRole,
    rolesForAction: dependencies.rolesForAction,
    hasKnownUnaffordableLegalRun:
      dependencies.hasKnownUnaffordableLegalRun,
  });

  const { runnerViral15JackOutScoreComponent } =
    createRunnerViral15JackOutContext({
      actionCreditCost: dependencies.actionCreditCost,
      isVisibleIcebreakerProgram: dependencies.isVisibleIcebreakerProgram,
    });

  const { runnerHandFundingTarget } = createRunnerHandFundingContext({
    rolesForCardId: dependencies.rolesForCardId,
    visibleCardPlayOrInstallCost:
      dependencies.visibleCardPlayOrInstallCost,
    cardAddressesVisibleBreakerNeed:
      dependencies.cardAddressesVisibleBreakerNeed,
    isRunnerEconomyRole: dependencies.isRunnerEconomyRole,
    cardLooksLikeCreditPayout: dependencies.cardLooksLikeCreditPayout,
    badPublicityOrTraceTechCard:
      dependencies.badPublicityOrTraceTechCard,
    rolesMatch: dependencies.rolesMatch,
  });

  const {
    runnerPersistentInstallFitScoreComponent,
    runnerPersistentInstallLegacyScoreDelta,
    runnerPersistentInstallEvidenceForAction,
    runnerPersistentInstallEvaluationForAction,
  } = createRunnerPersistentInstallContext({
    deckCapabilities: dependencies.deckCapabilities,
    strategicIntent: dependencies.strategicIntent,
    handDevelopmentEvaluations:
      dependencies.handDevelopmentEvaluations,
  });

  return {
    runnerLoanLiabilityAssessment,
    runnerViral15JackOutScoreComponent,
    runnerHandFundingTarget,
    runnerPersistentInstallFitScoreComponent,
    runnerPersistentInstallLegacyScoreDelta,
    runnerPersistentInstallEvidenceForAction,
    runnerPersistentInstallEvaluationForAction,
  };
}
