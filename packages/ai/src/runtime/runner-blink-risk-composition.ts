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
import { currentEncounteredIceCard } from "./current-encounter";
import type { BlinkRiskAssessment } from "../runner-run-target-evaluation";

export type RunnerBlinkRiskCompositionDependencies<
  TDeckCapabilities,
  TStrategicIntent,
> =
  Omit<
    RunnerBlinkEncounterBreakContextDependencies,
    "encounteredSubroutines"
  > &
    RunnerMultiRunContextDependencies<TDeckCapabilities, TStrategicIntent> &
    Omit<
      RunnerBlinkRiskEvidenceDependencies,
      "breakRiskAssessment" | "multiRunTargetEvaluation" | "shouldAvoidRun"
    > & {
      shouldAvoidBlinkRiskAssessment: (
        assessment: BlinkRiskAssessment | undefined,
      ) => boolean;
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
      encounteredSubroutines: (input) =>
        currentEncounteredIceCard(input)?.effectiveRunQuote?.subroutines ?? [],
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
      shouldAvoidRun: (assessment) =>
        dependencies.shouldAvoidBlinkRiskAssessment(
          assessment as BlinkRiskAssessment | undefined,
        ),
    });

  return {
    ...multiRunContext,
    blinkRiskAssessmentForEncounterBreak,
    runnerBlinkRiskEvidenceForAction,
    runnerBlinkRunExclusion,
  };
}
