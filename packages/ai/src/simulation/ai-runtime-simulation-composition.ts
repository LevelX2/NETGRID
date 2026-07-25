import {
  createAiLiveRuntimeComposition,
  type AiLiveRuntimeCompositionDependencies,
} from "../runtime/ai-live-runtime-composition";
import {
  createRunnerSemanticSupportComposition,
  type RunnerSemanticSupportCompositionDependencies,
} from "../runtime/runner-semantic-support-composition";
import {
  createAiContextDiagnosticsComposition,
} from "../runtime/ai-context-diagnostics-composition";
import {
  createSemanticRuntimeCorpScoringComposition,
  type SemanticRuntimeCorpScoringCompositionDependencies,
} from "../runtime/semantic-runtime-corp-scoring-composition";
import {
  createAiSimulationComposition,
  type AiSimulationCompositionDependencies,
} from "./ai-simulation-composition";

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

type AiContextDiagnosticsOutputs = ReturnType<
  typeof createAiContextDiagnosticsComposition
>;

type RuntimeContextDiagnosticsDependencyKeys =
  | keyof AiContextDiagnosticsOutputs
  | "closeout"
  | "extractFeatures"
  | "hasKnownUnaffordableLegalRun"
  | "remoteTrashAccessContext"
  | "tagPunishAssessmentForAction"
  | "trashAccessContext";

export type AiRuntimeSimulationCompositionDependencies =
  AiLiveRuntimeCompositionDependencies &
    Omit<
      RunnerSemanticSupportCompositionDependencies,
      RuntimeContextDiagnosticsDependencyKeys | "previousPlan"
    > &
    Omit<
      AiSimulationCompositionDependencies,
      | "chooseAiAction"
      | "chooseRunnerAction"
      | "chooseCorpAction"
      | "tagPunishWindowDiagnosticsForSimulationAction"
      | RuntimeRunnerSupportDependencyKeys
      | RuntimeContextDiagnosticsDependencyKeys
    > &
    Omit<
      SemanticRuntimeCorpScoringCompositionDependencies<string>,
      RuntimeContextDiagnosticsDependencyKeys
    >;

function createRuntimeComposedDependencies(
  dependencies: AiRuntimeSimulationCompositionDependencies,
  contextDiagnostics: AiContextDiagnosticsOutputs,
) {
  return {
    ...dependencies,
    ...contextDiagnostics,
    closeout: contextDiagnostics.bestTrueCentralCloseoutProfileForMetrics,
    extractFeatures: contextDiagnostics.extractAiFeatures,
    hasKnownUnaffordableLegalRun:
      contextDiagnostics.runnerHasKnownUnaffordableLegalRun,
    remoteTrashAccessContext: contextDiagnostics.runnerRemoteTrashAccessContext,
    tagPunishAssessmentForAction:
      contextDiagnostics.corpTagPunishOntologyAssessmentForAction,
    trashAccessContext: contextDiagnostics.runnerRemoteTrashAccessContext,
  };
}

export function createAiRuntimeSimulationComposition(
  dependencies: AiRuntimeSimulationCompositionDependencies,
) {
  const contextDiagnostics = createAiContextDiagnosticsComposition(dependencies);
  const runnerSupport = createRunnerSemanticSupportComposition(
    {
      ...createRuntimeComposedDependencies(dependencies, contextDiagnostics),
      previousPlan: () => undefined,
    },
  );
  const corpScoring = createSemanticRuntimeCorpScoringComposition(
    createRuntimeComposedDependencies(dependencies, contextDiagnostics),
  );
  const runtimeEntrypoints = createAiLiveRuntimeComposition(dependencies);
  const simulationEntrypoints = createAiSimulationComposition({
    ...dependencies,
    ...contextDiagnostics,
    ...runnerSupport,
    extractFeatures: contextDiagnostics.extractAiFeatures,
    chooseAiAction: runtimeEntrypoints.chooseAiAction,
    chooseRunnerAction: runtimeEntrypoints.chooseRunnerAction,
    chooseCorpAction: runtimeEntrypoints.chooseCorpAction,
    tagPunishWindowDiagnosticsForSimulationAction:
      corpScoring.tagPunishWindowDiagnosticsForSimulationAction,
  });

  return {
    ...runtimeEntrypoints,
    ...simulationEntrypoints,
  };
}
