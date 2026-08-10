import type { RandomBreakOrDamageRiskAssessment } from "../runner-run-target-evaluation";
import {
  createRunnerBaselineSupportComposition,
  type RunnerBaselineSupportCompositionDependencies,
} from "./runner-baseline-support-composition";
import {
  createAiContextDiagnosticsComposition,
  type AiContextDiagnosticsCompositionDependencies,
} from "./ai-context-diagnostics-composition";
import {
  createRunnerRandomBreakOrDamageEncounterContext,
  type RunnerRandomBreakOrDamageEncounterContextDependencies,
} from "./runner-blink-encounter-break-context";
import { createRunnerRandomBreakOrDamageBreakExclusionContext } from "./runner-blink-break-exclusion";
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
  | "hintForDefinitionId"
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
      RunnerRandomBreakOrDamageEncounterContextDependencies,
      "encounteredSubroutines"
    > &
    Pick<
      SemanticRuntimeOrchestrationCompositionDependencies,
      DirectPlanFirstDependencyKeys
    > & {
      shouldAvoidRandomBreakOrDamageRisk: (
        assessment: RandomBreakOrDamageRiskAssessment | undefined,
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
  const contextDiagnostics =
    createAiContextDiagnosticsComposition(dependencies);
  const runnerBaseline = createRunnerBaselineSupportComposition(
    createRuntimeComposedDependencies(dependencies, contextDiagnostics),
  );
  const { randomBreakOrDamageRiskAssessmentForEncounterBreak } =
    createRunnerRandomBreakOrDamageEncounterContext({
      sourceDefinitionIdForAction: dependencies.sourceDefinitionIdForAction,
      randomBreakOrDamageRiskProfileForDefinitionId:
        dependencies.randomBreakOrDamageRiskProfileForDefinitionId,
      breakSubroutineIndexesForAction:
        dependencies.breakSubroutineIndexesForAction,
      encounteredSubroutines: (input) =>
        currentEncounteredIceCard(input)?.effectiveRunQuote?.subroutines ?? [],
      buildRandomBreakOrDamageRiskAssessment:
        dependencies.buildRandomBreakOrDamageRiskAssessment,
      isImmediateSafetyThreatSubroutine:
        dependencies.isImmediateSafetyThreatSubroutine,
      isRemoteServerTarget: dependencies.isRemoteServerTarget,
      visibleRootIsKnownAgenda: dependencies.visibleRootIsKnownAgenda,
    });
  const { semanticRuntimeRunnerRandomBreakOrDamageBreakExclusion } =
    createRunnerRandomBreakOrDamageBreakExclusionContext({
      riskAssessment: randomBreakOrDamageRiskAssessmentForEncounterBreak,
      shouldAvoidRun: (assessment) =>
        dependencies.shouldAvoidRandomBreakOrDamageRisk(
          assessment as RandomBreakOrDamageRiskAssessment | undefined,
        ),
    });
  const { runnerEncounterActionExclusion } =
    createRunnerEncounterActionExclusionContext({
      randomBreakOrDamageBreakExclusion:
        semanticRuntimeRunnerRandomBreakOrDamageBreakExclusion,
      pumpViabilityAssessment: contextDiagnostics.pumpViabilityAssessment,
      breakAccessPathAssessment: contextDiagnostics.breakAccessPathAssessment,
    });

  return createSemanticRuntimeOrchestrationComposition({
    buildActionSemanticCandidates: dependencies.buildActionSemanticCandidates,
    deckCapabilitiesForInput: runnerBaseline.deckCapabilitiesForInput,
    runnerStrategicIntentForInput: runnerBaseline.runnerStrategicIntentForInput,
    evaluateRunnerHandDevelopment: dependencies.evaluateRunnerHandDevelopment,
    buildRunnerEconomyPosture: dependencies.buildRunnerEconomyPosture,
    evaluateRunnerRunTargets: dependencies.evaluateRunnerRunTargets,
    discardKeepScore: runnerBaseline.discardKeepScore,
    selectedChoicesForDecision: runnerBaseline.selectedChoicesForDecision,
    runnerEncounterActionExclusion,
  });
}
