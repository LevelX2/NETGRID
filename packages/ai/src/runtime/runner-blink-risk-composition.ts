import {
  createRunnerBlinkEncounterBreakContext,
  type RunnerBlinkEncounterBreakContextDependencies,
} from "./runner-blink-encounter-break-context";
import {
  createRunnerBlinkRiskContext,
  type RunnerBlinkRiskContext,
} from "./runner-blink-risk-context";
import type { RunnerBlinkRiskEvidenceDependencies } from "./runner-blink-run-exclusion";

export type RunnerBlinkRiskCompositionDependencies =
  RunnerBlinkEncounterBreakContextDependencies &
    Omit<RunnerBlinkRiskEvidenceDependencies, "breakRiskAssessment"> & {
      shouldAvoidRun: Parameters<
        typeof createRunnerBlinkRiskContext
      >[0]["shouldAvoidRun"];
    };

export function createRunnerBlinkRiskComposition(
  dependencies: RunnerBlinkRiskCompositionDependencies,
): RunnerBlinkRiskContext & {
  blinkRiskAssessmentForEncounterBreak: ReturnType<
    typeof createRunnerBlinkEncounterBreakContext
  >["blinkRiskAssessmentForEncounterBreak"];
} {
  const { blinkRiskAssessmentForEncounterBreak } =
    createRunnerBlinkEncounterBreakContext({
      sourceDefinitionIdForAction: dependencies.sourceDefinitionIdForAction,
      randomBreakOrDamageRiskProfileForDefinitionId:
        dependencies.randomBreakOrDamageRiskProfileForDefinitionId,
      breakSubroutineIndexesForAction:
        dependencies.breakSubroutineIndexesForAction,
      encounteredSubroutines: dependencies.encounteredSubroutines,
      buildBlinkRiskAssessment: dependencies.buildBlinkRiskAssessment,
      isImmediateSafetyThreatSubroutine:
        dependencies.isImmediateSafetyThreatSubroutine,
      isRemoteServerTarget: dependencies.isRemoteServerTarget,
      visibleRootIsKnownAgenda: dependencies.visibleRootIsKnownAgenda,
    });

  const { runnerBlinkRiskEvidenceForAction, runnerBlinkRunExclusion } =
    createRunnerBlinkRiskContext({
      multiRunTargetEvaluation: dependencies.multiRunTargetEvaluation,
      runRiskAssessment: dependencies.runRiskAssessment,
      breakRiskAssessment: blinkRiskAssessmentForEncounterBreak,
      shouldAvoidRun: dependencies.shouldAvoidRun,
    });

  return {
    blinkRiskAssessmentForEncounterBreak,
    runnerBlinkRiskEvidenceForAction,
    runnerBlinkRunExclusion,
  };
}
