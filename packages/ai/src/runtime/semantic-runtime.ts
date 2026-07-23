import type {
  AiDecision,
  AiDecisionChainDebug,
  AiDecisionDebug,
  AiDecisionInput,
  LegalAction,
} from "@netgrid/shared";
import { AI_DECISION_DEBUG_SCHEMA_VERSION } from "@netgrid/shared";
import type {
  ActionSemanticCandidate,
  BuildActionSemanticCandidatesParams,
} from "../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../actions/action-card-semantic-profiles";
import { isBasicCreditAction } from "../actions/action-effect-classification";
import type { DeckCapabilityProfile } from "../deck-capabilities";
import type { RunnerHandDevelopmentEvaluation } from "../runner-hand-development";
import type {
  RunnerEconomyPosture,
  RunnerRunTargetEvaluation,
} from "../runner-run-target-evaluation";
import type { RunnerStrategicIntentProfile } from "../runner-strategic-intent";
import { buildRemoteDoctrineProfile } from "../remote-doctrine-profile";
import type { RunnerTacticalGoal } from "../runner-tactical-goals";
import type {
  TacticalPlanBuildContext,
  TacticalPlanMemorySnapshot,
  TacticalPlanRuntimeResult,
} from "../tactical-plans";
import { buildCorpTacticalGoals } from "../decision/corp-tactical-goals";
import { buildSemanticDecisionFrame } from "../decision/semantic-decision-frame";
import type { TacticalGoalLike } from "../decision/semantic-decision-frame";
import { buildMergedTacticalGoals } from "../decision/tactical-goal-merge";
import { buildSemanticDecisionChainDetailSection } from "../diagnostics/semantic-decision-chain-debug";
import { rememberStrategicIntentState } from "../strategic-intent-memory";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";
import type { AiDecisionRuntimeOptions } from "./choose-ai-action";
import { assessDecisionOpportunity } from "./decision-opportunity";
import {
  buildSemanticCoverageFallbackDecisionChainDebug,
  buildSemanticDecisionChainDebug,
  selectSemanticRuntimeInitialChoice,
} from "./semantic-decision-chain";
import { replayStableCorpBasicEconomyNearTieChoiceOrUndefined } from "./corp-economy/corp-basic-economy-near-tie";
import type {
  SemanticRuntimeChoice,
  SemanticRuntimeCoverageSelectionDebug,
  SemanticRuntimeRunOnlyActionAdjustment,
  TacticalPlanMappedChoiceResult,
} from "./semantic-runtime-types";
import {
  clearRunnerRunPlanMemory,
  MissingRunnerRunPlanError,
  rememberRunnerRunPlanMemorySnapshot,
  requireActiveRunnerRunPlan,
} from "./runner-run-plan-memory";
import { runnerRunPlanSemanticChoice } from "./runner-run-plan-policy";
import { revalidateRunnerRunPlan } from "./runner-run-plan-revalidation";
import { createRunnerRunPlanForSelectedAction } from "./runner-run-plan-start";
import { runnerInevitableCorpDeckoutSemanticChoice } from "./runner-inevitable-corp-deckout-choice";
import { runnerOpponentMatchpointContestSemanticChoice } from "./runner-opponent-matchpoint-contest-choice";
import { sourceDefinitionIdForAction } from "./visible-card-lookup";
import { visibleSourceDefinitionsByInstanceId } from "./visible-source-definitions";
import {
  compareCreditDemandPriority,
  type CreditDemand,
} from "../plans/credit-demand";
import {
  compareActionDemandPriority,
  type ActionDemand,
} from "../plans/action-demand";
import type { ActionCapacityScoringContext } from "./action-capacity-score-components";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";

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
    creditDemands?: readonly CreditDemand[],
    actionCapacityContext?: ActionCapacityScoringContext,
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
  scorelineWindowAssessment?: (
    input: AiDecisionInput,
  ) => TacticalPlanBuildContext["corpScorelineWindowAssessment"];
  bestSemanticRuntimeChoice: (
    choices: readonly SemanticRuntimeChoice[],
  ) => SemanticRuntimeChoice | undefined;
  bestSemanticRuntimeChoiceForTacticalPlanOverride: (
    choices: readonly SemanticRuntimeChoice[],
    planRuntime: TacticalPlanRuntimeResult,
    input?: AiDecisionInput,
  ) => SemanticRuntimeChoice | undefined;
  tacticalPlanMappedChoice: (
    input: AiDecisionInput,
    choices: readonly SemanticRuntimeChoice[],
    selectedMapping: TacticalPlanRuntimeResult["selectedMapping"],
    bestPlanOverrideChoice: SemanticRuntimeChoice | undefined,
    planRuntime?: TacticalPlanRuntimeResult,
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
    context?: { runnerEconomyPosture?: RunnerEconomyPosture },
  ) => TacticalPlanMemorySnapshot | undefined;
  scrubEvidence: (evidence: string[]) => string[];
  semanticRuntimeDecisionDebug: (
    input: AiDecisionInput,
    selected: SemanticRuntimeChoice,
    rankedChoices: SemanticRuntimeChoice[],
    planRuntime: TacticalPlanRuntimeResult,
    actionSemanticCandidates: readonly ActionSemanticCandidate[],
    decisionChain: AiDecisionChainDebug,
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
    visibleSourceDefinitionsByInstanceId: visibleSourceDefinitionsByInstanceId(
      input.playerView,
    ),
    cardSemanticProfilesByDefinitionId:
      buildActionCardSemanticProfilesByDefinitionId(),
  });
  if (input.side === "runner" && !input.playerView.run) {
    clearRunnerRunPlanMemory(input);
  }
  const activeRunnerRunPlanRecoveryEvidence: string[] = [];
  const activeRunnerRunPlanSnapshot = (() => {
    try {
      return requireActiveRunnerRunPlan(input);
    } catch (error) {
      if (!(error instanceof MissingRunnerRunPlanError)) throw error;
      activeRunnerRunPlanRecoveryEvidence.push(
        "active_runner_run_plan_missing:true",
        "active_runner_run_plan_recovery:semantic_runtime_fallback",
      );
      return undefined;
    }
  })();
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
  const remoteDoctrine =
    input.side === "corp"
      ? buildRemoteDoctrineProfile({
          ...(inputMetadata.ownDeckStrategyProfile
            ? { strategyProfile: inputMetadata.ownDeckStrategyProfile }
            : {}),
          deckCapabilities,
          ...(strategicIntentState ? { strategicIntentState } : {}),
          plannerEffect: "plan_portfolio",
        })
      : undefined;
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
  const preliminaryChoices = dependencies.semanticRuntimeChoices(
    inputForSemanticChoices,
    actionSemanticCandidates,
  );
  const reactiveChoice =
    activeRunnerRunPlan !== undefined
      ? undefined
      : (preliminaryChoices.find(
          (candidate) =>
            !candidate.exclusion &&
            candidate.score > 0 &&
            dependencies.semanticRuntimeChoiceIsReactive(candidate),
        ) ??
        preliminaryChoices.find(
          (candidate) =>
            !candidate.exclusion &&
            dependencies.semanticRuntimeChoiceIsReactive(candidate),
        ));
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
  const corpScorelineWindowAssessment =
    input.side === "corp"
      ? dependencies.scorelineWindowAssessment?.(input)
      : undefined;
  const planRuntime = reactiveChoice
    ? emptyTacticalPlanRuntimeResult()
    : dependencies.evaluateTacticalPlans({
        input,
        ...(previousPlan ? { previousPlan } : {}),
        deckCapabilities,
        ...(strategicIntentState ? { strategicIntentState } : {}),
        ...(corpStrategicIntent ? { corpStrategicIntent } : {}),
        ...(remoteDoctrine ? { remoteDoctrine } : {}),
        tacticalGoals,
        ...(runnerStrategicIntent ? { runnerStrategicIntent } : {}),
        ...(runnerRunTargetEvaluations ? { runnerRunTargetEvaluations } : {}),
        ...(runnerEconomyPosture ? { runnerEconomyPosture } : {}),
        ...(runnerHandDevelopmentEvaluations
          ? { runnerHandDevelopmentEvaluations }
          : {}),
        ...(runnerTacticalGoals ? { runnerTacticalGoals } : {}),
        ...(corpScorelineWindowAssessment
          ? { corpScorelineWindowAssessment }
          : {}),
        candidates: actionSemanticCandidates,
      });
  const runtimeCreditDemands = creditDemandsForRuntimeScoring(planRuntime);
  const runtimeActionCapacityContext =
    actionCapacityScoringContextForRuntime(planRuntime);
  const choices =
    runtimeCreditDemands.length > 0 ||
    runtimeActionCapacityContext.actionDemands.length > 0 ||
    runtimeActionCapacityContext.planActionContributions.length > 0
      ? dependencies.semanticRuntimeChoices(
          inputForSemanticChoices,
          actionSemanticCandidates,
          runtimeCreditDemands,
          runtimeActionCapacityContext,
        )
      : preliminaryChoices;
  const runPlanChoice = activeRunnerRunPlan
    ? runnerRunPlanSemanticChoice({
        input,
        plan: activeRunnerRunPlan,
        choices,
      })
    : undefined;
  const rawBestChoice = dependencies.bestSemanticRuntimeChoice(choices);
  const bestChoice = replayStableCorpBasicEconomyNearTieChoiceOrUndefined(
    input,
    choices,
    rawBestChoice,
  );
  const bestPlanOverrideChoice =
    dependencies.bestSemanticRuntimeChoiceForTacticalPlanOverride(
      choices,
      planRuntime,
      input,
    );
  const mappedChoice = dependencies.tacticalPlanMappedChoice(
    input,
    choices,
    planRuntime.selectedMapping,
    bestPlanOverrideChoice,
    planRuntime,
  );
  const selfDamageImmediateWinChoice =
    dependencies.runnerSelfDamageImmediateWinSemanticChoice(input, choices);
  const inevitableCorpDeckoutChoice = runnerInevitableCorpDeckoutSemanticChoice(
    input,
    choices,
  );
  const opponentMatchpointContestChoice =
    runnerRunTargetEvaluations !== undefined
      ? runnerOpponentMatchpointContestSemanticChoice(
          input,
          choices,
          runnerRunTargetEvaluations,
        )
      : undefined;
  const initialSelection = selectSemanticRuntimeInitialChoice({
    ...(runPlanChoice ? { runPlanChoice } : {}),
    ...(inevitableCorpDeckoutChoice ? { inevitableCorpDeckoutChoice } : {}),
    ...(reactiveChoice ? { reactiveChoice } : {}),
    ...(selfDamageImmediateWinChoice ? { selfDamageImmediateWinChoice } : {}),
    ...(opponentMatchpointContestChoice
      ? { opponentMatchpointContestChoice }
      : {}),
    mappedChoice,
    ...(bestChoice ? { bestChoice } : {}),
  });
  if (!initialSelection) {
    return semanticCoverageFallbackDecision(
      input,
      actionSemanticCandidates,
      choices,
      dependencies,
    );
  }
  const initialChoice = initialSelection.choice;
  const effectivePlanRuntime =
    mappedChoice.outcome === "semantic_choice_selected"
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
  const selectedChoice = choice;
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
  const decisionChain = buildSemanticDecisionChainDebug({
    input,
    choices,
    ...(rawBestChoice ? { bestChoice: rawBestChoice } : {}),
    planRuntime,
    mappedChoice,
    initialSelection,
    runOnlyActionAdjustment: runOnlyActionAdjusted,
    ...(selectedChoices ? { selectedChoices } : {}),
  });
  const persistTacticalPlanMemory = options.persistTacticalPlanMemory !== false;
  const updatedPlanMemory = persistTacticalPlanMemory
    ? dependencies.rememberTacticalPlanRuntime(
        input,
        effectivePlanRuntime,
        runOnlyActionAdjusted.memoryAction ?? selectedChoice.action,
        runnerEconomyPosture ? { runnerEconomyPosture } : {},
      )
    : undefined;
  const newRunnerRunPlan =
    persistTacticalPlanMemory && input.side === "runner"
      ? createRunnerRunPlanForSelectedAction({
          input,
          selectedAction: selectedChoice.action,
          ...(runnerRunTargetEvaluations ? { runnerRunTargetEvaluations } : {}),
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
  const decisionOpportunity = assessDecisionOpportunity(
    input,
    selectedChoice.action,
  );
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
      ...decisionOpportunity.evidence,
      ...activeRunnerRunPlanRecoveryEvidence,
      ...(coverageSelectionDebug?.evidence ?? []),
      `semantic_runtime_default:true`,
      `semantic_runtime_scope:${selectedChoice.scopeId}`,
      `semantic_decision_selection_route:${decisionChain.initialSelection.route}`,
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
            ...(updatedRunnerRunPlanMemory.commitment
              ? [
                  ...updatedRunnerRunPlanMemory.commitment.evidence,
                  `runner_run_decision_fingerprint:${updatedRunnerRunPlanMemory.commitment.decisionFingerprint.value}`,
                ]
              : []),
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
    ]),
    decisionDebug: dependencies.semanticRuntimeDecisionDebug(
      input,
      selectedChoice,
      runOnlyActionAdjusted.rankedChoices,
      effectivePlanRuntime,
      actionSemanticCandidates,
      decisionChain,
    ),
    timeoutUsed: false,
    profileId: input.profileId,
    difficulty: input.difficulty,
    reason: selectedReasonCode,
  };
}

export function creditDemandsForRuntimeScoring(
  planRuntime: TacticalPlanRuntimeResult,
): CreditDemand[] {
  const portfolio = planRuntime.planPortfolio;
  const entries = portfolio
    ? [
        ...(portfolio.interrupt ? [portfolio.interrupt] : []),
        ...(portfolio.foreground ? [portfolio.foreground] : []),
        ...portfolio.backgrounds,
      ].filter(
        (entry) =>
          entry.lifecycle !== "suspended" &&
          entry.lifecycle !== "completed" &&
          entry.lifecycle !== "abandoned",
      )
    : [];
  const demands = new Map<string, CreditDemand>();
  for (const demand of entries.flatMap((entry) => entry.creditDemands ?? [])) {
    if (demand.gap > 0) demands.set(demand.demandId, demand);
  }
  for (const demand of planRuntime.selectedPlan?.creditDemands ?? []) {
    if (demand.gap > 0 && !demands.has(demand.demandId)) {
      demands.set(demand.demandId, demand);
    }
  }
  return [...demands.values()].sort(compareCreditDemandPriority);
}

export function actionCapacityScoringContextForRuntime(
  planRuntime: TacticalPlanRuntimeResult,
): ActionCapacityScoringContext {
  const portfolio = planRuntime.planPortfolio;
  const entries = portfolio
    ? [
        ...(portfolio.interrupt ? [portfolio.interrupt] : []),
        ...(portfolio.foreground ? [portfolio.foreground] : []),
        ...portfolio.backgrounds,
      ].filter(
        (entry) =>
          entry.lifecycle !== "suspended" &&
          entry.lifecycle !== "completed" &&
          entry.lifecycle !== "abandoned",
      )
    : [];
  const demands = new Map<string, ActionDemand>();
  for (const demand of entries.flatMap((entry) => entry.actionDemands ?? [])) {
    if (demand.gap > 0) demands.set(demand.demandId, demand);
  }
  for (const demand of planRuntime.selectedPlan?.actionDemands ?? []) {
    if (demand.gap > 0 && !demands.has(demand.demandId))
      demands.set(demand.demandId, demand);
  }
  return {
    actionDemands: [...demands.values()].sort(compareActionDemandPriority),
    planActionContributions: planRuntime.planActionContributionScores ?? [],
  };
}

export class SemanticCoverageFallbackError extends PlanResolutionFailure {
  constructor(
    readonly side: AiDecisionInput["side"],
    readonly legalActionTypes: readonly string[],
    stateVersion = 0,
    timingPoint = "unknown",
  ) {
    super("missing_plan_module_coverage", {
      side,
      stateVersion,
      timingPoint,
      legalActionTypes,
      owner: "plan_registry",
      removalCondition:
        "Add a plan module or explicit window resolver for the uncovered action family.",
    });
    this.name = "SemanticCoverageFallbackError";
    this.message = `Semantic coverage has no fail-closed fallback for ${side}: ${legalActionTypes.join(",") || "no_legal_actions"}`;
  }
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
  return [...(runnerTacticalGoals ?? []), ...(corpTacticalGoals ?? [])];
}

function semanticCoverageFallbackDecision(
  input: AiDecisionInput,
  actionSemanticCandidates: readonly ActionSemanticCandidate[],
  choices: readonly SemanticRuntimeChoice[],
  dependencies: SemanticRuntimeDependencies,
): AiDecision {
  const rankedFallbackActions = input.legalActions
    .filter(
      (action) =>
        failClosedFallbackPolicyForAction(input, action) !== undefined,
    )
    .sort(
      (left, right) =>
        fallbackPolicyRank(input, left) - fallbackPolicyRank(input, right) ||
        left.actionId.localeCompare(right.actionId),
    );
  const action = rankedFallbackActions[0];
  if (!action) {
    if (
      input.playerView.own.clicks > 0 &&
      input.legalActions.length > 0 &&
      input.legalActions.every((candidate) => candidate.type === "end_turn")
    ) {
      throw new PlanResolutionFailure("end_turn_with_usable_capacity", {
        side: input.side,
        stateVersion: input.playerView.stateVersion,
        timingPoint: input.playerView.timingPoint,
        legalActionTypes: ["end_turn"],
        owner: "rules_contract",
        removalCondition:
          "Resolve a plan-compatible action or remove the illegal remaining-capacity EndTurn action at the engine boundary.",
        candidateCount: actionSemanticCandidates.length,
      });
    }
    throw new SemanticCoverageFallbackError(
      input.side,
      [
        ...new Set(input.legalActions.map((candidate) => candidate.type)),
      ].sort(),
      input.playerView.stateVersion,
      input.playerView.timingPoint,
    );
  }
  const policy = failClosedFallbackPolicyForAction(input, action);
  if (!policy) {
    throw new SemanticCoverageFallbackError(
      input.side,
      [action.type],
      input.playerView.stateVersion,
      input.playerView.timingPoint,
    );
  }
  const decisionOpportunity = assessDecisionOpportunity(input, action);
  const evidence = dependencies.scrubEvidence([
    "semantic_coverage_fallback:true",
    "fallback_reason:no_semantic_candidate",
    `fallback_action_policy:${policy}`,
    `fallback_candidate_count:${actionSemanticCandidates.length}`,
    `fallback_choice_count:${choices.length}`,
    "semantic_decision_selection_route:semantic_coverage_fallback",
    ...decisionOpportunity.evidence,
    ...(action
      ? [
          `fallback_action_type:${action.type}`,
          `fallback_action_id:${action.actionId}`,
        ]
      : ["fallback_action:none"]),
  ]);
  const selectedChoices = dependencies.selectedChoicesForDecision(
    input,
    action,
  );
  if ((action.choiceRequirements?.length ?? 0) > 0 && !selectedChoices) {
    throw new SemanticCoverageFallbackError(
      input.side,
      [action.type],
      input.playerView.stateVersion,
      input.playerView.timingPoint,
    );
  }
  const decisionChain = buildSemanticCoverageFallbackDecisionChainDebug({
    input,
    choices,
    actionId: action.actionId,
    ...(selectedChoices ? { selectedChoices } : {}),
  });
  const reasonCode = `${input.side}.semantic.coverage_fallback.${policy}`;
  return {
    actionId: action.actionId,
    ...(selectedChoices ? { selectedChoices } : {}),
    reasonCode,
    explanation:
      "Semantic Runtime nutzte einen deterministischen Safety-Fallback auf vorhandenen LegalActions.",
    consideredActionIds: input.legalActions.map(
      (candidate) => candidate.actionId,
    ),
    fallbackUsed: true,
    evidence,
    decisionDebug: semanticCoverageFallbackDebug(
      input,
      action,
      evidence,
      decisionChain,
    ),
    timeoutUsed: false,
    profileId: input.profileId,
    difficulty: input.difficulty,
    reason: reasonCode,
  };
}

function fallbackPolicyRank(
  input: AiDecisionInput,
  action: LegalAction,
): number {
  switch (failClosedFallbackPolicyForAction(input, action)) {
    case "mandatory_choice":
      return 0;
    case "mandatory_resolution":
      return 0;
    case "direct_closeout":
      return 1;
    case "tag_clear":
      return 2;
    case "required_run_continue":
      return 3;
    case "required_run_start":
      return 3;
    case "access_resolution":
      return 4;
    case "window_decline":
      return 4;
    case "economy_basic":
      return 5;
    case "draw_setup":
      return 6;
    case "end_turn":
      return 7;
    case undefined:
      return Number.POSITIVE_INFINITY;
  }
}

function failClosedFallbackPolicyForAction(
  input: AiDecisionInput,
  action: LegalAction,
):
  | "mandatory_choice"
  | "mandatory_resolution"
  | "direct_closeout"
  | "tag_clear"
  | "required_run_continue"
  | "required_run_start"
  | "access_resolution"
  | "window_decline"
  | "economy_basic"
  | "draw_setup"
  | "end_turn"
  | undefined {
  if (action.type === "resolve_choice") return "mandatory_choice";
  if (action.type === "mandatory_draw") return "mandatory_resolution";
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
  if (
    action.type === "start_run" &&
    input.side === "runner" &&
    input.legalActions.length === 1
  ) {
    return "required_run_start";
  }
  if (action.type === "access_card" || action.type === "trash_accessed_card") {
    return "access_resolution";
  }
  if (isBasicCreditAction(action)) {
    return "economy_basic";
  }
  if (
    action.type === "draw_card" &&
    action.source === "basic_action"
  ) {
    return "draw_setup";
  }
  if (
    action.type === "jack_out" ||
    action.type === "decline_trash" ||
    action.type === "decline_rez"
  ) {
    return "window_decline";
  }
  if (
    action.type === "end_turn" &&
    input.playerView.own.clicks <= 0
  ) {
    return "end_turn";
  }
  return undefined;
}

function semanticCoverageFallbackDebug(
  input: AiDecisionInput,
  action: LegalAction | undefined,
  evidence: readonly string[],
  decisionChain: AiDecisionChainDebug,
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
    detailSections: [buildSemanticDecisionChainDetailSection(decisionChain)],
    decisionChain,
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

function emptyTacticalPlanRuntimeResult(): TacticalPlanRuntimeResult {
  return {
    planAlternatives: [],
    blockedPlans: [],
  };
}
