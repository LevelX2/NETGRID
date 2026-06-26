import type { BlinkRiskAssessment } from "../runner-run-target-evaluation";
import {
  createRunnerBlinkBreakExclusionContext,
  type RunnerBlinkBreakExclusionDependencies,
} from "./runner-blink-break-exclusion";
import {
  createRunnerEncounterActionExclusionContext,
  type RunnerEncounterActionExclusionDependencies,
} from "./runner-encounter-action-exclusion";
import {
  createRunnerSimpleExclusionsContext,
  type RunnerSimpleExclusionsContextDependencies,
} from "./runner-simple-exclusions-context";
import {
  createRunnerSourceCardAnswerRoleContext,
  type RunnerSourceCardAnswerRoleContext,
} from "./runner-source-card-answer-role-context";
import type { RunnerSourceCardAnswerRoleDependencies } from "./runner-source-card-answer-role";
import {
  createSemanticRuntimeActionExclusionContext,
} from "./semantic-runtime-action-exclusion-context";
import type { SemanticRuntimeActionExclusionDependencies } from "./semantic-runtime-action-exclusion";

export type SemanticRuntimeActionExclusionCompositionDependencies =
  RunnerSourceCardAnswerRoleDependencies &
    RunnerSimpleExclusionsContextDependencies &
    Omit<RunnerBlinkBreakExclusionDependencies, "shouldAvoidRun"> &
    Omit<RunnerEncounterActionExclusionDependencies, "blinkBreakExclusion"> &
    Omit<
      SemanticRuntimeActionExclusionDependencies,
      | "runnerEncounterActionExclusion"
      | "knownCentralPayoffExclusion"
      | "runnerArchivesExclusion"
      | "runnerEmptyRemoteExclusion"
    > & {
      shouldAvoidBlinkRiskAssessment: (
        assessment: BlinkRiskAssessment | undefined,
      ) => boolean;
    };

export function createSemanticRuntimeActionExclusionComposition(
  dependencies: SemanticRuntimeActionExclusionCompositionDependencies,
): RunnerSourceCardAnswerRoleContext &
  ReturnType<typeof createSemanticRuntimeActionExclusionContext> {
  const {
    semanticRuntimeRunnerSourceCardAnswerRole,
  } = createRunnerSourceCardAnswerRoleContext({
    visibleSourceCard: dependencies.visibleSourceCard,
    sourceDefinitionId: dependencies.sourceDefinitionId,
    rolesForCardId: dependencies.rolesForCardId,
    sourceDefinition: dependencies.sourceDefinition,
  });

  const {
    semanticRuntimeKnownCentralPayoffExclusion,
    semanticRuntimeRunnerEmptyRemoteExclusion,
    semanticRuntimeRunnerArchivesExclusion,
  } = createRunnerSimpleExclusionsContext({
    evaluateKnownCentralPayoff: dependencies.evaluateKnownCentralPayoff,
    definitionType: dependencies.definitionType,
  });

  const {
    semanticRuntimeRunnerBlinkBreakExclusion,
  } = createRunnerBlinkBreakExclusionContext({
    riskAssessment: dependencies.riskAssessment,
    shouldAvoidRun: (assessment) =>
      dependencies.shouldAvoidBlinkRiskAssessment(
        assessment as BlinkRiskAssessment | undefined,
      ),
  });

  const { runnerEncounterActionExclusion } =
    createRunnerEncounterActionExclusionContext({
      blinkBreakExclusion: semanticRuntimeRunnerBlinkBreakExclusion,
      pumpViabilityAssessment: dependencies.pumpViabilityAssessment,
      breakAccessPathAssessment: dependencies.breakAccessPathAssessment,
    });

  const { semanticRuntimeActionExclusion } =
    createSemanticRuntimeActionExclusionContext({
      planMemoryActionExclusion: dependencies.planMemoryActionExclusion,
      corpAdvancementCounterPlacementAssessment:
        dependencies.corpAdvancementCounterPlacementAssessment,
      runnerSelfDamageSurvivalExclusion:
        dependencies.runnerSelfDamageSurvivalExclusion,
      runnerEncounterActionExclusion,
      runnerProgramSacrificeExclusion:
        dependencies.runnerProgramSacrificeExclusion,
      runnerMultiRunEventExclusion: dependencies.runnerMultiRunEventExclusion,
      runnerRunTargetEvaluationForAction:
        dependencies.runnerRunTargetEvaluationForAction,
      runnerBlinkRunExclusion: dependencies.runnerBlinkRunExclusion,
      knownCentralPayoffExclusion:
        semanticRuntimeKnownCentralPayoffExclusion,
      runnerArchivesExclusion: semanticRuntimeRunnerArchivesExclusion,
      runnerEmptyRemoteExclusion: semanticRuntimeRunnerEmptyRemoteExclusion,
      isRemoteServerTarget: dependencies.isRemoteServerTarget,
      knownIcePathReason: dependencies.knownIcePathReason,
    });

  return {
    semanticRuntimeRunnerSourceCardAnswerRole,
    semanticRuntimeActionExclusion,
  };
}
