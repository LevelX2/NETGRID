import type { BlinkRiskAssessment } from "../runner-run-target-evaluation";
import {
  createRunnerBlinkBreakExclusionContext,
  type RunnerBlinkBreakExclusionDependencies,
} from "./runner-blink-break-exclusion";
import {
  createRunnerEncounterActionExclusionContext,
  type RunnerEncounterActionExclusionContext,
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
import { createSemanticRuntimeActionExclusionContext } from "./semantic-runtime-action-exclusion-context";
import type { SemanticRuntimeActionExclusionDependencies } from "./semantic-runtime-action-exclusion";

type ActionExclusionCardDefinition = {
  title?: string;
  type?: string;
  subtypes?: string[];
  rulesText?: string;
  mechanics?: string[];
};

type ActionExclusionHint = {
  effects?: readonly unknown[];
};

export type SemanticRuntimeActionExclusionCompositionDependencies = Omit<
  RunnerSourceCardAnswerRoleDependencies,
  "sourceDefinitionId" | "sourceDefinition"
> &
  RunnerSimpleExclusionsContextDependencies &
  Omit<RunnerSelfDamageContextDependencies, "hintEffectsForCard"> &
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
    runtimeDefinition: (
      definitionId: string,
    ) => ActionExclusionCardDefinition | undefined;
    demoDefinition: (
      definitionId: string,
    ) => ActionExclusionCardDefinition | undefined;
    hintForDefinitionId: (
      definitionId: string,
    ) => ActionExclusionHint | undefined;
  };

export function createSemanticRuntimeActionExclusionComposition(
  dependencies: SemanticRuntimeActionExclusionCompositionDependencies,
): RunnerSourceCardAnswerRoleContext &
  Omit<RunnerSelfDamageContext, "runnerSelfDamageSurvivalExclusion"> &
  RunnerEncounterActionExclusionContext &
  ReturnType<typeof createSemanticRuntimeActionExclusionContext> {
  const { semanticRuntimeRunnerSourceCardAnswerRole } =
    createRunnerSourceCardAnswerRoleContext({
      visibleSourceCard: dependencies.visibleSourceCard,
      sourceDefinitionId: dependencies.sourceDefinitionIdForAction,
      rolesForCardId: dependencies.rolesForCardId,
      sourceDefinition: (definitionId) =>
        definitionId
          ? (dependencies.runtimeDefinition(definitionId) ??
            dependencies.demoDefinition(definitionId))
          : undefined,
      hintEffectsForCard: (definitionId) =>
        definitionId
          ? dependencies.hintForDefinitionId(definitionId)?.effects
          : undefined,
    });

  const {
    semanticRuntimeKnownCentralPayoffExclusion,
    semanticRuntimeRunnerEmptyRemoteExclusion,
    semanticRuntimeRunnerArchivesExclusion,
  } = createRunnerSimpleExclusionsContext({
    evaluateKnownCentralPayoff: dependencies.evaluateKnownCentralPayoff,
    definitionType: dependencies.definitionType,
  });

  const { semanticRuntimeRunnerBlinkBreakExclusion } =
    createRunnerBlinkBreakExclusionContext({
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
    runnerSelfDamageImmediateWinSemanticChoice,
    runnerSelfDamageSurvivalAssessment,
    runnerSelfDamageSurvivalExclusion,
  } = createRunnerSelfDamageContext({
    sourceDefinitionIdForAction: dependencies.sourceDefinitionIdForAction,
    hintEffectsForCard: (definitionId) =>
      dependencies.hintForDefinitionId(definitionId)?.effects,
    fakedHitCardId: dependencies.fakedHitCardId,
    badPublicityLossThreshold: dependencies.badPublicityLossThreshold,
    cardAddressesVisibleBreakerNeed:
      dependencies.cardAddressesVisibleBreakerNeed,
  });

  const { semanticRuntimeActionExclusion } =
    createSemanticRuntimeActionExclusionContext({
      ...(dependencies.previousPlan
        ? { previousPlan: dependencies.previousPlan }
        : {}),
      planMemoryActionExclusion: dependencies.planMemoryActionExclusion,
      ...(dependencies.corpUpgradePlacementExclusion
        ? {
            corpUpgradePlacementExclusion:
              dependencies.corpUpgradePlacementExclusion,
          }
        : {}),
      corpAdvancementCounterPlacementAssessment:
        dependencies.corpAdvancementCounterPlacementAssessment,
      runnerSelfDamageSurvivalExclusion: runnerSelfDamageSurvivalExclusion,
      runnerEncounterActionExclusion,
      runnerProgramSacrificeExclusion:
        dependencies.runnerProgramSacrificeExclusion,
      runnerMultiRunEventExclusion: dependencies.runnerMultiRunEventExclusion,
      runnerRunTargetEvaluationForAction:
        dependencies.runnerRunTargetEvaluationForAction,
      runnerBlinkRunExclusion: dependencies.runnerBlinkRunExclusion,
      knownCentralPayoffExclusion: semanticRuntimeKnownCentralPayoffExclusion,
      runnerArchivesExclusion: semanticRuntimeRunnerArchivesExclusion,
      runnerEmptyRemoteExclusion: semanticRuntimeRunnerEmptyRemoteExclusion,
      isRemoteServerTarget: dependencies.isRemoteServerTarget,
      knownIcePathReason: dependencies.knownIcePathReason,
    });

  return {
    semanticRuntimeRunnerSourceCardAnswerRole,
    runnerSelfDamageImmediateWinSemanticChoice,
    runnerSelfDamageSurvivalAssessment,
    runnerEncounterActionExclusion,
    semanticRuntimeActionExclusion,
  };
}
