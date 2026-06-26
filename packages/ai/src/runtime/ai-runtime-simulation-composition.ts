import {
  createAiSimulationComposition,
  type AiSimulationCompositionDependencies,
} from "../simulation/ai-simulation-composition";
import {
  createSemanticRuntimeOrchestrationComposition,
  type SemanticRuntimeOrchestrationCompositionDependencies,
} from "./semantic-runtime-orchestration-composition";

type RuntimeScoringDependencyObjects = Pick<
  SemanticRuntimeOrchestrationCompositionDependencies,
  "badPublicityRelevance" | "goalFit" | "recoveryCommitment" | "install"
>;

type AiRuntimeSimulationScoringDependencies =
  Pick<
    RuntimeScoringDependencyObjects["badPublicityRelevance"],
    "sourceDefinitionIdForAction" | "actionCreditCost" | "fakedHitCardId"
  > & {
    runActionSpendingCapAssessment:
      RuntimeScoringDependencyObjects["goalFit"]["runActionSpendingCapAssessment"];
    muPressureFundingScoreComponent:
      RuntimeScoringDependencyObjects["recoveryCommitment"]["muPressureFundingScoreComponent"];
    handBufferNeedScoreComponent:
      RuntimeScoringDependencyObjects["recoveryCommitment"]["handBufferNeedScoreComponent"];
    viral15JackOutScoreComponent:
      RuntimeScoringDependencyObjects["recoveryCommitment"]["viral15JackOutScoreComponent"];
    multiRunEventScoreComponent:
      RuntimeScoringDependencyObjects["recoveryCommitment"]["multiRunEventScoreComponent"];
    bankInvestmentCommitmentScoreComponents:
      RuntimeScoringDependencyObjects["recoveryCommitment"]["bankInvestmentCommitmentScoreComponents"];
    noRunEconomyCommitmentScoreComponents:
      RuntimeScoringDependencyObjects["recoveryCommitment"]["noRunEconomyCommitmentScoreComponents"];
  } & Pick<
    RuntimeScoringDependencyObjects["install"],
    | "rolesForAction"
    | "muPressureInstallScoreComponent"
    | "persistentInstallFitScoreComponent"
    | "isRunnerEconomyRole"
    | "isRunnerPressureRole"
    | "badPublicityOrTraceTechCard"
    | "programInstallTrashAssessmentForAction"
    | "programInstallDisplacementPenalty"
  >;

export type AiRuntimeSimulationCompositionDependencies =
  Omit<
    SemanticRuntimeOrchestrationCompositionDependencies,
    "badPublicityRelevance" | "goalFit" | "recoveryCommitment" | "install"
  > &
    Omit<
      AiSimulationCompositionDependencies,
      | "chooseAiAction"
      | "chooseRunnerAction"
      | "chooseCorpAction"
      | "chooseRunnerBaselineAction"
      | "chooseCorpBaselineAction"
    > &
    AiRuntimeSimulationScoringDependencies;

export function createAiRuntimeSimulationComposition(
  dependencies: AiRuntimeSimulationCompositionDependencies,
) {
  const semanticRuntimeDependencies: SemanticRuntimeOrchestrationCompositionDependencies =
    {
      ...dependencies,
      badPublicityRelevance: {
        sourceDefinitionIdForAction:
          dependencies.sourceDefinitionIdForAction,
        actionCreditCost: dependencies.actionCreditCost,
        fakedHitCardId: dependencies.fakedHitCardId,
      },
      goalFit: {
        runActionSpendingCapAssessment:
          dependencies.runActionSpendingCapAssessment,
        runTargetEvaluationForAction: dependencies.evaluationForAction,
      },
      recoveryCommitment: {
        muPressureFundingScoreComponent:
          dependencies.muPressureFundingScoreComponent,
        handBufferNeedScoreComponent:
          dependencies.handBufferNeedScoreComponent,
        viral15JackOutScoreComponent:
          dependencies.viral15JackOutScoreComponent,
        multiRunEventScoreComponent:
          dependencies.multiRunEventScoreComponent,
        bankInvestmentCommitmentScoreComponents:
          dependencies.bankInvestmentCommitmentScoreComponents,
        noRunEconomyCommitmentScoreComponents:
          dependencies.noRunEconomyCommitmentScoreComponents,
      },
      install: {
        rolesForAction: dependencies.rolesForAction,
        muPressureInstallScoreComponent:
          dependencies.muPressureInstallScoreComponent,
        persistentInstallFitScoreComponent:
          dependencies.persistentInstallFitScoreComponent,
        isRunnerEconomyRole: dependencies.isRunnerEconomyRole,
        isRunnerPressureRole: dependencies.isRunnerPressureRole,
        badPublicityOrTraceTechCard:
          dependencies.badPublicityOrTraceTechCard,
        programInstallTrashAssessmentForAction:
          dependencies.programInstallTrashAssessmentForAction,
        programInstallDisplacementPenalty:
          dependencies.programInstallDisplacementPenalty,
      },
    };

  const runtimeEntrypoints =
    createSemanticRuntimeOrchestrationComposition(
      semanticRuntimeDependencies,
    );

  const simulationEntrypoints = createAiSimulationComposition({
    ...dependencies,
    chooseAiAction: runtimeEntrypoints.chooseAiAction,
    chooseRunnerAction: runtimeEntrypoints.chooseRunnerAction,
    chooseCorpAction: runtimeEntrypoints.chooseCorpAction,
    chooseRunnerBaselineAction:
      runtimeEntrypoints.chooseRunnerBaselineAction,
    chooseCorpBaselineAction: runtimeEntrypoints.chooseCorpBaselineAction,
  });

  return {
    ...runtimeEntrypoints,
    ...simulationEntrypoints,
  };
}
