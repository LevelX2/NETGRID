import type {
  AiDecision,
  AiDecisionDebug,
  AiDecisionInput,
  CardDefinitionId,
  CardInstanceId,
  LegalAction,
} from "@netgrid/shared";
import { AI_DECISION_DEBUG_SCHEMA_VERSION } from "@netgrid/shared";
import type {
  ActionSemanticCandidate,
  BuildActionSemanticCandidatesParams,
} from "../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../actions/action-card-semantic-profiles";
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
import { buildCorpTacticalGoals } from "../decision/corp-tactical-goals";
import { buildSemanticDecisionFrame } from "../decision/semantic-decision-frame";
import type { TacticalGoalLike } from "../decision/semantic-decision-frame";
import { buildMergedTacticalGoals } from "../decision/tactical-goal-merge";
import { buildSemanticShadowDecision } from "../decision/semantic-shadow-decision";
import { rememberStrategicIntentState } from "../strategic-intent-memory";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";
import type { AiDecisionRuntimeOptions } from "./choose-ai-action";
import type {
  SemanticRuntimeChoice,
  SemanticRuntimeCoverageSelectionDebug,
  SemanticRuntimeRunOnlyActionAdjustment,
  TacticalPlanMappedChoiceResult,
} from "./semantic-runtime-types";
import {
  rememberRunnerRunPlanMemorySnapshot,
  requireActiveRunnerRunPlan,
} from "./runner-run-plan-memory";
import { runnerRunPlanSemanticChoice } from "./runner-run-plan-policy";
import { revalidateRunnerRunPlan } from "./runner-run-plan-revalidation";
import { createRunnerRunPlanForSelectedAction } from "./runner-run-plan-start";
import { sourceDefinitionIdForAction } from "./visible-card-lookup";

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
  buildActionSemanticCandidates: (
    input: BuildActionSemanticCandidatesParams,
  ) => ActionSemanticCandidate[];
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
    planRuntime: TacticalPlanRuntimeResult,
    actionSemanticCandidates: readonly ActionSemanticCandidate[],
  ) => AiDecisionDebug;
};

export function chooseSemanticRuntimeAction(
  input: AiDecisionInput,
  options: AiDecisionRuntimeOptions,
  dependencies: SemanticRuntimeDependencies,
): AiDecision {
  const actionSemanticCandidates = dependencies.buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: input.side,
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId:
      visibleSourceDefinitionsByInstanceId(input),
    cardSemanticProfilesByDefinitionId:
      buildActionCardSemanticProfilesByDefinitionId(),
  });
  const activeRunnerRunPlanSnapshot = requireActiveRunnerRunPlan(input);
  const activeRunnerRunPlan = activeRunnerRunPlanSnapshot
    ? revalidateRunnerRunPlan(input, activeRunnerRunPlanSnapshot)
    : undefined;
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
  const corpTacticalGoals =
    input.side === "corp"
      ? buildCorpTacticalGoals(
          buildSemanticDecisionFrame({
            input,
            actionCandidates: actionSemanticCandidates,
            deckCapabilities,
            ...(strategicIntentState ? { strategicIntentState } : {}),
            ...(corpStrategicIntent ? { corpStrategicIntent } : {}),
            evidence: ["semantic_runtime:corp_tactical_goal_input"],
          }),
        )
      : undefined;
  const semanticChoiceTacticalGoals = runtimeTacticalGoalsForInput(
    runnerTacticalGoals,
    corpTacticalGoals,
  );
  const inputForSemanticChoices =
    semanticChoiceTacticalGoals.length > 0
      ? ({
          ...input,
          ...(runnerTacticalGoals && runnerTacticalGoals.length > 0
            ? { ownRunnerTacticalGoals: runnerTacticalGoals }
            : {}),
          ...(corpTacticalGoals && corpTacticalGoals.length > 0
            ? { ownCorpTacticalGoals: corpTacticalGoals }
            : {}),
        } as AiDecisionInput)
      : input;
  const choices = dependencies.semanticRuntimeChoices(
    inputForSemanticChoices,
    actionSemanticCandidates,
  );
  const runPlanChoice = activeRunnerRunPlan
    ? runnerRunPlanSemanticChoice({
        input,
        plan: activeRunnerRunPlan,
        choices,
      })
    : undefined;
  const reactiveChoice =
    activeRunnerRunPlan !== undefined
      ? undefined
      : choices.find(
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
  const goalFrame = buildSemanticDecisionFrame({
    input,
    actionCandidates: actionSemanticCandidates,
    tacticalGoals: semanticChoiceTacticalGoals,
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
    tacticalGoals: semanticChoiceTacticalGoals,
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
  const selfDamageImmediateWinChoice =
    dependencies.runnerSelfDamageImmediateWinSemanticChoice(input, choices);
  const initialChoice =
    runPlanChoice ??
    reactiveChoice ??
    selfDamageImmediateWinChoice ??
    mappedChoice.choice ??
    bestChoice;
  if (!initialChoice) {
    return semanticCoverageFallbackDecision(
      input,
      actionSemanticCandidates,
      choices,
      dependencies,
    );
  }
  const effectivePlanRuntime = mappedChoice.outcome === "semantic_choice_selected"
    ? dependencies.tacticalPlanRuntimeAlignedToChoice(
        planRuntime,
        mappedChoice.choice,
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
          tacticalGoals: semanticChoiceTacticalGoals,
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
  const newRunnerRunPlan =
    persistTacticalPlanMemory && input.side === "runner"
      ? createRunnerRunPlanForSelectedAction({
          input,
          selectedAction: selectedChoice.action,
          ...(runnerRunTargetEvaluations
            ? { runnerRunTargetEvaluations }
            : {}),
          ...(runnerTacticalGoals ? { runnerTacticalGoals } : {}),
          ...(runnerStrategicIntent ? { runnerStrategicIntent } : {}),
          actionSemanticCandidates,
        })
      : undefined;
  const updatedRunnerRunPlanMemory = newRunnerRunPlan
    ? rememberRunnerRunPlanMemorySnapshot(input, newRunnerRunPlan)
    : persistTacticalPlanMemory && activeRunnerRunPlan
      ? rememberRunnerRunPlanMemorySnapshot(input, activeRunnerRunPlan)
      : undefined;
  const updatedStrategicIntentMemory =
    persistTacticalPlanMemory && strategicIntentState
      ? rememberStrategicIntentState(input, strategicIntentState)
      : undefined;
  const selectedReasonCode =
    input.side === "corp" &&
    isSchlaghundTagDamageAction(input, selectedChoice.action)
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
      ...(updatedRunnerRunPlanMemory
        ? [
            `runner_run_plan_memory:${newRunnerRunPlan ? "created" : "updated"}`,
            `runner_run_plan_id:${updatedRunnerRunPlanMemory.id}`,
            `runner_run_plan_objective:${updatedRunnerRunPlanMemory.objective.kind}`,
            `runner_run_plan_target:${updatedRunnerRunPlanMemory.targetServer.id}`,
            `runner_run_plan_revalidation:${updatedRunnerRunPlanMemory.revalidation.status}`,
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
    ]),
    decisionDebug: dependencies.semanticRuntimeDecisionDebug(
      input,
      selectedChoice,
      runOnlyActionAdjusted.rankedChoices,
      effectivePlanRuntime,
      actionSemanticCandidates,
    ),
    timeoutUsed: false,
    profileId: input.profileId,
    difficulty: input.difficulty,
    reason: selectedReasonCode,
  };
}

function isSchlaghundTagDamageAction(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  return (
    action.payload?.v1921AssetAbility === "schlaghund_tag_damage" &&
    sourceDefinitionIdForAction(input, action) === "onr_v1_339_schlaghund"
  );
}

function runtimeTacticalGoalsForInput(
  runnerTacticalGoals: readonly RunnerTacticalGoal[] | undefined,
  corpTacticalGoals: readonly TacticalGoalLike[] | undefined,
): TacticalGoalLike[] {
  return [
    ...(runnerTacticalGoals ?? []),
    ...(corpTacticalGoals ?? []),
  ];
}

function semanticCoverageFallbackDecision(
  input: AiDecisionInput,
  actionSemanticCandidates: readonly ActionSemanticCandidate[],
  choices: readonly SemanticRuntimeChoice[],
  dependencies: SemanticRuntimeDependencies,
): AiDecision {
  const rankedFallbackActions = [...input.legalActions].sort(
    (left, right) =>
      fallbackPolicyRank(input, left) - fallbackPolicyRank(input, right) ||
      left.actionId.localeCompare(right.actionId),
  );
  const action = rankedFallbackActions[0];
  const policy = action ? fallbackPolicyForAction(input, action) : "none";
  const evidence = dependencies.scrubEvidence([
    "semantic_coverage_fallback:true",
    "fallback_reason:no_semantic_candidate",
    `fallback_action_policy:${policy}`,
    `fallback_candidate_count:${actionSemanticCandidates.length}`,
    `fallback_choice_count:${choices.length}`,
    ...(action
      ? [`fallback_action_type:${action.type}`, `fallback_action_id:${action.actionId}`]
      : ["fallback_action:none"]),
  ]);
  if (!action) {
    return {
      actionId: "",
      reasonCode: `${input.side}.semantic.coverage_fallback.no_legal_action`,
      explanation:
        "Semantic Runtime fand keine auswaehlbare Aktion und die Engine lieferte keine LegalActions.",
      consideredActionIds: [],
      fallbackUsed: true,
      evidence,
      decisionDebug: semanticCoverageFallbackDebug(input, undefined, evidence),
      timeoutUsed: false,
      profileId: input.profileId,
      difficulty: input.difficulty,
      reason: `${input.side}.semantic.coverage_fallback.no_legal_action`,
    };
  }
  const selectedChoices = dependencies.selectedChoicesForDecision(input, action);
  const reasonCode = `${input.side}.semantic.coverage_fallback.${policy}`;
  return {
    actionId: action.actionId,
    ...(selectedChoices ? { selectedChoices } : {}),
    reasonCode,
    explanation:
      "Semantic Runtime nutzte einen deterministischen Safety-Fallback auf vorhandenen LegalActions.",
    consideredActionIds: input.legalActions.map((candidate) => candidate.actionId),
    fallbackUsed: true,
    evidence,
    decisionDebug: semanticCoverageFallbackDebug(input, action, evidence),
    timeoutUsed: false,
    profileId: input.profileId,
    difficulty: input.difficulty,
    reason: reasonCode,
  };
}

function fallbackPolicyRank(input: AiDecisionInput, action: LegalAction): number {
  switch (fallbackPolicyForAction(input, action)) {
    case "mandatory_choice":
      return 0;
    case "direct_closeout":
      return 1;
    case "tag_clear":
      return 2;
    case "required_run_continue":
      return 3;
    case "access_resolution":
      return 4;
    case "economy_basic":
      return 5;
    case "draw_setup":
      return 6;
    case "end_turn":
      return 7;
    case "lowest_risk_deterministic":
      return 20;
  }
}

function fallbackPolicyForAction(
  input: AiDecisionInput,
  action: LegalAction,
):
  | "mandatory_choice"
  | "direct_closeout"
  | "tag_clear"
  | "required_run_continue"
  | "access_resolution"
  | "economy_basic"
  | "draw_setup"
  | "end_turn"
  | "lowest_risk_deterministic" {
  if (action.type === "resolve_choice") return "mandatory_choice";
  if (action.type === "score_agenda" || action.type === "steal_agenda") {
    return "direct_closeout";
  }
  if (
    action.type === "remove_tag" &&
    input.side === "runner" &&
    input.playerView.own.tags > 0
  ) {
    return "tag_clear";
  }
  if (action.type === "continue_run") return "required_run_continue";
  if (action.type === "access_card" || action.type === "trash_accessed_card") {
    return "access_resolution";
  }
  if (action.type === "gain_credit") return "economy_basic";
  if (action.type === "draw_card") return "draw_setup";
  if (action.type === "end_turn") return "end_turn";
  return "lowest_risk_deterministic";
}

function semanticCoverageFallbackDebug(
  input: AiDecisionInput,
  action: LegalAction | undefined,
  evidence: readonly string[],
): AiDecisionDebug {
  return {
    schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
    aiLevel: 2,
    summary:
      "Semantic Runtime Coverage-Fallback auf vorhandene Engine-LegalAction.",
    planId: "semantic_runtime:coverage_fallback",
    planKind: "coverage_fallback",
    ...(action ? { selectedActionType: action.type } : {}),
    score: 0,
    visibleReasons: [...evidence].slice(0, 8),
    rankedAlternatives: [],
    actionAlternatives: [],
    scoreBreakdown: [],
    whyNot: semanticCoverageFallbackWhyNot(evidence),
    evidence: [...evidence].slice(0, 12),
    fallbackUsed: true,
    profileId: input.profileId,
    timeoutUsed: false,
  };
}

function semanticCoverageFallbackWhyNot(evidence: readonly string[]): string[] {
  return [
    "fallback_reason:no_semantic_candidate",
    ...evidence.filter(
      (entry) =>
        entry.startsWith("fallback_action_policy:") ||
        entry.startsWith("fallback_candidate_count:") ||
        entry.startsWith("fallback_choice_count:") ||
        entry.startsWith("fallback_action_type:") ||
        entry.startsWith("fallback_action_id:") ||
        entry === "fallback_action:none",
    ),
  ];
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
