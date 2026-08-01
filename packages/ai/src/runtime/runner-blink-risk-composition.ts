import {
  createRunnerRandomBreakOrDamageEncounterContext,
  type RunnerRandomBreakOrDamageEncounterContextDependencies,
} from "./runner-blink-encounter-break-context";
import {
  createRunnerRandomBreakOrDamageRiskContext,
  type RunnerRandomBreakOrDamageRiskContext,
} from "./runner-blink-risk-context";
import type { RunnerRandomBreakOrDamageRiskEvidenceDependencies } from "./runner-blink-run-exclusion";
import {
  createRunnerMultiRunContext,
  type RunnerMultiRunContext,
  type RunnerMultiRunContextDependencies,
} from "./runner-multi-run-context";
import { currentEncounteredIceCard } from "./current-encounter";
import type { RandomBreakOrDamageRiskAssessment } from "../runner-run-target-evaluation";

export type RunnerRandomBreakOrDamageRiskCompositionDependencies<
  TDeckCapabilities,
  TStrategicIntent,
> = Omit<
  RunnerRandomBreakOrDamageEncounterContextDependencies,
  "encounteredSubroutines"
> &
  RunnerMultiRunContextDependencies<TDeckCapabilities, TStrategicIntent> &
  Omit<
    RunnerRandomBreakOrDamageRiskEvidenceDependencies,
    "breakRiskAssessment" | "multiRunTargetEvaluation" | "shouldAvoidRun"
  > & {
    shouldAvoidRandomBreakOrDamageRisk: (
      assessment: RandomBreakOrDamageRiskAssessment | undefined,
    ) => boolean;
  };

export function createRunnerRandomBreakOrDamageRiskComposition<
  TDeckCapabilities,
  TStrategicIntent,
>(
  dependencies: RunnerRandomBreakOrDamageRiskCompositionDependencies<
    TDeckCapabilities,
    TStrategicIntent
  >,
): RunnerRandomBreakOrDamageRiskContext & {
  randomBreakOrDamageRiskAssessmentForEncounterBreak: ReturnType<
    typeof createRunnerRandomBreakOrDamageEncounterContext
  >["randomBreakOrDamageRiskAssessmentForEncounterBreak"];
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

  const {
    runnerRandomBreakOrDamageRiskEvidenceForAction,
    runnerRandomBreakOrDamageRunExclusion,
  } = createRunnerRandomBreakOrDamageRiskContext({
    multiRunTargetEvaluation: multiRunContext.runnerMultiRunTargetEvaluation,
    runRiskAssessment: dependencies.runRiskAssessment,
    breakRiskAssessment: randomBreakOrDamageRiskAssessmentForEncounterBreak,
    shouldAvoidRun: (assessment) =>
      dependencies.shouldAvoidRandomBreakOrDamageRisk(
        assessment as RandomBreakOrDamageRiskAssessment | undefined,
      ),
  });

  return {
    ...multiRunContext,
    randomBreakOrDamageRiskAssessmentForEncounterBreak,
    runnerRandomBreakOrDamageRiskEvidenceForAction,
    runnerRandomBreakOrDamageRunExclusion,
  };
}
