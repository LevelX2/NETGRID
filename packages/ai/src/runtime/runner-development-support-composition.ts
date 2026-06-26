import {
  createRunnerHandFundingContext,
} from "./runner-hand-funding-context";
import type { DeckCapabilityProfile } from "../deck-capabilities";
import type { RunnerHandDevelopmentEvaluation } from "../runner-hand-development";
import type { RunnerStrategicIntentProfile } from "../runner-strategic-intent";
import type { RunnerHandFundingTargetDependencies } from "./runner-hand-funding-target";
import {
  createRunnerEconomyCommitmentComposition,
  type RunnerEconomyCommitmentCompositionDependencies,
} from "./runner-economy-commitment-composition";
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
import { rolesMatch } from "./role-match";

type RunnerDevelopmentCardDefinition = {
  title?: string;
  rulesText?: string;
  mechanics?: unknown;
};

export type RunnerDevelopmentSupportCompositionDependencies =
  RunnerLoanContextDependencies<
    DeckCapabilityProfile,
    RunnerStrategicIntentProfile,
    RunnerHandDevelopmentEvaluation
  > &
    RunnerViral15JackOutContextDependencies &
    Omit<RunnerHandFundingTargetDependencies, "rolesMatch"> &
    Omit<
      RunnerPersistentInstallContextDependencies<
        DeckCapabilityProfile,
        RunnerStrategicIntentProfile
      >,
      "deckCapabilities" | "strategicIntent"
    > &
    Omit<
      RunnerEconomyCommitmentCompositionDependencies,
      | "runnerHandFundingTarget"
      | "hintEffectsForDefinition"
      | "definitionForCardId"
      | "rulesTextForDefinition"
    > & {
      runtimeDefinition: (
        definitionId: string,
      ) => RunnerDevelopmentCardDefinition | undefined;
      demoDefinition: (
        definitionId: string,
      ) => RunnerDevelopmentCardDefinition | undefined;
    };

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
    rolesMatch: (roles, needles) => rolesMatch([...roles], [...needles]),
  });

  const {
    runnerPersistentInstallFitScoreComponent,
    runnerPersistentInstallLegacyScoreDelta,
    runnerPersistentInstallEvidenceForAction,
    runnerPersistentInstallEvaluationForAction,
  } = createRunnerPersistentInstallContext({
    deckCapabilities: dependencies.deckCapabilitiesForInput,
    strategicIntent: dependencies.strategicIntentForInput,
    handDevelopmentEvaluations:
      dependencies.handDevelopmentEvaluations,
  });

  const {
    runnerBankInvestmentCommitmentScoreComponents,
    runnerBankInvestmentCommitmentEvidence,
    runnerBankHasConcreteFundingNeed,
    runnerNoRunEconomyCommitmentScoreComponents,
    runnerNoRunEconomyCommitmentEvidence,
    semanticRuntimePlanMemoryActionExclusion,
  } = createRunnerEconomyCommitmentComposition({
    previousPlan: dependencies.previousPlan,
    runnerHandFundingTarget,
    findVisibleCard: dependencies.findVisibleCard,
    sourceDefinitionIdForAction: dependencies.sourceDefinitionIdForAction,
    rolesForCardId: dependencies.rolesForCardId,
    definitionForCardId: (definitionId) =>
      dependencies.runtimeDefinition(definitionId) ??
      dependencies.demoDefinition(definitionId),
    actionCreditCost: dependencies.actionCreditCost,
    rolesForAction: dependencies.rolesForAction,
    serverId: dependencies.serverId,
    definitionType: dependencies.definitionType,
    runnerRunTargetEvaluation: dependencies.runnerRunTargetEvaluation,
    runnerRunTargetHighPayoff: dependencies.runnerRunTargetHighPayoff,
    hintEffectsForDefinition: (definitionId) =>
      dependencies.hintForDefinitionId(definitionId)?.effects ?? [],
    mechanicsForDefinition: dependencies.mechanicsForDefinition,
    rulesTextForDefinition: (definitionId) => {
      const runtimeDefinition = dependencies.runtimeDefinition(definitionId);
      const demoDefinition = dependencies.demoDefinition(definitionId);
      return [runtimeDefinition?.rulesText, demoDefinition?.rulesText]
        .filter(Boolean)
        .join(" ");
    },
    isRunnerRigInstallAction: dependencies.isRunnerRigInstallAction,
  });

  return {
    runnerLoanLiabilityAssessment,
    runnerViral15JackOutScoreComponent,
    runnerHandFundingTarget,
    runnerBankInvestmentCommitmentScoreComponents,
    runnerBankInvestmentCommitmentEvidence,
    runnerBankHasConcreteFundingNeed,
    runnerNoRunEconomyCommitmentScoreComponents,
    runnerNoRunEconomyCommitmentEvidence,
    semanticRuntimePlanMemoryActionExclusion,
    runnerPersistentInstallFitScoreComponent,
    runnerPersistentInstallLegacyScoreDelta,
    runnerPersistentInstallEvidenceForAction,
    runnerPersistentInstallEvaluationForAction,
  };
}
