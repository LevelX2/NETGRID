import {
  createRunnerBlinkEncounterBreakContext,
  type RunnerBlinkEncounterBreakContextDependencies,
} from "./runner-blink-encounter-break-context";
import {
  createRunnerBlinkRiskContext,
  type RunnerBlinkRiskContext,
} from "./runner-blink-risk-context";
import type { RunnerBlinkRiskEvidenceDependencies } from "./runner-blink-run-exclusion";
import {
  createRunnerMultiRunContext,
  type RunnerMultiRunContext,
  type RunnerMultiRunContextDependencies,
} from "./runner-multi-run-context";

export type RunnerBlinkRiskCompositionDependencies<
  TDeckCapabilities,
  TStrategicIntent,
> =
  RunnerBlinkEncounterBreakContextDependencies &
    RunnerMultiRunContextDependencies<TDeckCapabilities, TStrategicIntent> &
    Omit<
      RunnerBlinkRiskEvidenceDependencies,
      "breakRiskAssessment" | "multiRunTargetEvaluation"
    > & {
      shouldAvoidRun: Parameters<
        typeof createRunnerBlinkRiskContext
      >[0]["shouldAvoidRun"];
    };

export function createRunnerBlinkRiskComposition<
  TDeckCapabilities,
  TStrategicIntent,
>(
  dependencies: RunnerBlinkRiskCompositionDependencies<
    TDeckCapabilities,
    TStrategicIntent
  >,
): RunnerBlinkRiskContext & {
  blinkRiskAssessmentForEncounterBreak: ReturnType<
    typeof createRunnerBlinkEncounterBreakContext
  >["blinkRiskAssessmentForEncounterBreak"];
} & RunnerMultiRunContext {
  const multiRunContext = createRunnerMultiRunContext({
    allNighterDefinitionId: dependencies.allNighterDefinitionId,
    sourceDefinitionIdForAction: dependencies.sourceDefinitionIdForAction,
    targetServerId: dependencies.targetServerId,
    payoffClass: dependencies.payoffClass,
    canTakeRun: dependencies.canTakeRun,
    scoreValue: dependencies.scoreValue,
    deckCapabilitiesForInput: dependencies.deckCapabilitiesForInput,
    strategicIntentForInput: dependencies.strategicIntentForInput,
    runTargets: dependencies.runTargets,
  });

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
      multiRunTargetEvaluation:
        multiRunContext.runnerMultiRunTargetEvaluation,
      runRiskAssessment: dependencies.runRiskAssessment,
      breakRiskAssessment: blinkRiskAssessmentForEncounterBreak,
      shouldAvoidRun: dependencies.shouldAvoidRun,
    });

  return {
    ...multiRunContext,
    blinkRiskAssessmentForEncounterBreak,
    runnerBlinkRiskEvidenceForAction,
    runnerBlinkRunExclusion,
  };
}
