import {
  createAiSimulationComposition,
  type AiSimulationCompositionDependencies,
} from "../simulation/ai-simulation-composition";
import {
  createSemanticRuntimeOrchestrationComposition,
  type SemanticRuntimeOrchestrationCompositionDependencies,
} from "./semantic-runtime-orchestration-composition";
import {
  createSemanticRuntimeCorpScoringComposition,
  type SemanticRuntimeCorpScoringCompositionDependencies,
} from "./semantic-runtime-corp-scoring-composition";

type RuntimeScoringDependencyObjects = Pick<
  SemanticRuntimeOrchestrationCompositionDependencies,
  | "badPublicityRelevance"
  | "goalFit"
  | "recoveryCommitment"
  | "install"
  | "startRun"
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
    | "badPublicityRelevance"
    | "corpAdvancementCounterPlacementAssessment"
    | "corpComponents"
    | "corpEvidence"
    | "corpOntologyPayoffAvailableForTagSource"
    | "goalFit"
    | "recoveryCommitment"
    | "install"
    | "startRun"
  > &
    Omit<
      AiSimulationCompositionDependencies,
      | "chooseAiAction"
      | "chooseRunnerAction"
      | "chooseCorpAction"
      | "chooseRunnerBaselineAction"
      | "chooseCorpBaselineAction"
      | "tagPunishWindowDiagnosticsForSimulationAction"
    > &
    SemanticRuntimeCorpScoringCompositionDependencies<string> &
    AiRuntimeSimulationScoringDependencies;

export function createAiRuntimeSimulationComposition(
  dependencies: AiRuntimeSimulationCompositionDependencies,
) {
  const corpScoring =
    createSemanticRuntimeCorpScoringComposition(dependencies);

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
      startRun: {
        serverId: dependencies.serverId,
        isRemoteServerTarget: dependencies.isRemoteServerTarget,
      },
      corpAdvancementCounterPlacementAssessment:
        corpScoring.semanticRuntimeCorpAdvancementCounterPlacementAssessment,
      corpComponents: corpScoring.semanticRuntimeCorpScoreComponents,
      corpEvidence: corpScoring.semanticRuntimeCorpEvidence,
      corpOntologyPayoffAvailableForTagSource:
        corpScoring.corpOntologyPayoffAvailableForTagSource,
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
    tagPunishWindowDiagnosticsForSimulationAction:
      corpScoring.tagPunishWindowDiagnosticsForSimulationAction,
  });

  return {
    ...runtimeEntrypoints,
    ...simulationEntrypoints,
  };
}
