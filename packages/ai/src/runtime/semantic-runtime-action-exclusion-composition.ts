import type { RandomBreakOrDamageRiskAssessment } from "../runner-run-target-evaluation";
import {
  createRunnerRandomBreakOrDamageBreakExclusionContext,
  type RunnerRandomBreakOrDamageBreakExclusionDependencies,
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
  Omit<RunnerRandomBreakOrDamageBreakExclusionDependencies, "shouldAvoidRun"> &
  Omit<
    RunnerEncounterActionExclusionDependencies,
    "randomBreakOrDamageBreakExclusion"
  > &
  Omit<
    SemanticRuntimeActionExclusionDependencies,
    | "runnerEncounterActionExclusion"
    | "runnerSelfDamageSurvivalExclusion"
    | "knownCentralPayoffExclusion"
    | "runnerArchivesExclusion"
    | "runnerEmptyRemoteExclusion"
  > & {
    shouldAvoidRandomBreakOrDamageRisk: (
      assessment: RandomBreakOrDamageRiskAssessment | undefined,
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

  const { semanticRuntimeRunnerRandomBreakOrDamageBreakExclusion } =
    createRunnerRandomBreakOrDamageBreakExclusionContext({
      riskAssessment: dependencies.riskAssessment,
      shouldAvoidRun: (assessment) =>
        dependencies.shouldAvoidRandomBreakOrDamageRisk(
          assessment as RandomBreakOrDamageRiskAssessment | undefined,
        ),
    });

  const { runnerEncounterActionExclusion } =
    createRunnerEncounterActionExclusionContext({
      randomBreakOrDamageBreakExclusion:
        semanticRuntimeRunnerRandomBreakOrDamageBreakExclusion,
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
      runnerRandomBreakOrDamageRunExclusion:
        dependencies.runnerRandomBreakOrDamageRunExclusion,
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
