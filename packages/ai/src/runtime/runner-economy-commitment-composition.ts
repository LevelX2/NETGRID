import {
  createRunnerBankInvestmentContext,
  type RunnerBankInvestmentContextDependencies,
} from "./runner-bank-investment-context";
import {
  createRunnerNoRunEconomyContext,
  type RunnerNoRunEconomyContextDependencies,
} from "./runner-no-run-economy-context";
import {
  createSemanticRuntimePlanMemoryExclusionContext,
  type SemanticRuntimePlanMemoryExclusionDependencies,
} from "./semantic-runtime-plan-memory-exclusion";

export type RunnerEconomyCommitmentCompositionDependencies =
  RunnerBankInvestmentContextDependencies &
    Omit<
      RunnerNoRunEconomyContextDependencies,
      "runnerBankCommitmentRunOverride"
    > &
    Pick<SemanticRuntimePlanMemoryExclusionDependencies, "previousPlan">;

export function createRunnerEconomyCommitmentComposition(
  dependencies: RunnerEconomyCommitmentCompositionDependencies,
) {
  const {
    runnerBankInvestmentCommitmentScoreComponents,
    runnerBankInvestmentCommitmentEvidence,
    isRunnerBankCashOutAction,
    runnerBankCashOutIsUsefulNow,
    runnerBankHasConcreteFundingNeed,
    runnerBankCommitmentRunOverride,
  } = createRunnerBankInvestmentContext({
    previousPlan: dependencies.previousPlan,
    runnerHandFundingTarget: dependencies.runnerHandFundingTarget,
    findVisibleCard: dependencies.findVisibleCard,
    sourceDefinitionIdForAction: dependencies.sourceDefinitionIdForAction,
    rolesForCardId: dependencies.rolesForCardId,
    definitionForCardId: dependencies.definitionForCardId,
    hintEffectsForDefinition: dependencies.hintEffectsForDefinition,
    actionCreditCost: dependencies.actionCreditCost,
    rolesForAction: dependencies.rolesForAction,
    serverId: dependencies.serverId,
    definitionType: dependencies.definitionType,
    runnerRunTargetEvaluation: dependencies.runnerRunTargetEvaluation,
    runnerRunTargetHighPayoff: dependencies.runnerRunTargetHighPayoff,
  });

  const {
    runnerNoRunEconomyCommitmentScoreComponents,
    runnerNoRunEconomyCommitmentEvidence,
  } = createRunnerNoRunEconomyContext({
    findVisibleCard: dependencies.findVisibleCard,
    hintEffectsForDefinition: dependencies.hintEffectsForDefinition,
    mechanicsForDefinition: dependencies.mechanicsForDefinition,
    rulesTextForDefinition: dependencies.rulesTextForDefinition,
    runnerBankCommitmentRunOverride,
    isRunnerRigInstallAction: dependencies.isRunnerRigInstallAction,
  });

  const { semanticRuntimePlanMemoryActionExclusion } =
    createSemanticRuntimePlanMemoryExclusionContext({
      previousPlan: dependencies.previousPlan,
      isRunnerBankCashOutAction,
      runnerBankCashOutIsUsefulNow,
      runnerBankInvestmentCommitmentEvidence,
    });

  return {
    runnerBankInvestmentCommitmentScoreComponents,
    runnerBankInvestmentCommitmentEvidence,
    runnerBankHasConcreteFundingNeed,
    runnerNoRunEconomyCommitmentScoreComponents,
    runnerNoRunEconomyCommitmentEvidence,
    semanticRuntimePlanMemoryActionExclusion,
  };
}
