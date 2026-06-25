import type {
  AiDecision,
  AiDecisionDebug,
  AiDecisionInput,
  CardDefinitionId,
  CardInstanceId,
  LegalAction,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import type { DeckCapabilityProfile } from "../deck-capabilities";
import type { RunnerHandDevelopmentEvaluation } from "../runner-hand-development";
import type {
  RunnerEconomyPosture,
  RunnerRunTargetEvaluation,
} from "../runner-run-target-evaluation";
import type { RunnerStrategicIntentProfile } from "../runner-strategic-intent";
import type { RunnerTacticalGoal } from "../runner-tactical-goals";
import type {
  TacticalPlanBuildContext,
  TacticalPlanMemorySnapshot,
  TacticalPlanRuntimeResult,
} from "../tactical-plans";
import {
  semanticPilotChoice,
  semanticPlayStrengthPilotEnabled,
} from "../decision/pilot-scope-registry";
import { buildSemanticDecisionFrame } from "../decision/semantic-decision-frame";
import { buildMergedTacticalGoals } from "../decision/tactical-goal-merge";
import { buildSemanticShadowDecision } from "../decision/semantic-shadow-decision";
import { semanticRuntimeForcedLegacy } from "../legacy/legacy-runtime-fallback";
import { rememberStrategicIntentState } from "../strategic-intent-memory";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";
import type { AiDecisionRuntimeOptions } from "./choose-ai-action";
import type {
  SemanticRuntimeChoice,
  SemanticRuntimeCoverageSelectionDebug,
  SemanticRuntimeRunOnlyActionAdjustment,
  TacticalPlanMappedChoiceResult,
} from "./semantic-runtime-types";

export type {
  SemanticRuntimeChoice,
  SemanticRuntimeCoverageSelectionDebug,
  SemanticRuntimeExclusion,
  SemanticRuntimeRunOnlyActionAdjustment,
  TacticalPlanMappedChoiceResult,
} from "./semantic-runtime-types";

export type SemanticRuntimeDependencies = {
  semanticRuntimeChoices: (
    input: AiDecisionInput,
    actionSemanticCandidates?: readonly ActionSemanticCandidate[],
  ) => SemanticRuntimeChoice[];
  semanticRuntimeChoiceIsReactive: (choice: SemanticRuntimeChoice) => boolean;
  buildActionSemanticCandidates: (input: {
    legalActions: readonly LegalAction[];
    observerSide: AiDecisionInput["side"];
    stateVersion: number;
    visibleSourceDefinitionsByInstanceId?: Readonly<
      Record<CardInstanceId, CardDefinitionId>
    >;
  }) => ActionSemanticCandidate[];
  getTacticalPlanMemorySnapshot: (
    input: AiDecisionInput,
  ) => TacticalPlanMemorySnapshot | undefined;
  deckCapabilitiesForInput: (input: AiDecisionInput) => DeckCapabilityProfile;
  runnerStrategicIntentForInput: (
    input: AiDecisionInput,
    deckCapabilities: DeckCapabilityProfile,
  ) => RunnerStrategicIntentProfile;
  evaluateRunnerHandDevelopment: (input: {
    input: AiDecisionInput;
    strategicIntent: RunnerStrategicIntentProfile;
    deckCapabilities: DeckCapabilityProfile;
    actionCandidates: readonly ActionSemanticCandidate[];
  }) => RunnerHandDevelopmentEvaluation[];
  buildRunnerEconomyPosture: (input: {
    input: AiDecisionInput;
    strategicIntent: RunnerStrategicIntentProfile;
    deckCapabilities: DeckCapabilityProfile;
    handDevelopmentEvaluations?: readonly RunnerHandDevelopmentEvaluation[];
  }) => RunnerEconomyPosture;
  evaluateRunnerRunTargets: (input: {
    input: AiDecisionInput;
    strategicIntent: RunnerStrategicIntentProfile;
    deckCapabilities: DeckCapabilityProfile;
    actionCandidates: readonly ActionSemanticCandidate[];
    handDevelopmentEvaluations?: readonly RunnerHandDevelopmentEvaluation[];
  }) => RunnerRunTargetEvaluation[];
  buildRunnerTacticalGoals: (input: {
    input: AiDecisionInput;
    strategicIntent: RunnerStrategicIntentProfile;
    runTargetEvaluations?: readonly RunnerRunTargetEvaluation[];
    economyPosture?: RunnerEconomyPosture;
    deckCapabilities: DeckCapabilityProfile;
  }) => RunnerTacticalGoal[];
  evaluateTacticalPlans: (
    context: TacticalPlanBuildContext,
  ) => TacticalPlanRuntimeResult;
  bestSemanticRuntimeChoice: (
    choices: readonly SemanticRuntimeChoice[],
  ) => SemanticRuntimeChoice | undefined;
  bestSemanticRuntimeChoiceForTacticalPlanOverride: (
    choices: readonly SemanticRuntimeChoice[],
    planRuntime: TacticalPlanRuntimeResult,
  ) => SemanticRuntimeChoice | undefined;
  tacticalPlanMappedChoice: (
    input: AiDecisionInput,
    choices: readonly SemanticRuntimeChoice[],
    selectedMapping: TacticalPlanRuntimeResult["selectedMapping"],
    bestPlanOverrideChoice: SemanticRuntimeChoice | undefined,
  ) => TacticalPlanMappedChoiceResult;
  runnerSelfDamageImmediateWinSemanticChoice: (
    input: AiDecisionInput,
    choices: readonly SemanticRuntimeChoice[],
  ) => SemanticRuntimeChoice | undefined;
  semanticRuntimeChoiceWithEvidence: (
    choice: SemanticRuntimeChoice,
    options: {
      evidence: string[];
      minimumScore?: number;
      reasonCode?: string;
      explanation?: string;
    },
  ) => SemanticRuntimeChoice;
  tacticalPlanMappingOverrideEvidence: (
    mappedChoice: TacticalPlanMappedChoiceResult,
  ) => string[];
  tacticalPlanRuntimeAlignedToChoice: (
    planRuntime: TacticalPlanRuntimeResult,
    mappedChoice: SemanticRuntimeChoice | undefined,
    actionSemanticCandidates: readonly ActionSemanticCandidate[],
    input: AiDecisionInput,
  ) => TacticalPlanRuntimeResult;
  runnerRunOnlyActionAdjustedSemanticChoice: (
    input: AiDecisionInput,
    rankedChoices: readonly SemanticRuntimeChoice[],
    selectedChoice: SemanticRuntimeChoice,
  ) => SemanticRuntimeRunOnlyActionAdjustment;
  semanticRuntimeCoverageSelectionDebug: (
    input: AiDecisionInput,
    action: LegalAction,
    planRuntime: TacticalPlanRuntimeResult,
  ) => SemanticRuntimeCoverageSelectionDebug | undefined;
  selectedChoicesForDecision: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecision["selectedChoices"] | undefined;
  rememberTacticalPlanRuntime: (
    input: AiDecisionInput,
    result: TacticalPlanRuntimeResult,
    selectedAction: LegalAction,
  ) => TacticalPlanMemorySnapshot | undefined;
  scrubEvidence: (evidence: string[]) => string[];
  semanticRuntimeDecisionDebug: (
    input: AiDecisionInput,
    selected: SemanticRuntimeChoice,
    rankedChoices: SemanticRuntimeChoice[],
    legacyDecision: AiDecision,
    legacyActionType: LegalAction["type"] | undefined,
    planRuntime: TacticalPlanRuntimeResult,
  ) => AiDecisionDebug;
};

export function chooseSemanticRuntimeAction(
  input: AiDecisionInput,
  legacyDecisionOrProvider: AiDecision | (() => AiDecision),
  options: AiDecisionRuntimeOptions,
  dependencies: SemanticRuntimeDependencies,
): AiDecision {
  const legacyDecisionProvider = legacyDecisionProviderFrom(
    legacyDecisionOrProvider,
  );
  if (semanticRuntimeForcedLegacy()) {
    const legacyDecision = legacyDecisionProvider();
    return {
      ...legacyDecision,
      evidence: [
        ...(legacyDecision.evidence ?? []),
        "semantic_runtime_force_legacy",
      ],
    };
  }
  const actionSemanticCandidates = dependencies.buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: input.side,
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId:
      visibleSourceDefinitionsByInstanceId(input),
  });
  const choices = dependencies.semanticRuntimeChoices(
    input,
    actionSemanticCandidates,
  );
  const reactiveChoice =
    choices.find(
      (candidate) =>
        !candidate.exclusion &&
        candidate.score > 0 &&
        dependencies.semanticRuntimeChoiceIsReactive(candidate),
    ) ??
    choices.find(
      (candidate) =>
        !candidate.exclusion &&
        dependencies.semanticRuntimeChoiceIsReactive(candidate),
    );
  const previousPlan = dependencies.getTacticalPlanMemorySnapshot(input);
  const deckCapabilities = dependencies.deckCapabilitiesForInput(input);
  const runnerStrategicIntent =
    input.side === "runner"
      ? dependencies.runnerStrategicIntentForInput(input, deckCapabilities)
      : undefined;
  const runnerHandDevelopmentEvaluations = runnerStrategicIntent
    ? dependencies.evaluateRunnerHandDevelopment({
        input,
        strategicIntent: runnerStrategicIntent,
        deckCapabilities,
        actionCandidates: actionSemanticCandidates,
      })
    : undefined;
  const runnerEconomyPosture = runnerStrategicIntent
    ? dependencies.buildRunnerEconomyPosture({
        input,
        strategicIntent: runnerStrategicIntent,
        deckCapabilities,
        ...(runnerHandDevelopmentEvaluations
          ? { handDevelopmentEvaluations: runnerHandDevelopmentEvaluations }
          : {}),
      })
    : undefined;
  const runnerRunTargetEvaluations = runnerStrategicIntent
    ? dependencies.evaluateRunnerRunTargets({
        input,
        strategicIntent: runnerStrategicIntent,
        deckCapabilities,
        actionCandidates: actionSemanticCandidates,
        ...(runnerHandDevelopmentEvaluations
          ? { handDevelopmentEvaluations: runnerHandDevelopmentEvaluations }
          : {}),
      })
    : undefined;
  const runnerTacticalGoals = runnerStrategicIntent
    ? dependencies.buildRunnerTacticalGoals({
        input,
        strategicIntent: runnerStrategicIntent,
        ...(runnerRunTargetEvaluations
          ? { runTargetEvaluations: runnerRunTargetEvaluations }
          : {}),
        ...(runnerEconomyPosture
          ? { economyPosture: runnerEconomyPosture }
          : {}),
        deckCapabilities,
      })
    : undefined;
  const inputMetadata = input as AiDecisionInputWithDeckCapabilities;
  const strategicIntentState = inputMetadata.ownStrategicIntentState;
  const corpStrategicIntent =
    input.side === "corp" ? inputMetadata.ownCorpStrategicIntent : undefined;
  const doctrineDiagnostic = inputMetadata.ownDeckDoctrineV2Diagnostic;
  const goalFrame = buildSemanticDecisionFrame({
    input,
    actionCandidates: actionSemanticCandidates,
    tacticalGoals: runnerTacticalGoals ?? [],
    ...(doctrineDiagnostic ? { doctrineDiagnostic } : {}),
    deckCapabilities,
    ...(strategicIntentState ? { strategicIntentState } : {}),
    ...(corpStrategicIntent ? { corpStrategicIntent } : {}),
    runner: {
      ...(runnerRunTargetEvaluations
        ? { runTargets: runnerRunTargetEvaluations }
        : {}),
      ...(runnerEconomyPosture ? { economyPosture: runnerEconomyPosture } : {}),
    },
    evidence: ["semantic_runtime:tactical_goal_merge_input"],
  });
  const tacticalGoals = buildMergedTacticalGoals({
    frame: goalFrame,
    tacticalGoals: runnerTacticalGoals ?? [],
  });
  const planRuntime = reactiveChoice
    ? emptyTacticalPlanRuntimeResult()
    : dependencies.evaluateTacticalPlans({
        input,
        ...(previousPlan ? { previousPlan } : {}),
        deckCapabilities,
        ...(strategicIntentState ? { strategicIntentState } : {}),
        ...(corpStrategicIntent ? { corpStrategicIntent } : {}),
        tacticalGoals,
        ...(runnerStrategicIntent ? { runnerStrategicIntent } : {}),
        ...(runnerRunTargetEvaluations ? { runnerRunTargetEvaluations } : {}),
        ...(runnerEconomyPosture ? { runnerEconomyPosture } : {}),
        ...(runnerHandDevelopmentEvaluations
          ? { runnerHandDevelopmentEvaluations }
          : {}),
        ...(runnerTacticalGoals ? { runnerTacticalGoals } : {}),
        candidates: actionSemanticCandidates,
      });
  const bestChoice = dependencies.bestSemanticRuntimeChoice(choices);
  const bestPlanOverrideChoice =
    dependencies.bestSemanticRuntimeChoiceForTacticalPlanOverride(
      choices,
      planRuntime,
    );
  const mappedChoice = dependencies.tacticalPlanMappedChoice(
    input,
    choices,
    planRuntime.selectedMapping,
    bestPlanOverrideChoice,
  );
  const planMappingOverridden = Boolean(
    !reactiveChoice &&
      mappedChoice.overriddenMappedChoice &&
      mappedChoice.overrideChoice,
  );
  const selfDamageImmediateWinChoice =
    dependencies.runnerSelfDamageImmediateWinSemanticChoice(input, choices);
  const initialChoice =
    reactiveChoice ??
    selfDamageImmediateWinChoice ??
    mappedChoice.choice ??
    (planMappingOverridden && mappedChoice.overrideChoice
      ? dependencies.semanticRuntimeChoiceWithEvidence(
          mappedChoice.overrideChoice,
          {
            evidence:
              dependencies.tacticalPlanMappingOverrideEvidence(mappedChoice),
          },
        )
      : bestChoice);
  if (!initialChoice) {
    const legacyDecision = legacyDecisionProvider();
    return {
      ...legacyDecision,
      evidence: [
        ...(legacyDecision.evidence ?? []),
        "semantic_runtime_no_non_excluded_legal_action",
      ],
    };
  }
  const effectivePlanRuntime = planMappingOverridden
    ? dependencies.tacticalPlanRuntimeAlignedToChoice(
        planRuntime,
        mappedChoice.overrideChoice,
        actionSemanticCandidates,
        input,
      )
    : planRuntime;
  const runOnlyActionAdjusted =
    dependencies.runnerRunOnlyActionAdjustedSemanticChoice(
      input,
      choices,
      initialChoice,
  );
  const choice = runOnlyActionAdjusted.choice;
  const pilotChoice = semanticPlayStrengthPilotEnabled()
    ? (() => {
        const pilotFrame = buildSemanticDecisionFrame({
          input,
          actionCandidates: actionSemanticCandidates,
          tacticalGoals: runnerTacticalGoals ?? [],
          ...(doctrineDiagnostic ? { doctrineDiagnostic } : {}),
          tacticalPlan: effectivePlanRuntime,
          deckCapabilities,
          ...(strategicIntentState ? { strategicIntentState } : {}),
          ...(corpStrategicIntent ? { corpStrategicIntent } : {}),
          runner: {
            ...(runnerRunTargetEvaluations
              ? { runTargets: runnerRunTargetEvaluations }
              : {}),
            ...(runnerEconomyPosture
              ? { economyPosture: runnerEconomyPosture }
              : {}),
          },
          evidence: ["semantic_runtime:play_strength_pilot_candidate"],
        });
        return semanticPilotChoice({
          frame: pilotFrame,
          trace: buildSemanticShadowDecision(pilotFrame),
          currentChoice: choice,
          choices: runOnlyActionAdjusted.rankedChoices,
        });
      })()
    : undefined;
  const selectedChoice = pilotChoice?.choice ?? choice;
  const coverageSelectionDebug =
    dependencies.semanticRuntimeCoverageSelectionDebug(
      input,
      selectedChoice.action,
      effectivePlanRuntime,
    );
  const legacyDecision = legacyDecisionProvider();
  const legacyActionType = input.legalActions.find(
    (action) => action.actionId === legacyDecision.actionId,
  )?.type;
  const selectedChoices = dependencies.selectedChoicesForDecision(
    input,
    selectedChoice.action,
  );
  const persistTacticalPlanMemory = options.persistTacticalPlanMemory !== false;
  const updatedPlanMemory = persistTacticalPlanMemory
    ? dependencies.rememberTacticalPlanRuntime(
        input,
        effectivePlanRuntime,
        pilotChoice
          ? selectedChoice.action
          : runOnlyActionAdjusted.memoryAction ?? selectedChoice.action,
      )
    : undefined;
  const updatedStrategicIntentMemory =
    persistTacticalPlanMemory && strategicIntentState
      ? rememberStrategicIntentState(input, strategicIntentState)
      : undefined;
  const selectedReasonCode =
    input.side === "corp" &&
    selectedChoice.action.actionId.includes("schlaghund_tag_damage")
      ? "corp.semantic.corp_tag_punish"
      : selectedChoice.reasonCode;
  return {
    actionId: selectedChoice.action.actionId,
    ...(selectedChoices ? { selectedChoices } : {}),
    reasonCode: selectedReasonCode,
    explanation: selectedChoice.explanation,
    consideredActionIds: [],
    fallbackUsed: false,
    ...(selectedChoice.confidence !== undefined
      ? { confidence: selectedChoice.confidence }
      : {}),
    evidence: dependencies.scrubEvidence([
      ...selectedChoice.evidence,
      ...(coverageSelectionDebug?.evidence ?? []),
      `semantic_runtime_default:true`,
      `semantic_runtime_scope:${selectedChoice.scopeId}`,
      ...(effectivePlanRuntime.selectedPlan
        ? [
            `tactical_plan:${effectivePlanRuntime.selectedPlan.planId}`,
            `tactical_plan_type:${effectivePlanRuntime.selectedPlan.type}`,
          ]
        : []),
      ...(effectivePlanRuntime.selectedStep
        ? [`tactical_step:${effectivePlanRuntime.selectedStep.kind}`]
        : []),
      ...(updatedPlanMemory
        ? [
            `tactical_plan_memory_status:${updatedPlanMemory.status}`,
            `tactical_plan_progression:${updatedPlanMemory.planProgressionReason}`,
          ]
        : []),
      ...(updatedStrategicIntentMemory
        ? [
            `strategic_intent_memory:${updatedStrategicIntentMemory.primaryStrategyId}`,
            `strategic_intent_memory_phase:${updatedStrategicIntentMemory.phase}`,
            `strategic_intent_memory_transition:${updatedStrategicIntentMemory.transitionStatus}`,
          ]
        : []),
      ...(!persistTacticalPlanMemory && effectivePlanRuntime.selectedPlan
        ? ["tactical_plan_memory_preview_only:true"]
        : []),
      ...(!persistTacticalPlanMemory && strategicIntentState
        ? ["strategic_intent_memory_preview_only:true"]
        : []),
      ...(pilotChoice ? pilotChoice.evidence : []),
      `legacy_reference_reason:${legacyDecision.reasonCode}`,
      ...(legacyActionType
        ? [`legacy_reference_action_type:${legacyActionType}`]
        : []),
    ]),
    decisionDebug: dependencies.semanticRuntimeDecisionDebug(
      input,
      selectedChoice,
      runOnlyActionAdjusted.rankedChoices,
      legacyDecision,
      legacyActionType,
      effectivePlanRuntime,
    ),
    timeoutUsed: Boolean(legacyDecision.timeoutUsed),
    profileId: input.profileId,
    difficulty: input.difficulty,
    reason: selectedReasonCode,
  };
}

function legacyDecisionProviderFrom(
  legacyDecisionOrProvider: AiDecision | (() => AiDecision),
): () => AiDecision {
  if (typeof legacyDecisionOrProvider === "function") {
    return legacyDecisionOrProvider;
  }
  return () => legacyDecisionOrProvider;
}

function visibleSourceDefinitionsByInstanceId(
  input: AiDecisionInput,
): Readonly<Record<CardInstanceId, CardDefinitionId>> {
  const entries = [
    input.playerView.own.identity,
    ...input.playerView.own.gripOrHq,
    ...input.playerView.own.heapOrArchives,
    ...input.playerView.own.scoreArea,
    ...(input.playerView.own.rig ?? []),
  ]
    .filter(
      (
        card,
      ): card is typeof card & {
        instanceId: CardInstanceId;
        definitionId: CardDefinitionId;
      } => card.known && card.definitionId !== undefined,
    )
    .map((card) => [card.instanceId, card.definitionId] as const);
  return Object.fromEntries(entries) as Record<
    CardInstanceId,
    CardDefinitionId
  >;
}

function emptyTacticalPlanRuntimeResult(): TacticalPlanRuntimeResult {
  return {
    planAlternatives: [],
    blockedPlans: [],
  };
}
