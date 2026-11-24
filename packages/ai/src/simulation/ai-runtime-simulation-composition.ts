import {
  createAiLiveRuntimeComposition,
  type AiLiveRuntimeCompositionDependencies,
} from "../runtime/ai-live-runtime-composition";
import {
  createRunnerSemanticSupportComposition,
  type RunnerSemanticSupportCompositionDependencies,
} from "../runtime/runner-semantic-support-composition";
import {
  aiContextDiagnosticDependencies,
  createAiContextDiagnosticsComposition,
} from "../runtime/ai-context-diagnostics-composition";
import {
  createCorpTagPunishWindowComposition,
  type CorpTagPunishWindowCompositionDependencies,
} from "./corp-tag-punish-window-composition";
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
  | "randomBreakOrDamageRiskEvidenceForAction"
  | "cardAddressesVisibleBreakerNeed"
  | "evaluationForAction"
  | "loanLiabilityAssessment"
  | "multiRunEventScoreComponent"
  | "muPressureActionEvidence"
  | "muPressureFundingScoreComponent"
  | "muPressureInstallScoreComponent"
  | "programInstallDisplacementPenalty"
  | "programInstallTrashAssessmentForAction"
  | "riskAssessment"
  | "runnerMultiRunEventExclusion"
  | "runnerRunTargetEvaluationForAction";

type RuntimeContextDiagnosticsDependencyKeys = keyof ReturnType<
  typeof aiContextDiagnosticDependencies
>;

export type AiRuntimeSimulationCompositionDependencies =
  AiLiveRuntimeCompositionDependencies &
    Omit<
      RunnerSemanticSupportCompositionDependencies,
      RuntimeContextDiagnosticsDependencyKeys
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
      CorpTagPunishWindowCompositionDependencies,
      RuntimeContextDiagnosticsDependencyKeys
    >;

export function createAiRuntimeSimulationComposition(
  dependencies: AiRuntimeSimulationCompositionDependencies,
) {
  const contextDiagnostics =
    createAiContextDiagnosticsComposition(dependencies);
  const diagnosticDependencies = {
    ...dependencies,
    ...aiContextDiagnosticDependencies(contextDiagnostics),
  };
  const runnerSupport = createRunnerSemanticSupportComposition(
    diagnosticDependencies,
  );
  const { tagPunishWindowDiagnosticsForSimulationAction } =
    createCorpTagPunishWindowComposition(diagnosticDependencies);
  const runtimeEntrypoints = createAiLiveRuntimeComposition(dependencies);
  const simulationEntrypoints = createAiSimulationComposition({
    ...dependencies,
    ...contextDiagnostics,
    ...runnerSupport,
    extractFeatures: contextDiagnostics.extractAiFeatures,
    chooseAiAction: runtimeEntrypoints.chooseAiAction,
    chooseRunnerAction: runtimeEntrypoints.chooseRunnerAction,
    chooseCorpAction: runtimeEntrypoints.chooseCorpAction,
    tagPunishWindowDiagnosticsForSimulationAction,
  });

  return {
    ...runtimeEntrypoints,
    ...simulationEntrypoints,
  };
}
