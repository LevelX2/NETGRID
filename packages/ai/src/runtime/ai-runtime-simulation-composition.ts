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
import {
  createRunnerSemanticSupportComposition,
  type RunnerSemanticSupportCompositionDependencies,
} from "./runner-semantic-support-composition";

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
    handBufferNeedScoreComponent:
      RuntimeScoringDependencyObjects["recoveryCommitment"]["handBufferNeedScoreComponent"];
  };

type RunnerSemanticSupportOutputs = ReturnType<
  typeof createRunnerSemanticSupportComposition
>;

type RuntimeRunnerSupportDependencyKeys =
  | keyof RunnerSemanticSupportOutputs
  | "badPublicityOrTraceTechCard"
  | "bankHasConcreteFundingNeed"
  | "bankInvestmentCommitmentEvidence"
  | "bankInvestmentCommitmentScoreComponents"
  | "blinkRiskEvidenceForAction"
  | "cardAddressesVisibleBreakerNeed"
  | "evaluationForAction"
  | "handFundingTarget"
  | "loanLiabilityAssessment"
  | "multiRunEventScoreComponent"
  | "muPressureActionEvidence"
  | "muPressureFundingScoreComponent"
  | "muPressureInstallScoreComponent"
  | "noRunEconomyCommitmentEvidence"
  | "noRunEconomyCommitmentScoreComponents"
  | "persistentInstallEvidenceForAction"
  | "persistentInstallFitScoreComponent"
  | "planMemoryActionExclusion"
  | "programInstallDisplacementPenalty"
  | "programInstallTrashAssessmentForAction"
  | "riskAssessment"
  | "runnerMultiRunEventExclusion"
  | "runnerRunTargetEvaluationForAction"
  | "viral15JackOutScoreComponent";

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
    | RuntimeRunnerSupportDependencyKeys
  > &
    Omit<
      AiSimulationCompositionDependencies,
      | "chooseAiAction"
      | "chooseRunnerAction"
      | "chooseCorpAction"
      | "chooseRunnerBaselineAction"
      | "chooseCorpBaselineAction"
      | "tagPunishWindowDiagnosticsForSimulationAction"
      | RuntimeRunnerSupportDependencyKeys
    > &
    SemanticRuntimeCorpScoringCompositionDependencies<string> &
    RunnerSemanticSupportCompositionDependencies &
    AiRuntimeSimulationScoringDependencies;

export function createAiRuntimeSimulationComposition(
  dependencies: AiRuntimeSimulationCompositionDependencies,
) {
  const runnerSupport =
    createRunnerSemanticSupportComposition(dependencies);

  const corpScoring =
    createSemanticRuntimeCorpScoringComposition(dependencies);

  const semanticRuntimeDependencies: SemanticRuntimeOrchestrationCompositionDependencies =
    {
      ...dependencies,
      ...runnerSupport,
      riskAssessment: runnerSupport.blinkRiskAssessmentForEncounterBreak,
      planMemoryActionExclusion:
        runnerSupport.semanticRuntimePlanMemoryActionExclusion,
      evaluationForAction:
        runnerSupport.semanticRuntimeRunnerRunTargetEvaluationForAction,
      handFundingTarget: runnerSupport.runnerHandFundingTarget,
      bankHasConcreteFundingNeed:
        runnerSupport.runnerBankHasConcreteFundingNeed,
      cardAddressesVisibleBreakerNeed:
        runnerSupport.runnerCardAddressesVisibleBreakerNeed,
      badPublicityOrTraceTechCard:
        runnerSupport.runnerBadPublicityOrTraceTechCard,
      loanLiabilityAssessment: runnerSupport.runnerLoanLiabilityAssessment,
      runnerMultiRunEventExclusion:
        runnerSupport.semanticRuntimeRunnerMultiRunEventExclusion,
      runnerRunTargetEvaluationForAction:
        runnerSupport.semanticRuntimeRunnerRunTargetEvaluationForAction,
      programInstallTrashAssessmentForAction:
        runnerSupport.runnerProgramInstallTrashAssessmentForAction,
      programInstallDisplacementPenalty:
        runnerSupport.runnerProgramInstallDisplacementPenalty,
      muPressureActionEvidence: runnerSupport.runnerMuPressureActionEvidence,
      bankInvestmentCommitmentEvidence:
        runnerSupport.runnerBankInvestmentCommitmentEvidence,
      noRunEconomyCommitmentEvidence:
        runnerSupport.runnerNoRunEconomyCommitmentEvidence,
      blinkRiskEvidenceForAction:
        runnerSupport.runnerBlinkRiskEvidenceForAction,
      persistentInstallEvidenceForAction:
        runnerSupport.runnerPersistentInstallEvidenceForAction,
      badPublicityRelevance: {
        sourceDefinitionIdForAction:
          dependencies.sourceDefinitionIdForAction,
        actionCreditCost: dependencies.actionCreditCost,
        fakedHitCardId: dependencies.fakedHitCardId,
      },
      goalFit: {
        runActionSpendingCapAssessment:
          dependencies.runActionSpendingCapAssessment,
        runTargetEvaluationForAction:
          runnerSupport.semanticRuntimeRunnerRunTargetEvaluationForAction,
      },
      recoveryCommitment: {
        muPressureFundingScoreComponent:
          runnerSupport.runnerMuPressureFundingScoreComponent,
        handBufferNeedScoreComponent:
          dependencies.handBufferNeedScoreComponent,
        viral15JackOutScoreComponent:
          runnerSupport.runnerViral15JackOutScoreComponent,
        multiRunEventScoreComponent:
          runnerSupport.runnerMultiRunEventScoreComponent,
        bankInvestmentCommitmentScoreComponents:
          runnerSupport.runnerBankInvestmentCommitmentScoreComponents,
        noRunEconomyCommitmentScoreComponents:
          runnerSupport.runnerNoRunEconomyCommitmentScoreComponents,
      },
      install: {
        rolesForAction: dependencies.rolesForAction,
        muPressureInstallScoreComponent:
          runnerSupport.runnerMuPressureInstallScoreComponent,
        persistentInstallFitScoreComponent:
          runnerSupport.runnerPersistentInstallFitScoreComponent,
        isRunnerEconomyRole: dependencies.isRunnerEconomyRole,
        isRunnerPressureRole: dependencies.isRunnerPressureRole,
        badPublicityOrTraceTechCard:
          runnerSupport.runnerBadPublicityOrTraceTechCard,
        programInstallTrashAssessmentForAction:
          runnerSupport.runnerProgramInstallTrashAssessmentForAction,
        programInstallDisplacementPenalty:
          runnerSupport.runnerProgramInstallDisplacementPenalty,
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
    ...runnerSupport,
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
