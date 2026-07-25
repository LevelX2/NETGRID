import type { BlinkRiskAssessment } from "../runner-run-target-evaluation";
import {
  createRunnerBaselineSupportComposition,
  type RunnerBaselineSupportCompositionDependencies,
} from "./runner-baseline-support-composition";
import {
  createAiContextDiagnosticsComposition,
  type AiContextDiagnosticsCompositionDependencies,
} from "./ai-context-diagnostics-composition";
import {
  createRunnerBlinkEncounterBreakContext,
  type RunnerBlinkEncounterBreakContextDependencies,
} from "./runner-blink-encounter-break-context";
import { createRunnerBlinkBreakExclusionContext } from "./runner-blink-break-exclusion";
import { createRunnerEncounterActionExclusionContext } from "./runner-encounter-action-exclusion";
import { currentEncounteredIceCard } from "./current-encounter";
import {
  createSemanticRuntimeOrchestrationComposition,
  type SemanticRuntimeOrchestrationCompositionDependencies,
} from "./semantic-runtime-orchestration-composition";

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

type DirectPlanFirstDependencyKeys =
  | "buildActionSemanticCandidates"
  | "evaluateRunnerHandDevelopment"
  | "buildRunnerEconomyPosture"
  | "evaluateRunnerRunTargets";

export type AiLiveRuntimeCompositionDependencies =
  AiContextDiagnosticsCompositionDependencies &
    Omit<
      RunnerBaselineSupportCompositionDependencies,
      RuntimeContextDiagnosticsDependencyKeys
    > &
    Omit<
      RunnerBlinkEncounterBreakContextDependencies,
      "encounteredSubroutines"
    > &
    Pick<
      SemanticRuntimeOrchestrationCompositionDependencies,
      DirectPlanFirstDependencyKeys
    > & {
      shouldAvoidBlinkRiskAssessment: (
        assessment: BlinkRiskAssessment | undefined,
      ) => boolean;
    };

function createRuntimeComposedDependencies(
  dependencies: AiLiveRuntimeCompositionDependencies,
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

export function createAiLiveRuntimeComposition(
  dependencies: AiLiveRuntimeCompositionDependencies,
) {
  const contextDiagnostics = createAiContextDiagnosticsComposition(dependencies);
  const runnerBaseline = createRunnerBaselineSupportComposition(
    createRuntimeComposedDependencies(dependencies, contextDiagnostics),
  );
  const { blinkRiskAssessmentForEncounterBreak } =
    createRunnerBlinkEncounterBreakContext({
      sourceDefinitionIdForAction: dependencies.sourceDefinitionIdForAction,
      randomBreakOrDamageRiskProfileForDefinitionId:
        dependencies.randomBreakOrDamageRiskProfileForDefinitionId,
      breakSubroutineIndexesForAction:
        dependencies.breakSubroutineIndexesForAction,
      encounteredSubroutines: (input) =>
        currentEncounteredIceCard(input)?.effectiveRunQuote?.subroutines ?? [],
      buildBlinkRiskAssessment: dependencies.buildBlinkRiskAssessment,
      isImmediateSafetyThreatSubroutine:
        dependencies.isImmediateSafetyThreatSubroutine,
      isRemoteServerTarget: dependencies.isRemoteServerTarget,
      visibleRootIsKnownAgenda: dependencies.visibleRootIsKnownAgenda,
    });
  const { semanticRuntimeRunnerBlinkBreakExclusion } =
    createRunnerBlinkBreakExclusionContext({
      riskAssessment: blinkRiskAssessmentForEncounterBreak,
      shouldAvoidRun: (assessment) =>
        dependencies.shouldAvoidBlinkRiskAssessment(
          assessment as BlinkRiskAssessment | undefined,
        ),
    });
  const { runnerEncounterActionExclusion } =
    createRunnerEncounterActionExclusionContext({
      blinkBreakExclusion: semanticRuntimeRunnerBlinkBreakExclusion,
      pumpViabilityAssessment: contextDiagnostics.pumpViabilityAssessment,
      breakAccessPathAssessment: contextDiagnostics.breakAccessPathAssessment,
    });

  return createSemanticRuntimeOrchestrationComposition({
    buildActionSemanticCandidates: dependencies.buildActionSemanticCandidates,
    deckCapabilitiesForInput: runnerBaseline.deckCapabilitiesForInput,
    runnerStrategicIntentForInput:
      runnerBaseline.runnerStrategicIntentForInput,
    evaluateRunnerHandDevelopment: dependencies.evaluateRunnerHandDevelopment,
    buildRunnerEconomyPosture: dependencies.buildRunnerEconomyPosture,
    evaluateRunnerRunTargets: dependencies.evaluateRunnerRunTargets,
    selectedChoicesForDecision: runnerBaseline.selectedChoicesForDecision,
    runnerEncounterActionExclusion,
  });
}
