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
  createRunnerSelfDamageContext,
  type RunnerSelfDamageContext,
  type RunnerSelfDamageContextDependencies,
} from "./runner-self-damage-context";
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
    RunnerSelfDamageContextDependencies &
    Omit<RunnerBlinkBreakExclusionDependencies, "shouldAvoidRun"> &
    Omit<RunnerEncounterActionExclusionDependencies, "blinkBreakExclusion"> &
    Omit<
      SemanticRuntimeActionExclusionDependencies,
      | "runnerEncounterActionExclusion"
      | "runnerSelfDamageSurvivalExclusion"
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
  Omit<RunnerSelfDamageContext, "runnerSelfDamageSurvivalExclusion"> &
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

  const {
    runnerSelfDamageGuardedDecision,
    runnerSelfDamageImmediateWinSemanticChoice,
    runnerSelfDamageSurvivalAssessment,
    runnerSelfDamageSurvivalExclusion,
  } = createRunnerSelfDamageContext({
    sourceDefinitionIdForAction: dependencies.sourceDefinitionIdForAction,
    hintEffectsForCard: dependencies.hintEffectsForCard,
    fakedHitCardId: dependencies.fakedHitCardId,
    badPublicityLossThreshold: dependencies.badPublicityLossThreshold,
    scoreRunnerActions: dependencies.scoreRunnerActions,
    compareAction: dependencies.compareAction,
    selectedChoicesForDecision: dependencies.selectedChoicesForDecision,
    scrubEvidence: dependencies.scrubEvidence,
  });

  const { semanticRuntimeActionExclusion } =
    createSemanticRuntimeActionExclusionContext({
      planMemoryActionExclusion: dependencies.planMemoryActionExclusion,
      corpAdvancementCounterPlacementAssessment:
        dependencies.corpAdvancementCounterPlacementAssessment,
      runnerSelfDamageSurvivalExclusion:
        runnerSelfDamageSurvivalExclusion,
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
    runnerSelfDamageGuardedDecision,
    runnerSelfDamageImmediateWinSemanticChoice,
    runnerSelfDamageSurvivalAssessment,
    semanticRuntimeActionExclusion,
  };
}
