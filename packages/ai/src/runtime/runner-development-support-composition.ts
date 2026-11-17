import { createRunnerHandFundingContext } from "./runner-hand-funding-context";
import type { DeckCapabilityProfile } from "../deck-capabilities";
import type { AiCardHint } from "../ai-hints";
import type { RunnerStrategicIntentProfile } from "../runner-strategic-intent";
import type { RunnerHandFundingTargetDependencies } from "./runner-hand-funding-target";
import {
  createRunnerEconomyCommitmentComposition,
  type RunnerEconomyCommitmentCompositionDependencies,
} from "./runner-economy-commitment-composition";
import {
  createRunnerPersistentInstallContext,
  type RunnerPersistentInstallContextDependencies,
} from "./runner-persistent-install-context";
import { rolesMatch } from "../role-match";

type RunnerDevelopmentCardDefinition = {
  title?: string;
  rulesText?: string;
  mechanics?: unknown;
};

export type RunnerDevelopmentSupportCompositionDependencies = Omit<
  RunnerHandFundingTargetDependencies,
  "rolesMatch"
> &
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
    deckCapabilitiesForInput: RunnerPersistentInstallContextDependencies<
      DeckCapabilityProfile,
      RunnerStrategicIntentProfile
    >["deckCapabilities"];
    strategicIntentForInput: RunnerPersistentInstallContextDependencies<
      DeckCapabilityProfile,
      RunnerStrategicIntentProfile
    >["strategicIntent"];
    hintForDefinitionId: (definitionId: string) => AiCardHint | undefined;
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
  const { runnerHandFundingTarget } = createRunnerHandFundingContext({
    rolesForCardId: dependencies.rolesForCardId,
    visibleCardPlayOrInstallCost: dependencies.visibleCardPlayOrInstallCost,
    cardAddressesVisibleBreakerNeed:
      dependencies.cardAddressesVisibleBreakerNeed,
    isRunnerEconomyRole: dependencies.isRunnerEconomyRole,
    cardLooksLikeCreditPayout: dependencies.cardLooksLikeCreditPayout,
    badPublicityOrTraceTechCard: dependencies.badPublicityOrTraceTechCard,
    rolesMatch: (roles, needles) => rolesMatch([...roles], [...needles]),
  });

  const {
    runnerPersistentInstallFitScoreComponent,
    runnerPersistentInstallEvidenceForAction,
    runnerPersistentInstallEvaluationForAction,
  } = createRunnerPersistentInstallContext({
    deckCapabilities: dependencies.deckCapabilitiesForInput,
    strategicIntent: dependencies.strategicIntentForInput,
    handDevelopmentEvaluations: dependencies.handDevelopmentEvaluations,
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
    runnerHandFundingTarget,
    runnerBankInvestmentCommitmentScoreComponents,
    runnerBankInvestmentCommitmentEvidence,
    runnerBankHasConcreteFundingNeed,
    runnerNoRunEconomyCommitmentScoreComponents,
    runnerNoRunEconomyCommitmentEvidence,
    semanticRuntimePlanMemoryActionExclusion,
    runnerPersistentInstallFitScoreComponent,
    runnerPersistentInstallEvidenceForAction,
    runnerPersistentInstallEvaluationForAction,
  };
}
