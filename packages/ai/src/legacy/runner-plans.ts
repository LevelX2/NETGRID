import runnerPlanProfilesData from "../../../../data/ai/runner-plan-profiles-1.4.1.json";
import {
  AI_DECISION_DEBUG_SCHEMA_VERSION,
  DEMO_CARDS_BY_ID,
  type AiDeckDoctrineProfile,
  type AiDecision,
  type AiDecisionActionAlternative,
  type AiDecisionDebug,
  type AiDecisionInput,
  type AiDecisionRankedAlternative,
  type AiDecisionScoreComponent,
  type AiDifficulty,
  type LegalAction,
  type PublicGameEvent,
  type Side,
  type VisibleCard,
} from "@netgrid/shared";
import {
  CARD_ROLES_BY_CARD,
  RUNTIME_CARDS,
  createAiHintsByCard,
} from "../ai-hints";
import {
  beliefDebugSummary,
  reconstructBeliefState,
  type BeliefState,
  type KnownHqHandMemory,
  type RndTopFreshnessMemory,
} from "../belief-state";
import { evaluateKnownRemoteAccessPayoff } from "../known-remote-access-payoff";
import {
  assessKnownRezzedIcePath,
  canBreakerDefinitionBreakIce,
  iceHasEndTheRun,
  serverIdFromEvent,
  type KnownRezzedIcePathAssessment,
} from "../visible-run-analysis";
import {
  breakerCardBlocksAccessReachability,
  estimateBreakerCostProfileFromOntology,
  estimateStructuredBreakerCostForIce,
  getStructuredBreakerProfileForCard,
  structuredBreakerProfileCoversIce,
} from "../breaker-ontology-consumer";

const BBS_WHISPERING_CAMPAIGN_DEFINITION_ID =
  "onr_v1_309_bbs-whispering-campaign";

export type RunnerPlanKind =
  | "pressure_rnd"
  | "pressure_hq"
  | "contest_remote"
  | "build_rig"
  | "recover_economy"
  | "draw_for_answers"
  | "trash_asset"
  | "safe_probe_run";

export type RunnerPlanStep = {
  stepId: string;
  actionId: string;
  actionType: LegalAction["type"];
  targetServerId?: string;
  roleTags: string[];
};

export type RunnerPlanCandidate = {
  planId: string;
  kind: RunnerPlanKind;
  legalActionIds: string[];
  steps: RunnerPlanStep[];
  visibleBenefits: string[];
  visibleRisks: string[];
  uncertainty: string[];
  requiredRoles: string[];
};

export type RunnerPlanScore = {
  planId: string;
  score: number;
  confidence: number;
  reasons: string[];
  evidence: string[];
  scoreBreakdown: AiDecisionScoreComponent[];
};

export type RunnerPlanDebug = AiDecisionDebug & {
  aiLevel: 2;
  schemaVersion: typeof AI_DECISION_DEBUG_SCHEMA_VERSION;
  planId: string;
  planKind: RunnerPlanKind | "fallback";
  selectedActionType: LegalAction["type"] | "none";
  score: number;
  confidence: number;
  visibleReasons: string[];
  uncertainty: string[];
  evidence: string[];
  fallbackUsed: boolean;
  seed: string;
  profileId: string;
  timeBudgetMs: number;
  timeoutUsed: boolean;
  memoryVersion?: string;
  facts?: string[];
  hypotheses?: string[];
  invalidations?: string[];
  beliefUncertainty?: string[];
  opponentModel?: Record<string, unknown>;
  ownDeckDoctrine?: {
    schemaVersion: string;
    side: Side;
    confidence: number;
    archetypeTags: string[];
    riskFlags: string[];
  };
  doctrinePlanWeight?: number;
};

export type RunnerPlanDecision = {
  selectedPlanId: string;
  selectedActionId: string;
  selectedActionType: LegalAction["type"] | "none";
  fallbackUsed: boolean;
  score: RunnerPlanScore;
  debug: RunnerPlanDebug;
};

export type RunnerPlanEvaluatorResult = {
  score: number;
  reasons: string[];
  evidence: string[];
};

type RunnerPlanProfile = {
  profileId: string;
  legacyProfileIds: string[];
  side: "runner";
  difficulty: AiDifficulty;
  timeBudgetMs: number;
  planBreadth: number;
  riskTolerance: number;
  weights: Record<
    | "runnerRig"
    | "runCost"
    | "serverAccessValue"
    | "remoteThreat"
    | "corpScoringThreat",
    number
  >;
};

type RunnerFeatures = {
  credits: number;
  clicks: number;
  tags: number;
  citySurveillanceSourceCount: number;
  memoryRemaining: number;
  handCount: number;
  rigRoles: Set<string>;
  handRoles: Set<string>;
  serverFeatures: Map<
    string,
    {
      iceCount: number;
      rootCount: number;
      knownRootCount: number;
      rezzedIceCount: number;
      advancedRootCount: number;
    }
  >;
  blockedRunServers: Set<string>;
  visibleRunBreakCosts: Map<string, number>;
  visibleRunFullPathAssessments: Map<string, KnownRezzedIcePathAssessment>;
};
type RunnerServerFeatures =
  RunnerFeatures["serverFeatures"] extends Map<string, infer Server>
    ? Server
    : never;
type VisibleBreakerPressure = {
  blockedServerIds: Set<string>;
  knownIceBlockedServerIds: Set<string>;
  missingIceDefinitionIds: Set<string>;
  missingBreakerRoles: Set<string>;
  matchingGripBreakerCount: number;
  ontologyMatchingGripBreakerCount: number;
  matchingInstallActionIds: Set<string>;
  searchActionIds: Set<string>;
  recoveryActionIds: Set<string>;
  heapMatchingBreakerCount: number;
  ontologyHeapMatchingBreakerCount: number;
  deckAnswerCount: number;
  missingAnswerCount: number;
  requiredCoverageCredits: number;
};
type RunnerTwoTurnRunIntent = {
  targetServerId: string;
  thresholdCredits: number;
  visibleBreakCost: number;
  creditsNeeded: number;
  ready: boolean;
  stateKey: string;
};

type RunnerPressureReadyTarget = {
  targetServerId: string;
  targetType: "hq" | "rnd" | "archives" | "remote";
  planKind: RunnerPlanKind;
  visibleBreakCost: number;
  creditsAfterPath: number;
  reason: string;
  priority: number;
};

type RunnerPressureReadyBlocker =
  | "insufficient_credits"
  | "missing_post_run_reserve"
  | "stale_central"
  | "remote_too_dangerous"
  | "no_valuable_target";

type RunnerPressureReadyAssessment = {
  broadReady: boolean;
  readyTargets: RunnerPressureReadyTarget[];
  falsePositive: boolean;
  blockers: Set<RunnerPressureReadyBlocker>;
};

type CitySurveillanceDrawProjection = {
  sourceCount: number;
  creditsPaid: number;
  tagsAdded: number;
  decision: "pay" | "tag" | "none";
};

type InstalledEconomyActionKind =
  | "direct_payout"
  | "pool_build"
  | "pool_payout"
  | "side_economy";

type InstalledEconomyActionAssessment = {
  kind: InstalledEconomyActionKind;
  immediateGain: number;
  netCredits: number;
  storedCredits: number;
  futurePoolAfter: number;
  ability: string;
};

type ShellTradersActionKind = "prepare" | "remove_counter";

type ShellTradersActionAssessment = {
  kind: ShellTradersActionKind;
  shellCounters: number;
  targetDefinitionId?: string;
  targetRoles: string[];
  immediateInstall: boolean;
  sourceVisible: boolean;
  directInstallAvailable: boolean;
  directInstallRemainingCredits?: number;
  directInstallUrgency: number;
};

type ShellTradersBacklog = {
  preparedCount: number;
  nearInstallCount: number;
  totalShellCounters: number;
};

type RunnerHandUseOpportunity = {
  playableEconomyActionCount: number;
  installableBreakerActionCount: number;
  runnablePressureActionCount: number;
  remoteTrashActionCount: number;
  drawDiscardPressure: boolean;
  lowValueDuplicateInstallCount: number;
};

type RunnerRemoteContestOpportunity = {
  advancedRemoteTargetCount: number;
  contestableAdvancedRemoteTargetCount: number;
  relevantTrashRemoteTargetCount: number;
  selectedTargetAdvanced: boolean;
  selectedTargetContestable: boolean;
  selectedTargetPostRunReserveSufficient: boolean;
  selectedTargetPostRunReserve: number;
  selectedTargetRelevantTrash: boolean;
  centralRunWhileRemoteThreat: boolean;
  centralRunWhileContestableThreat: boolean;
  centralRunJustified: boolean;
  centralRunBurnsContestReserve: boolean;
};

type RunnerRemoteContestProfile = {
  serverId: string;
  advanced: boolean;
  relevantTrash: boolean;
  blockedByBreakerCoverage: boolean;
  blockedByKnownIceCost: boolean;
  blockedByPostRunReserve: boolean;
  visibleBreakCost: number;
  creditsAfterPath: number;
  postRunReserveTarget: number;
  contestable: boolean;
};

type RunnerCentralPressureOpportunity = {
  targetServerId?: "hq" | "rd" | "archives";
  pathBlocked: boolean;
  pathBlockedByUnbreakableIce: boolean;
  pathBlockedByMissingCoverage: boolean;
  pathBlockedByKnownEtr: boolean;
  accessReachable: boolean;
  visibleBreakCost: number;
  creditsAfterPath: number;
  reserveTarget: number;
  preservesReserve: boolean;
  openOrCheap: boolean;
  matchingInterfaceInstalled: boolean;
  anyInterfaceInstalled: boolean;
  multiaccessInstalled: boolean;
  matchingPressureInstallActions: number;
  matchingRunEvents: number;
  runEventHasGoodTarget: boolean;
  repeatedLowValue: boolean;
  repeatedFreshValue: boolean;
  closeoutOpportunity: boolean;
  closeoutReasons: string[];
  centralPressureClear: boolean;
  remoteContestableThreat: boolean;
  remoteThreatLessValuable: boolean;
};

type RunnerNoFreshCentralSubstitutionContext = {
  staleTargets: Array<"hq" | "rd" | "archives">;
  betterAlternatives: Set<
    | "economy"
    | "rig_unlock"
    | "remote_contest"
    | "pressure_install"
    | "setup_search"
  >;
  allowedReasons: Set<
    | "closeout"
    | "interface"
    | "multiaccess"
    | "remote_uncontestable"
    | "central_open"
    | "no_better_action"
  >;
};

type RunnerPlanContinuationIntent = {
  planKind: RunnerPlanKind;
  targetServerId?: string | undefined;
  ownStrategicDecisionCount: number;
  samePlanRepeatsWithoutProgress: number;
  converted: boolean;
  expired: boolean;
  abortReasons: string[];
  evidence: string[];
};

type RunnerOutcomeKind =
  | "central_no_value"
  | "central_fresh_value"
  | "remote_empty_or_low_value"
  | "remote_value"
  | "jack_out_blocked"
  | "economy_or_rig_ready";

type RunnerOutcomeFollowup = {
  kind: RunnerOutcomeKind;
  targetServerId?: string | undefined;
  sourceVersion: number;
  ownStrategicDecisionCount: number;
  stale: boolean;
  evidence: string[];
};

export type RunnerStrategicLineKind =
  | "early_hq_pressure"
  | "early_rnd_pressure"
  | "remote_contest"
  | "economy_first"
  | "rig_first"
  | "breaker_search_first"
  | "interface_pressure"
  | "closeout_pressure";

type RunnerStrategicLineCandidate = {
  kind: RunnerStrategicLineKind;
  weight: number;
  reasons: string[];
};

type RunnerStrategicLineSelection = {
  kind: RunnerStrategicLineKind;
  weight: number;
  selectedBySeed: boolean;
  candidateWeights: RunnerStrategicLineCandidate[];
  commitmentTtl: number;
  commitmentBucket: number;
  reason: string;
  visibleEvidence: string[];
};

type BrokerPoolBuildHorizon = {
  score: number;
  priority: number;
  reason: string;
  immediateCreditNeed: boolean;
  visibleThreshold: boolean;
  clicksRemaining: number;
};

const AI_HINTS = createAiHintsByCard();
const RUNNER_PLAN_PROFILES =
  runnerPlanProfilesData.profiles as RunnerPlanProfile[];
const PLAN_ACTION_TYPES = new Set<LegalAction["type"]>([
  "start_run",
  "jack_out",
  "continue_run",
  "install_card",
  "play_event",
  "trigger_ability",
  "activated_card_ability",
  "gain_credit",
  "draw_card",
  "trash_accessed_card",
]);

function runnerRunActionIsKnownNoAccess(
  input: AiDecisionInput,
  action: LegalAction,
  features: RunnerFeatures,
): boolean {
  if (
    action.type !== "start_run" ||
    typeof action.payload?.serverId !== "string"
  )
    return false;
  const assessment = features.visibleRunFullPathAssessments.get(
    action.payload.serverId,
  );
  if (!assessment || assessment.canReachAccess) return false;
  if (assessment.assessedKnownIceCount <= 0) return false;
  if (!runnerKnownPathAssessmentIsKnownNoAccess(assessment)) return false;
  if (runnerKnownPathAssessmentIsUnbreakableNoAccess(assessment))
    return action.payload?.bypass !== true;
  return !runnerRunActionHasExplicitProbeValue(input, action);
}

function runnerKnownPathAssessmentIsCostNoAccess(
  assessment: KnownRezzedIcePathAssessment,
): boolean {
  return (
    assessment.unpayableReason === "ice_unaffordable" ||
    assessment.unpayableReason === "later_ice_unaffordable_after_prior_ice_cost"
  );
}

function runnerKnownPathAssessmentIsUnbreakableNoAccess(
  assessment: KnownRezzedIcePathAssessment,
): boolean {
  return (
    assessment.unpayableReason === "ice_unbreakable" ||
    assessment.knownPathBlockedByUnbreakableIce === true ||
    assessment.knownPathBlockedByMissingCoverage === true
  );
}

function runnerKnownPathAssessmentIsKnownNoAccess(
  assessment: KnownRezzedIcePathAssessment,
): boolean {
  return (
    runnerKnownPathAssessmentIsCostNoAccess(assessment) ||
    runnerKnownPathAssessmentIsUnbreakableNoAccess(assessment)
  );
}

function runnerRunActionHasExplicitProbeValue(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  return (
    action.payload?.bypass === true ||
    rolesForAction(input, action).some(
      (role) =>
        role.includes("bypass") ||
        role.includes("probe") ||
        role.includes("expose") ||
        role.includes("inside_job"),
    )
  );
}

export function hasRunnerPlanAction(input: AiDecisionInput): boolean {
  return (
    input.side === "runner" &&
    input.legalActions.some(
      (action) =>
        PLAN_ACTION_TYPES.has(action.type) &&
        ((action.type !== "trigger_ability" &&
          action.type !== "activated_card_ability") ||
          Boolean(classifyInstalledEconomyAction(input, action)) ||
          Boolean(classifyShellTradersAction(input, action))),
    )
  );
}

// Legacy fallback planner: Semantic Runtime is the default decision layer.
// Keep this path for force-legacy/no-candidate fallback and regression fixtures.
export function chooseRunnerPlanAction(
  input: AiDecisionInput,
  fallbackDecision: AiDecision,
  options: { timeBudgetMs?: number } = {},
): AiDecision {
  const planDecision = chooseRunnerPlanDecision(input, options);
  if (planDecision.fallbackUsed || !planDecision.selectedActionId) {
    return {
      ...fallbackDecision,
      decisionDebug: planDecision.debug,
      timeoutUsed:
        planDecision.debug.timeoutUsed || Boolean(fallbackDecision.timeoutUsed),
    };
  }
  const action = input.legalActions.find(
    (candidate) => candidate.actionId === planDecision.selectedActionId,
  );
  if (!action) {
    return {
      ...fallbackDecision,
      decisionDebug: fallbackDebug(
        input,
        fallbackDecision,
        "no_legal_selected_action",
        options.timeBudgetMs,
      ),
      timeoutUsed: Boolean(fallbackDecision.timeoutUsed),
    };
  }
  return {
    actionId: action.actionId,
    reasonCode: `runner.plan.${planDecision.debug.planKind}`,
    explanation: explanationForPlan(planDecision.debug.planKind),
    consideredActionIds: input.legalActions
      .map((candidate) => candidate.actionId)
      .sort(),
    fallbackUsed: false,
    confidence: planDecision.score.confidence,
    evidence: scrubPlanEvidence(planDecision.score.evidence),
    decisionDebug: planDecision.debug,
    timeoutUsed: planDecision.debug.timeoutUsed,
    profileId: input.profileId,
    difficulty: input.difficulty,
    reason: `runner.plan.${planDecision.debug.planKind}`,
  };
}

export function chooseRunnerPlanDecision(
  input: AiDecisionInput,
  options: { timeBudgetMs?: number } = {},
): RunnerPlanDecision {
  const profile = runnerPlanProfile(input);
  const beliefState = reconstructBeliefState(input);
  const timeBudgetMs = options.timeBudgetMs ?? profile.timeBudgetMs;
  if (timeBudgetMs <= 0)
    return fallbackPlanDecision(
      input,
      "time_budget_exhausted",
      timeBudgetMs,
      true,
      beliefState,
    );
  const candidates = generateRunnerPlanCandidates(input).slice(
    0,
    profile.planBreadth,
  );
  if (candidates.length === 0)
    return fallbackPlanDecision(
      input,
      "no_plan_candidate",
      timeBudgetMs,
      false,
      beliefState,
    );
  const scored = candidates
    .map((candidate) => ({
      candidate,
      score: evaluateRunnerPlan(input, candidate, beliefState),
    }))
    .sort(
      (left, right) =>
        right.score.score - left.score.score ||
        left.candidate.planId.localeCompare(right.candidate.planId),
    );
  const selected = scored[0];
  if (!selected)
    return fallbackPlanDecision(
      input,
      "no_scored_plan",
      timeBudgetMs,
      false,
      beliefState,
    );
  const action = selectPlanAction(input, selected.candidate);
  if (!action)
    return fallbackPlanDecision(
      input,
      "plan_without_legal_action",
      timeBudgetMs,
      false,
      beliefState,
    );
  const beliefSummary = beliefDebugSummary(beliefState);
  const opponentModel = toRecord(beliefSummary.runnerOpponentModel);
  const doctrinePlanWeight = doctrinePlanWeightFor(
    input,
    selected.candidate.kind,
  );
  return {
    selectedPlanId: selected.candidate.planId,
    selectedActionId: action.actionId,
    selectedActionType: action.type,
    fallbackUsed: false,
    score: selected.score,
    debug: {
      schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
      aiLevel: 2,
      summary: explanationForPlan(selected.candidate.kind),
      planId: selected.candidate.planId,
      planKind: selected.candidate.kind,
      selectedActionType: action.type,
      score: selected.score.score,
      confidence: selected.score.confidence,
      visibleReasons: selected.score.reasons,
      rankedAlternatives: rankedRunnerAlternatives(
        input,
        scored,
        selected.candidate.planId,
      ),
      actionAlternatives: runnerActionAlternativesForPlan(
        input,
        selected.candidate,
        action.actionId,
      ),
      scoreBreakdown: selected.score.scoreBreakdown,
      whyNot: [],
      longTermPlan: longTermPlanForRunner(input, selected.candidate.kind),
      warnings: selected.candidate.visibleRisks.slice(0, 4),
      detailSections: runnerDetailSections(selected.candidate, selected.score),
      uncertainty: selected.candidate.uncertainty,
      evidence: scrubPlanEvidence(selected.score.evidence),
      fallbackUsed: false,
      seed: input.seed,
      profileId: profile.profileId,
      timeBudgetMs,
      timeoutUsed: false,
      memoryVersion: String(beliefSummary.memoryVersion ?? ""),
      facts: toStringArray(beliefSummary.facts),
      hypotheses: toStringArray(beliefSummary.hypotheses),
      invalidations: toStringArray(beliefSummary.invalidations),
      beliefUncertainty: toStringArray(beliefSummary.uncertainty),
      ...(opponentModel ? { opponentModel } : {}),
      ...(input.ownDeckDoctrine
        ? {
            ownDeckDoctrine: deckDoctrineDebug(input.ownDeckDoctrine),
            doctrinePlanWeight,
          }
        : {}),
    },
  };
}

export function generateRunnerPlanCandidates(
  input: AiDecisionInput,
): RunnerPlanCandidate[] {
  if (input.side !== "runner") return [];
  const features = extractRunnerFeatures(input);
  const breakerPressure = assessVisibleBreakerPressure(input);
  const hasCoverageSearchNeed = breakerPressure.missingBreakerRoles.size > 0;
  const actions = input.legalActions.slice().sort(compareAction);
  return [
    buildCandidate(
      input,
      "pressure_rnd",
      actions.filter(
        (action) =>
          action.type === "start_run" && action.payload?.serverId === "rd",
      ),
    ),
    buildCandidate(
      input,
      "pressure_hq",
      actions.filter(
        (action) =>
          action.type === "start_run" && action.payload?.serverId === "hq",
      ),
    ),
    buildCandidate(
      input,
      "contest_remote",
      actions.filter(
        (action) =>
          action.type === "start_run" &&
          typeof action.payload?.serverId === "string" &&
          action.payload.serverId.startsWith("remote_") &&
          (features.serverFeatures.get(action.payload.serverId)?.rootCount ??
            0) > 0,
      ),
    ),
    buildCandidate(
      input,
      "build_rig",
      actions.filter(
        (action) =>
          (action.type === "install_card" &&
            (rolesForAction(input, action).some(
              (role) =>
                role.startsWith("breaker_") ||
                role === "memory" ||
                role === "setup" ||
                role === "build_rig" ||
                isRunnerPressureRole(role),
            ) ||
              isStructuredBreakerInstallAction(input, action))) ||
          (hasCoverageSearchNeed &&
            runnerCoverageSearchAction(input, action)) ||
          Boolean(classifyShellTradersAction(input, action)),
      ),
    ),
    buildCandidate(
      input,
      "recover_economy",
      actions.filter(
        (action) =>
          action.type === "gain_credit" ||
          (action.type === "play_event" &&
            rolesForAction(input, action).some(
              (role) => role === "economy" || role === "tempo",
            )) ||
          Boolean(classifyInstalledEconomyAction(input, action)),
      ),
    ),
    buildCandidate(
      input,
      "draw_for_answers",
      actions.filter(
        (action) =>
          action.type === "draw_card" ||
          (hasCoverageSearchNeed &&
            runnerCoverageSearchAction(input, action)) ||
          (action.type === "play_event" &&
            rolesForAction(input, action).some(
              (role) => role === "draw" || role === "setup",
            )),
      ),
    ),
    buildCandidate(
      input,
      "trash_asset",
      actions.filter((action) => action.type === "trash_accessed_card"),
    ),
    buildCandidate(
      input,
      "safe_probe_run",
      actions.filter(
        (action) =>
          action.type === "jack_out" ||
          action.type === "continue_run" ||
          (action.type === "play_event" &&
            rolesForAction(input, action).some(isRunnerPressureRole)) ||
          (action.type === "start_run" &&
            (action.payload?.serverId === "archives" ||
              isLowInformationRunTarget(
                features,
                String(action.payload?.serverId ?? ""),
              ))),
      ),
    ),
  ].filter((candidate): candidate is RunnerPlanCandidate => candidate !== null);
}

export function evaluateRunnerPlan(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
  beliefState: BeliefState = reconstructBeliefState(input),
): RunnerPlanScore {
  const profile = runnerPlanProfile(input);
  const rig = evaluateRunnerRig(input, candidate);
  const runCost = estimateRunCost(input, candidate);
  const access = evaluateServerAccessValue(input, candidate, beliefState);
  const remote = evaluateRemoteThreat(input, candidate, beliefState);
  const corpThreat = evaluateCorpScoringThreat(input, candidate, beliefState);
  const earlyTurn = evaluateRunnerEarlyTurnDoctrine(input, candidate);
  const breakerPlan = evaluateVisibleBreakerPlan(input, candidate);
  const twoTurnIntent = evaluateRunnerTwoTurnRunIntent(input, candidate);
  const citySurveillanceDrawRisk = evaluateCitySurveillanceDrawRisk(
    input,
    candidate,
  );
  const installedEconomy = evaluateInstalledEconomyActions(input, candidate);
  const shellTraders = evaluateShellTradersActions(input, candidate);
  const handUse = evaluateRunnerHandUseDiscipline(input, candidate);
  const duplicateInstall = evaluateRunnerDuplicateInstallDiscipline(
    input,
    candidate,
  );
  const remoteContest = evaluateRunnerRemoteContestAndTrashDiscipline(
    input,
    candidate,
  );
  const centralPressure = evaluateRunnerCentralPressureDiscipline(
    input,
    candidate,
    beliefState,
  );
  const noFreshCentralSubstitution = evaluateRunnerNoFreshCentralSubstitution(
    input,
    candidate,
    beliefState,
  );
  const phaseExitPressure = evaluateRunnerPhaseExitPressure(
    input,
    candidate,
    beliefState,
  );
  const strategicLine = evaluateRunnerStrategicLine(
    input,
    candidate,
    beliefState,
  );
  const planContinuation = evaluateRunnerPlanContinuationAbort(
    input,
    candidate,
    beliefState,
  );
  const outcomeFollowup = evaluateRunnerOutcomeFollowup(
    input,
    candidate,
    beliefState,
  );
  const economyReserve = evaluateRunnerEconomyReserveDiscipline(
    input,
    candidate,
  );
  const doctrinePlanWeight = doctrinePlanWeightFor(input, candidate.kind);
  const easyRunPenalty =
    input.difficulty === "easy" && isRunPlan(candidate.kind) ? 260 : 0;
  const score =
    baseScoreForPlan(candidate.kind) +
    doctrinePlanWeight +
    earlyTurn.score +
    rig.score * profile.weights.runnerRig +
    runCost.score * profile.weights.runCost +
    access.score * profile.weights.serverAccessValue +
    remote.score * profile.weights.remoteThreat +
    corpThreat.score * profile.weights.corpScoringThreat +
    breakerPlan.score +
    twoTurnIntent.score +
    citySurveillanceDrawRisk.score +
    installedEconomy.score +
    shellTraders.score +
    handUse.score +
    duplicateInstall.score +
    remoteContest.score +
    centralPressure.score +
    noFreshCentralSubstitution.score +
    phaseExitPressure.score +
    strategicLine.score +
    planContinuation.score +
    outcomeFollowup.score +
    economyReserve.score -
    visibleRiskPenalty(candidate, profile.riskTolerance) -
    easyRunPenalty;
  return {
    planId: candidate.planId,
    score: roundScore(score),
    confidence: confidence(score, candidate.legalActionIds.length),
    reasons: sortedUnique([
      ...earlyTurn.reasons,
      ...rig.reasons,
      ...runCost.reasons,
      ...access.reasons,
      ...remote.reasons,
      ...corpThreat.reasons,
      ...breakerPlan.reasons,
      ...twoTurnIntent.reasons,
      ...citySurveillanceDrawRisk.reasons,
      ...installedEconomy.reasons,
      ...shellTraders.reasons,
      ...handUse.reasons,
      ...duplicateInstall.reasons,
      ...remoteContest.reasons,
      ...centralPressure.reasons,
      ...noFreshCentralSubstitution.reasons,
      ...phaseExitPressure.reasons,
      ...strategicLine.reasons,
      ...planContinuation.reasons,
      ...outcomeFollowup.reasons,
      ...economyReserve.reasons,
    ]).slice(0, 6),
    scoreBreakdown: scoreComponents([
      [
        "base",
        "Grundplan",
        baseScoreForPlan(candidate.kind),
        1,
        `plan:${candidate.kind}`,
      ],
      [
        "doctrine",
        "Deck-Doctrine",
        doctrinePlanWeight,
        1,
        "doctrine_plan_weight",
      ],
      [
        "earlyTurn",
        "Frühe Zugphase",
        earlyTurn.score,
        1,
        firstReason(earlyTurn.reasons),
      ],
      [
        "runnerRig",
        "Runner-Rig",
        rig.score * profile.weights.runnerRig,
        profile.weights.runnerRig,
        firstReason(rig.reasons),
      ],
      [
        "outcomeFollowup",
        "Outcome-Follow-up",
        outcomeFollowup.score,
        1,
        firstReason(outcomeFollowup.reasons),
      ],
      [
        "runCost",
        "Run-Kosten",
        runCost.score * profile.weights.runCost,
        profile.weights.runCost,
        firstReason(runCost.reasons),
      ],
      [
        "serverAccessValue",
        "Serverwert",
        access.score * profile.weights.serverAccessValue,
        profile.weights.serverAccessValue,
        firstReason(access.reasons),
      ],
      [
        "remoteThreat",
        "Remote-Druck",
        remote.score * profile.weights.remoteThreat,
        profile.weights.remoteThreat,
        firstReason(remote.reasons),
      ],
      [
        "corpScoringThreat",
        "Corp-Scoring-Gefahr",
        corpThreat.score * profile.weights.corpScoringThreat,
        profile.weights.corpScoringThreat,
        firstReason(corpThreat.reasons),
      ],
      [
        "breakerPlan",
        "Breaker-Plan",
        breakerPlan.score,
        1,
        firstReason(breakerPlan.reasons),
      ],
      [
        "twoTurnIntent",
        "Zwei-Zug-Absicht",
        twoTurnIntent.score,
        1,
        firstReason(twoTurnIntent.reasons),
      ],
      [
        "citySurveillance",
        "City-Surveillance-Risiko",
        citySurveillanceDrawRisk.score,
        1,
        firstReason(citySurveillanceDrawRisk.reasons),
      ],
      [
        "installedEconomy",
        "Installierte Economy",
        installedEconomy.score,
        1,
        firstReason(installedEconomy.reasons),
      ],
      [
        "shellTraders",
        "Shell Traders",
        shellTraders.score,
        1,
        firstReason(shellTraders.reasons),
      ],
      [
        "handUse",
        "Handnutzung",
        handUse.score,
        1,
        firstReason(handUse.reasons),
      ],
      [
        "duplicateInstall",
        "Duplikat-Installation",
        duplicateInstall.score,
        1,
        firstReason(duplicateInstall.reasons),
      ],
      [
        "remoteContestTrash",
        "Remote-Contest/Trash",
        remoteContest.score,
        1,
        firstReason(remoteContest.reasons),
      ],
      [
        "centralPressure",
        "Central Pressure",
        centralPressure.score,
        1,
        firstReason(centralPressure.reasons),
      ],
      [
        "noFreshCentral",
        "No-Fresh-Central-Substitution",
        noFreshCentralSubstitution.score,
        1,
        firstReason(noFreshCentralSubstitution.reasons),
      ],
      [
        "phaseExitPressure",
        "Setup-to-Pressure",
        phaseExitPressure.score,
        1,
        firstReason(phaseExitPressure.reasons),
      ],
      [
        "strategicLine",
        "Strategic Line",
        strategicLine.score,
        1,
        firstReason(strategicLine.reasons),
      ],
      [
        "planContinuation",
        "Planfortsetzung/-abbruch",
        planContinuation.score,
        1,
        firstReason(planContinuation.reasons),
      ],
      [
        "economyReserve",
        "Credit-Reserve",
        economyReserve.score,
        1,
        firstReason(economyReserve.reasons),
      ],
      [
        "visibleRisk",
        "Sichtbares Risiko",
        -visibleRiskPenalty(candidate, profile.riskTolerance),
        1,
        firstReason(candidate.visibleRisks),
      ],
      [
        "easyRunPenalty",
        "Easy-Run-Bremse",
        -easyRunPenalty,
        1,
        easyRunPenalty > 0 ? "easy_run_penalty" : undefined,
      ],
    ]),
    evidence: scrubPlanEvidence([
      `plan:${candidate.kind}`,
      `difficulty:${input.difficulty}`,
      `doctrine_plan_weight:${doctrinePlanWeight}`,
      ...(input.ownDeckDoctrine
        ? [
            `doctrine:${input.ownDeckDoctrine.archetypeTags.slice(0, 3).join(",") || "neutral"}`,
          ]
        : ["doctrine:neutral"]),
      ...outcomeFollowup.evidence,
      ...candidate.visibleBenefits,
      ...installedEconomy.evidence,
      ...shellTraders.evidence,
      ...handUse.evidence,
      ...duplicateInstall.evidence,
      ...remoteContest.evidence,
      ...centralPressure.evidence,
      ...noFreshCentralSubstitution.evidence,
      ...phaseExitPressure.evidence,
      ...strategicLine.evidence,
      ...planContinuation.evidence,
      ...economyReserve.evidence,
      ...twoTurnIntent.evidence,
      ...citySurveillanceDrawRisk.evidence,
      ...rig.evidence,
      ...runCost.evidence,
      ...access.evidence,
      ...remote.evidence,
      ...corpThreat.evidence,
      ...earlyTurn.evidence,
      ...breakerPlan.evidence,
      `belief_version:${beliefState.version}`,
      ...(beliefState.runnerOpponentModel
        ? [
            `belief_credit_reserve:${beliefState.runnerOpponentModel.corpCreditReserveInterpretation}`,
          ]
        : []),
    ]),
  };
}

function evaluateRunnerStrategicLine(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
  beliefState: BeliefState,
): RunnerPlanEvaluatorResult {
  const selection = selectRunnerStrategicLine(input, beliefState);
  if (!selection) return { score: 0, reasons: [], evidence: [] };
  const target = targetServerId(input, candidate);
  const matchesLine = runnerCandidateMatchesStrategicLine(
    input,
    candidate,
    selection.kind,
    target,
    beliefState,
  );
  const tacticalOverride = runnerCandidateIsTacticalOverride(input, candidate);
  let score = 0;
  const reasons: string[] = [];
  if (matchesLine) {
    score += Math.min(155, 60 + Math.round(selection.weight / 7));
    reasons.push("strategic_line_commitment");
  } else if (
    !tacticalOverride &&
    runnerStrategicLinePrefersPressure(selection.kind) &&
    (candidate.kind === "recover_economy" ||
      candidate.kind === "draw_for_answers" ||
      candidate.kind === "build_rig")
  ) {
    score -= candidate.kind === "draw_for_answers" ? 45 : 30;
    reasons.push("strategic_line_setup_not_selected");
  } else if (tacticalOverride) {
    reasons.push("strategic_line_tactical_override_allowed");
  }
  return {
    score,
    reasons,
    evidence: [
      "strategic_line_selected:true",
      "strategic_line_side:runner",
      `strategic_line_kind:${selection.kind}`,
      `strategic_line_weight:${selection.weight}`,
      `strategic_line_reason:${selection.reason}`,
      `strategic_line_selected_by_seed:${selection.selectedBySeed}`,
      `strategic_line_commitment_ttl:${selection.commitmentTtl}`,
      `strategic_line_commitment_bucket:${selection.commitmentBucket}`,
      `strategic_line_candidate_count:${selection.candidateWeights.length}`,
      ...selection.candidateWeights
        .slice(0, 6)
        .map((line) => `strategic_line_candidate:${line.kind}:${line.weight}`),
      ...(matchesLine
        ? [
            "strategic_line_continuation_taken:true",
            `strategic_line_plan:${candidate.kind}`,
          ]
        : []),
      ...(!matchesLine && tacticalOverride
        ? ["strategic_line_overridden_by_tactical_urgency:true"]
        : []),
      ...selection.visibleEvidence,
    ],
  };
}

function selectRunnerStrategicLine(
  input: AiDecisionInput,
  beliefState: BeliefState,
): RunnerStrategicLineSelection | undefined {
  if (!input.ownDeckDoctrine || input.ownDeckDoctrine.side !== "runner")
    return undefined;
  if (input.difficulty === "easy") return undefined;
  const features = extractRunnerFeatures(input);
  const breakerPressure = assessVisibleBreakerPressure(input);
  const pressureReady = assessRunnerPressureReady(input, beliefState, features);
  const reserveTarget = runnerCreditReserveTargetForPlanInput(input, features);
  const hqRun = legalRunActionForServer(input, "hq");
  const rndRun = legalRunActionForServer(input, "rd");
  const archivesRun = legalRunActionForServer(input, "archives");
  const hqEstimate = hqRun
    ? runnerKnownPathEstimate(input, "hq", features)
    : undefined;
  const rndEstimate = rndRun
    ? runnerKnownPathEstimate(input, "rd", features)
    : undefined;
  const hqMemory = beliefState.runnerOpponentModel?.hqHandMemory;
  const hqKnownAgenda = (hqMemory?.knownDefinitions ?? []).some(
    (definitionId) => cardDefinitionType(definitionId) === "agenda",
  );
  const hqUnknownCount = Math.max(
    0,
    (hqMemory?.handCount ?? input.playerView.opponent.handCount) -
      (hqMemory?.knownCount ?? 0),
  );
  const rndFreshness = beliefState.runnerOpponentModel?.rndTopFreshness;
  const rndKnownAgenda =
    rndFreshness?.knownTopDefinitionId !== undefined &&
    cardDefinitionType(rndFreshness.knownTopDefinitionId) === "agenda";
  const rndFresh =
    rndFreshness?.freshness === "fresh_after_top_removed" ||
    rndFreshness?.freshenedByRunnerAccess === true;
  const remoteProfiles = input.legalActions
    .filter(
      (action) =>
        action.type === "start_run" &&
        typeof action.payload?.serverId === "string" &&
        action.payload.serverId.startsWith("remote_"),
    )
    .map((action) =>
      runnerRemoteContestProfile(
        input,
        String(action.payload?.serverId),
        features,
      ),
    );
  const contestableRemote = remoteProfiles.some(
    (profile) => profile.contestable || profile.relevantTrash,
  );
  const installedInterface =
    input.playerView.own.rig?.some(
      (card) =>
        card.known &&
        rolesForCardId(card.definitionId).some(isRunnerPressureRole),
    ) === true;
  const playableInterface = input.legalActions.some((action) =>
    rolesForAction(input, action).some(isRunnerPressureRole),
  );
  const closeToWin =
    input.playerView.agendaPointsToWin - input.playerView.own.agendaPoints <= 2;
  const closeoutKnown =
    closeToWin && (hqKnownAgenda || rndKnownAgenda || contestableRemote);
  const hqAffordable =
    hqEstimate === undefined ||
    (!hqEstimate.blocked && hqEstimate.creditsAfterPath >= 1);
  const rndAffordable =
    rndEstimate === undefined ||
    (!rndEstimate.blocked && rndEstimate.creditsAfterPath >= 1);
  const rawCandidates: RunnerStrategicLineCandidate[] = [
    {
      kind: "early_hq_pressure",
      weight:
        hqRun && hqAffordable
          ? 185 +
            (hqKnownAgenda ? 210 : 0) +
            Math.min(60, hqUnknownCount * 15) +
            (input.actionNumber <= 16 ? 35 : 0)
          : 0,
      reasons: [
        ...(hqKnownAgenda ? ["known_hq_agenda"] : []),
        ...(hqUnknownCount > 0 ? ["hq_unknown_cards"] : []),
      ],
    },
    {
      kind: "early_rnd_pressure",
      weight:
        rndRun && rndAffordable
          ? 185 +
            (rndKnownAgenda ? 225 : 0) +
            (rndFresh ? 120 : 0) +
            (input.actionNumber <= 16 ? 35 : 0)
          : 0,
      reasons: [
        ...(rndKnownAgenda ? ["known_rnd_top_agenda"] : []),
        ...(rndFresh ? ["rnd_top_fresh"] : []),
      ],
    },
    {
      kind: "remote_contest",
      weight: contestableRemote
        ? 285 +
          remoteProfiles.filter((profile) => profile.contestable).length * 55 +
          remoteProfiles.filter((profile) => profile.relevantTrash).length * 45
        : 0,
      reasons: contestableRemote ? ["remote_contest_visible"] : [],
    },
    {
      kind: "economy_first",
      weight:
        input.playerView.own.credits < reserveTarget
          ? 220 + (reserveTarget - input.playerView.own.credits) * 28
          : 0,
      reasons:
        input.playerView.own.credits < reserveTarget
          ? ["reserve_below_target"]
          : [],
    },
    {
      kind: "rig_first",
      weight:
        breakerPressure.matchingInstallActionIds.size > 0
          ? 265 + breakerPressure.missingBreakerRoles.size * 45
          : 0,
      reasons:
        breakerPressure.matchingInstallActionIds.size > 0
          ? ["installable_breaker_for_blocked_path"]
          : [],
    },
    {
      kind: "breaker_search_first",
      weight:
        breakerPressure.matchingInstallActionIds.size === 0 &&
        (breakerPressure.searchActionIds.size > 0 ||
          breakerPressure.recoveryActionIds.size > 0)
          ? 250 + breakerPressure.missingBreakerRoles.size * 45
          : 0,
      reasons:
        breakerPressure.searchActionIds.size > 0 ||
        breakerPressure.recoveryActionIds.size > 0
          ? ["search_or_recovery_for_missing_breaker"]
          : [],
    },
    {
      kind: "interface_pressure",
      weight:
        (installedInterface || playableInterface) &&
        pressureReady.readyTargets.some(
          (target) => target.targetType === "hq" || target.targetType === "rnd",
        )
          ? 235 + (installedInterface ? 80 : 25)
          : 0,
      reasons:
        installedInterface || playableInterface
          ? ["interface_pressure_visible"]
          : [],
    },
    {
      kind: "closeout_pressure",
      weight: closeoutKnown
        ? 520 + Math.max(0, input.playerView.own.agendaPoints) * 30
        : 0,
      reasons: closeoutKnown ? ["closeout_known_points_or_agenda"] : [],
    },
  ];
  const candidates: RunnerStrategicLineCandidate[] = rawCandidates
    .map((candidate) => ({
      ...candidate,
      weight: Math.round(
        candidate.weight +
          Math.max(
            0,
            input.ownDeckDoctrine?.planWeights[
              runnerPlanKindForStrategicLine(candidate.kind)
            ] ?? 0,
          ) *
            0.35,
      ),
    }))
    .filter((candidate) => candidate.weight >= 180)
    .sort(
      (left, right) =>
        right.weight - left.weight || left.kind.localeCompare(right.kind),
    );
  if (candidates.length === 0) return undefined;
  const top = candidates[0]!;
  const near = candidates.filter(
    (candidate) => top.weight - candidate.weight <= 75,
  );
  const selectedBySeed = near.length > 1;
  const selected = selectedBySeed
    ? weightedStrategicLineChoice(
        near,
        `${input.seed}:${input.decisionId}:runner:${runnerStrategicDecisionBucket(input)}`,
      )
    : top;
  return {
    kind: selected.kind,
    weight: selected.weight,
    selectedBySeed,
    candidateWeights: candidates.slice(0, 8),
    commitmentTtl: 3,
    commitmentBucket: runnerStrategicDecisionBucket(input),
    reason: selected.reasons[0] ?? "visible_line_weight",
    visibleEvidence: [
      `strategic_line_credits:${input.playerView.own.credits}`,
      `strategic_line_reserve_target:${reserveTarget}`,
      `strategic_line_pressure_ready:${pressureReady.readyTargets.length}`,
      `strategic_line_missing_breaker_roles:${breakerPressure.missingBreakerRoles.size}`,
      `strategic_line_remote_profiles:${remoteProfiles.length}`,
      ...(archivesRun ? ["strategic_line_archives_legal:true"] : []),
    ],
  };
}

function runnerStrategicDecisionBucket(input: AiDecisionInput): number {
  const ownStrategicEvents = input.eventTail.filter(
    (event) =>
      event.publicPayload?.side === input.side &&
      typeof event.publicPayload?.actionType === "string" &&
      runnerStrategicLineActionTypes.has(
        event.publicPayload.actionType as LegalAction["type"],
      ),
  ).length;
  return Math.floor(ownStrategicEvents / 3);
}

const runnerStrategicLineActionTypes = new Set<LegalAction["type"]>([
  "start_run",
  "install_card",
  "play_event",
  "gain_credit",
  "draw_card",
  "trash_accessed_card",
  "jack_out",
  "end_turn",
]);

function weightedStrategicLineChoice<
  T extends { kind: string; weight: number },
>(candidates: T[], seed: string): T {
  const total = Math.max(
    1,
    candidates.reduce(
      (sum, candidate) => sum + Math.max(1, candidate.weight),
      0,
    ),
  );
  let cursor = Number.parseInt(strategicLineFnv1a(seed), 16) % total;
  for (const candidate of candidates) {
    cursor -= Math.max(1, candidate.weight);
    if (cursor < 0) return candidate;
  }
  return candidates[0]!;
}

function runnerCandidateMatchesStrategicLine(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
  lineKind: RunnerStrategicLineKind,
  target: string | undefined,
  beliefState: BeliefState,
): boolean {
  switch (lineKind) {
    case "early_hq_pressure":
      return candidate.kind === "pressure_hq";
    case "early_rnd_pressure":
      return candidate.kind === "pressure_rnd";
    case "remote_contest":
      return candidate.kind === "contest_remote";
    case "economy_first":
      return candidate.kind === "recover_economy";
    case "rig_first":
    case "breaker_search_first":
      return candidate.kind === "build_rig";
    case "interface_pressure":
      return (
        candidate.kind === "pressure_hq" ||
        candidate.kind === "pressure_rnd" ||
        (candidate.kind === "build_rig" &&
          runnerActionsForCandidate(input, candidate).some((action) =>
            rolesForAction(input, action).some(isRunnerPressureRole),
          ))
      );
    case "closeout_pressure":
      if (candidate.kind === "contest_remote") return true;
      if (candidate.kind === "pressure_hq") {
        const memory = beliefState.runnerOpponentModel?.hqHandMemory;
        return (
          (memory?.knownDefinitions ?? []).some(
            (definitionId) => cardDefinitionType(definitionId) === "agenda",
          ) ||
          input.playerView.agendaPointsToWin -
            input.playerView.own.agendaPoints <=
            2
        );
      }
      if (candidate.kind === "pressure_rnd") {
        const freshness = beliefState.runnerOpponentModel?.rndTopFreshness;
        return (
          (freshness?.knownTopDefinitionId !== undefined &&
            cardDefinitionType(freshness.knownTopDefinitionId) === "agenda") ||
          freshness?.freshness === "fresh_after_top_removed" ||
          target === "rd"
        );
      }
      return false;
  }
}

function runnerCandidateIsTacticalOverride(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
): boolean {
  if (candidate.kind === "trash_asset") return true;
  if (candidate.kind === "contest_remote") {
    const target = targetServerId(input, candidate);
    return target ? remoteServerHasVisibleScoreThreat(input, target) : false;
  }
  return input.legalActions.some(
    (action) =>
      action.type === "steal_agenda" || action.type === "trash_accessed_card",
  );
}

function runnerStrategicLinePrefersPressure(
  kind: RunnerStrategicLineKind,
): boolean {
  return (
    kind === "early_hq_pressure" ||
    kind === "early_rnd_pressure" ||
    kind === "remote_contest" ||
    kind === "interface_pressure" ||
    kind === "closeout_pressure"
  );
}

function runnerPlanKindForStrategicLine(
  kind: RunnerStrategicLineKind,
): RunnerPlanKind {
  switch (kind) {
    case "early_hq_pressure":
      return "pressure_hq";
    case "early_rnd_pressure":
      return "pressure_rnd";
    case "remote_contest":
      return "contest_remote";
    case "economy_first":
      return "recover_economy";
    case "rig_first":
    case "breaker_search_first":
      return "build_rig";
    case "interface_pressure":
      return "pressure_rnd";
    case "closeout_pressure":
      return "pressure_hq";
  }
}

function legalRunActionForServer(
  input: AiDecisionInput,
  serverId: string,
): LegalAction | undefined {
  return input.legalActions.find(
    (action) =>
      action.type === "start_run" && action.payload?.serverId === serverId,
  );
}

function runnerActionsForCandidate(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
): LegalAction[] {
  const ids = new Set(candidate.legalActionIds);
  return input.legalActions.filter((action) => ids.has(action.actionId));
}

function strategicLineFnv1a(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function evaluateRunnerTwoTurnRunIntent(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
): RunnerPlanEvaluatorResult {
  const intent = inferRunnerTwoTurnRunIntent(input);
  if (!intent) return { score: 0, reasons: [], evidence: [] };
  const target = targetServerId(input, candidate);
  const targetsIntent = target === intent.targetServerId;
  let score = 0;
  const reasons: string[] = [];
  if (!intent.ready && candidate.kind === "recover_economy") {
    score += intent.creditsNeeded <= 1 ? 280 : 180;
    reasons.push("two_turn_run_intent_economy_threshold");
  }
  if (
    !intent.ready &&
    candidate.kind === "draw_for_answers" &&
    input.playerView.own.gripOrHq.length < 3
  ) {
    score += 90;
    reasons.push("two_turn_run_intent_preserve_options");
  }
  if (!intent.ready && targetsIntent && isRunPlan(candidate.kind)) {
    score -= 210;
    reasons.push("two_turn_run_intent_setup_before_run");
  }
  if (intent.ready && targetsIntent && isRunPlan(candidate.kind)) {
    score += 300;
    reasons.push("two_turn_run_intent_ready_for_target");
  }
  if (intent.ready && candidate.kind === "recover_economy") {
    score -= 120;
    reasons.push("two_turn_run_intent_stop_building");
  }
  return {
    score,
    reasons,
    evidence: [
      `two_turn_run_intent_target:${intent.targetServerId}`,
      `two_turn_run_intent_ready:${intent.ready}`,
      `two_turn_run_intent_threshold:${intent.thresholdCredits}`,
      `two_turn_run_intent_credits_needed:${intent.creditsNeeded}`,
      `two_turn_run_intent_visible_break_cost:${intent.visibleBreakCost}`,
      `two_turn_run_intent_state:${intent.stateKey}`,
      "two_turn_run_intent_lifetime:single_decision",
      "two_turn_run_intent_invalidates_on:target_credits_visible_ice_breakers",
    ],
  };
}

function evaluateCitySurveillanceDrawRisk(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
): RunnerPlanEvaluatorResult {
  if (candidate.kind !== "draw_for_answers")
    return { score: 0, reasons: [], evidence: [] };
  const projection = bestCitySurveillanceDrawProjection(input, candidate);
  if (projection.sourceCount <= 0) {
    return {
      score: 0,
      reasons: [],
      evidence: ["city_surveillance_draw_tax:false"],
    };
  }

  let penalty = projection.creditsPaid * 185 + projection.tagsAdded * 620;
  if (
    projection.creditsPaid > 0 &&
    input.playerView.own.credits <= projection.creditsPaid + 1
  )
    penalty += 120;
  if (projection.tagsAdded > 0 && input.playerView.own.tags > 0)
    penalty += Math.min(360, input.playerView.own.tags * 20);

  return {
    score: -penalty,
    reasons: [
      projection.tagsAdded > 0
        ? "city_surveillance_draw_would_add_tag"
        : "city_surveillance_draw_tax_paid",
    ],
    evidence: [
      "city_surveillance_draw_tax:true",
      `city_surveillance_sources:${projection.sourceCount}`,
      `city_surveillance_decision:${projection.decision}`,
      `city_surveillance_projected_credits:${projection.creditsPaid}`,
      `city_surveillance_projected_tags:${projection.tagsAdded}`,
      `tags:${input.playerView.own.tags}`,
      `credits:${input.playerView.own.credits}`,
    ],
  };
}

function evaluateRunnerHandUseDiscipline(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
): RunnerPlanEvaluatorResult {
  const opportunity = runnerHandUseOpportunity(input);
  const goodHandActionCount =
    opportunity.playableEconomyActionCount +
    opportunity.installableBreakerActionCount +
    opportunity.runnablePressureActionCount +
    opportunity.remoteTrashActionCount;
  let score = 0;
  const reasons: string[] = [];

  if (candidate.kind === "draw_for_answers") {
    if (opportunity.playableEconomyActionCount > 0) {
      score -= 190;
      reasons.push("economy_before_draw");
    }
    if (opportunity.installableBreakerActionCount > 0) {
      score -= 260;
      reasons.push("install_breaker_before_draw");
    }
    if (opportunity.runnablePressureActionCount > 0) {
      score -= 170;
      reasons.push("pressure_card_before_draw");
    }
    if (opportunity.remoteTrashActionCount > 0) {
      score -= 320;
      reasons.push("remote_trash_before_draw");
    }
    if (opportunity.drawDiscardPressure && goodHandActionCount > 0) {
      score -= 180;
      reasons.push("avoid_draw_to_discard");
    }
    if (goodHandActionCount === 0) {
      score += input.playerView.own.gripOrHq.length < 3 ? 120 : 45;
      reasons.push("draw_for_answers_only_when_needed");
    } else {
      reasons.push("use_hand_before_draw");
    }
  }

  if (
    candidate.kind === "recover_economy" &&
    opportunity.playableEconomyActionCount > 0
  ) {
    score += input.playerView.own.credits < 5 ? 185 : 80;
    reasons.push("use_playable_economy");
  }
  if (candidate.kind === "build_rig") {
    if (opportunity.installableBreakerActionCount > 0) {
      const bestBreakerInstallReserve = bestRemainingCreditsForCandidateActions(
        input,
        candidate,
        (action) => isRunnerInstallableRelevantBreaker(input, action),
      );
      if (bestBreakerInstallReserve >= 2) {
        score += 210;
        reasons.push("install_relevant_breaker");
      }
    }
    if (opportunity.runnablePressureActionCount > 0) {
      score += 80;
      reasons.push("install_pressure_card_before_draw");
    }
  }
  if (
    candidate.kind === "trash_asset" &&
    opportunity.remoteTrashActionCount > 0
  ) {
    score += 180;
    reasons.push("take_remote_trash_opportunity");
  }
  if (
    isRunPlan(candidate.kind) &&
    opportunity.runnablePressureActionCount > 0
  ) {
    score += 55;
    reasons.push("use_runnable_pressure_before_draw");
  }

  return {
    score,
    reasons,
    evidence: [
      `hand_use_playable_economy:${opportunity.playableEconomyActionCount}`,
      `hand_use_installable_breaker:${opportunity.installableBreakerActionCount}`,
      `hand_use_pressure:${opportunity.runnablePressureActionCount}`,
      `hand_use_remote_trash:${opportunity.remoteTrashActionCount}`,
      `hand_use_draw_discard_pressure:${opportunity.drawDiscardPressure}`,
    ],
  };
}

function evaluateRunnerDuplicateInstallDiscipline(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
): RunnerPlanEvaluatorResult {
  if (candidate.kind !== "build_rig")
    return { score: 0, reasons: [], evidence: [] };
  const installActions = candidate.legalActionIds
    .map((actionId) =>
      input.legalActions.find((action) => action.actionId === actionId),
    )
    .filter((action): action is LegalAction => action?.type === "install_card");
  const duplicateActions = installActions.filter((action) =>
    isRunnerDuplicateInstall(input, action),
  );
  const lowValueDuplicateActions = duplicateActions.filter((action) =>
    isRunnerLowValueDuplicateInstall(input, action),
  );
  if (duplicateActions.length === 0) {
    return {
      score: 0,
      reasons: [],
      evidence: ["duplicate_install:false"],
    };
  }
  const allInstallChoicesAreLowValue =
    installActions.length > 0 &&
    lowValueDuplicateActions.length === installActions.length;
  const score = allInstallChoicesAreLowValue
    ? -360
    : -Math.min(220, lowValueDuplicateActions.length * 120);
  return {
    score,
    reasons:
      lowValueDuplicateActions.length > 0
        ? ["avoid_low_value_duplicate_install"]
        : ["duplicate_install_limited_extra_value"],
    evidence: [
      "duplicate_install:true",
      `duplicate_install_count:${duplicateActions.length}`,
      `low_value_duplicate_install_count:${lowValueDuplicateActions.length}`,
      `junkyard_bbs_duplicate_install:${lowValueDuplicateActions.some(
        (action) =>
          sourceDefinitionIdForAction(input, action) ===
          "onr_v1_165_junkyard-bbs",
      )}`,
    ],
  };
}

function evaluateRunnerRemoteContestAndTrashDiscipline(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
): RunnerPlanEvaluatorResult {
  const opportunity = runnerRemoteContestOpportunity(input, candidate);
  let score = 0;
  const reasons: string[] = [];
  const evidence: string[] = [];

  if (candidate.kind === "trash_asset") {
    const context = currentRemoteTrashAccessContext(input);
    evidence.push(...context.evidence);
    if (context.affordableRelevant && context.deferredByBudget) {
      score -= context.acuteThreat ? 120 : 360;
      reasons.push(
        context.acuteThreat
          ? "delay_remote_trash_until_reserve_recovers"
          : "defer_expensive_remote_trash_without_threat",
      );
    } else if (context.affordableRelevant) {
      const highImpactBonus =
        context.role === "scoring_protection"
          ? 270
          : context.role === "run_tax"
            ? 235
            : context.role === "economy"
              ? 220
              : 190;
      score += highImpactBonus;
      if (context.finitePoolEconomy) {
        score += context.bbsWhisperingCampaign ? 430 : 300;
        if (context.corpValueRemaining >= Math.max(context.trashCost + 4, 8)) {
          score += 120;
        }
      }
      if (context.acuteThreat) score += 110;
      if (context.dedicatedTrashCredits > 0) score += 80;
      reasons.push(
        context.bbsWhisperingCampaign
          ? "trash_bbs_whispering_campaign_pool"
          : context.finitePoolEconomy
            ? "trash_finite_pool_economy_asset"
            : context.role === "scoring_protection"
              ? "trash_scoring_protection_upgrade"
              : context.role === "run_tax"
                ? "trash_run_tax_upgrade_when_budget_ok"
                : context.role === "economy"
                  ? "trash_economy_node"
                  : "trash_high_value_remote_asset",
      );
    } else if (context.trashable && context.role === "low_value") {
      score -= 260;
      reasons.push("do_not_trash_low_value_card");
    } else if (context.trashable && context.expensive) {
      score -= 120;
      reasons.push("avoid_expensive_unknown_remote_trash");
    }
  }

  if (candidate.kind === "contest_remote") {
    const target = targetServerId(input, candidate);
    if (
      target !== undefined &&
      recentRunnerDeclinedRelevantRemoteTrash(input, target)
    ) {
      score -= 560;
      reasons.push("avoid_repeat_remote_after_declined_trash");
      evidence.push("runner_repeat_remote_after_declined_trash_penalized:true");
    }
    if (opportunity.selectedTargetAdvanced) {
      score += opportunity.selectedTargetContestable ? 360 : 80;
      reasons.push(
        opportunity.selectedTargetContestable
          ? "contest_advanced_remote_now"
          : "contest_advanced_remote",
      );
      if (opportunity.selectedTargetPostRunReserveSufficient) {
        score += 120;
        reasons.push("remote_run_if_post_run_reserve_sufficient");
      } else if (opportunity.selectedTargetPostRunReserve > 0) {
        score -= 520;
        reasons.push("preserve_credits_for_steal_or_trash");
      }
    }
    if (opportunity.selectedTargetRelevantTrash) {
      score += 170;
      reasons.push("contest_relevant_remote_trash_target");
    }
  } else if (
    (candidate.kind === "pressure_rnd" ||
      candidate.kind === "pressure_hq" ||
      candidate.kind === "safe_probe_run") &&
    opportunity.centralRunWhileRemoteThreat
  ) {
    const pressurePenalty =
      opportunity.centralRunWhileContestableThreat &&
      !opportunity.centralRunJustified
        ? 340
        : 180;
    score -= pressurePenalty;
    reasons.push(
      opportunity.centralRunWhileContestableThreat
        ? "contest_score_threat_before_central_pressure"
        : "remote_run_before_central_if_score_threat",
    );
    if (opportunity.centralRunBurnsContestReserve) {
      score -= 220;
      reasons.push("avoid_central_run_that_burns_remote_contest_reserve");
    }
    if (opportunity.centralRunJustified) {
      score += 120;
      reasons.push("central_pressure_if_remote_unreachable");
    }
  }

  return {
    score,
    reasons,
    evidence: [
      `remote_contest_advanced_targets:${opportunity.advancedRemoteTargetCount}`,
      ...(opportunity.contestableAdvancedRemoteTargetCount > 0
        ? [
            `remote_contest_contestable_advanced_targets:${opportunity.contestableAdvancedRemoteTargetCount}`,
          ]
        : []),
      `remote_contest_relevant_trash_targets:${opportunity.relevantTrashRemoteTargetCount}`,
      ...evidence,
      `remote_contest_selected_advanced:${opportunity.selectedTargetAdvanced}`,
      ...(opportunity.selectedTargetAdvanced
        ? [
            `remote_contest_selected_contestable:${opportunity.selectedTargetContestable}`,
            `remote_contest_selected_post_run_reserve:${opportunity.selectedTargetPostRunReserve}`,
            `remote_contest_selected_post_run_reserve_sufficient:${opportunity.selectedTargetPostRunReserveSufficient}`,
          ]
        : []),
      `remote_contest_selected_relevant_trash:${opportunity.selectedTargetRelevantTrash}`,
      `central_run_while_remote_threat:${opportunity.centralRunWhileRemoteThreat}`,
      ...(opportunity.centralRunWhileContestableThreat
        ? [
            `central_run_while_contestable_remote_threat:${opportunity.centralRunWhileContestableThreat}`,
            `central_run_justified:${opportunity.centralRunJustified}`,
            `central_run_burns_contest_reserve:${opportunity.centralRunBurnsContestReserve}`,
          ]
        : []),
    ],
  };
}

function evaluateRunnerCentralPressureDiscipline(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
  beliefState: BeliefState,
): RunnerPlanEvaluatorResult {
  const opportunity = runnerCentralPressureOpportunity(
    input,
    candidate,
    beliefState,
  );
  const reasons: string[] = [];
  let score = 0;

  if (candidate.kind === "pressure_rnd" || candidate.kind === "pressure_hq") {
    if (!opportunity.targetServerId) {
      return {
        score: 0,
        reasons: [],
        evidence: ["central_pressure_target:none"],
      };
    }
    if (opportunity.pathBlocked) {
      score -= opportunity.pathBlockedByUnbreakableIce ? 1900 : 560;
      reasons.push("central_pressure_path_blocked");
      if (opportunity.pathBlockedByUnbreakableIce) {
        reasons.push("central_pressure_known_unbreakable_no_access");
      }
    }
    if (
      opportunity.matchingInterfaceInstalled &&
      opportunity.accessReachable &&
      opportunity.preservesReserve
    ) {
      score += opportunity.targetServerId === "rd" ? 300 : 280;
      reasons.push(
        opportunity.targetServerId === "rd"
          ? "pressure_rnd_with_multiaccess"
          : "pressure_hq_with_multiaccess",
      );
    } else if (
      opportunity.anyInterfaceInstalled &&
      opportunity.accessReachable &&
      opportunity.preservesReserve
    ) {
      score += 110;
      reasons.push("central_pressure_with_generic_multiaccess");
    }
    if (opportunity.closeoutOpportunity && opportunity.centralPressureClear) {
      score += 210;
      reasons.push("central_closeout_run");
    }
    if (
      opportunity.centralPressureClear &&
      opportunity.accessReachable &&
      opportunity.remoteThreatLessValuable &&
      (opportunity.matchingInterfaceInstalled ||
        opportunity.anyInterfaceInstalled ||
        opportunity.matchingRunEvents > 0 ||
        opportunity.closeoutOpportunity)
    ) {
      score += 120;
      reasons.push("central_pressure_if_remote_low_threat");
    }
    if (opportunity.repeatedFreshValue && opportunity.accessReachable) {
      score += opportunity.closeoutOpportunity ? 110 : 75;
      reasons.push("central_pressure_with_fresh_value");
    }
    if (opportunity.repeatedLowValue) {
      score -= opportunity.matchingInterfaceInstalled ? 120 : 1200;
      reasons.push("avoid_repeated_low_value_central");
    }
    if (!opportunity.preservesReserve && !opportunity.closeoutOpportunity) {
      score -= opportunity.remoteContestableThreat ? 260 : 120;
      reasons.push("preserve_reserve_after_central");
    }
    if (
      opportunity.remoteContestableThreat &&
      !opportunity.centralPressureClear &&
      !opportunity.closeoutOpportunity
    ) {
      score -= 240;
      reasons.push("remote_before_central_if_score_threat");
    }
  }

  if (candidate.kind === "build_rig") {
    if (opportunity.matchingPressureInstallActions > 0) {
      if (
        opportunity.remoteContestableThreat &&
        !opportunity.remoteThreatLessValuable
      ) {
        score -= 190;
        reasons.push("remote_before_interface_install_if_score_threat");
      } else if (opportunity.centralPressureClear || opportunity.openOrCheap) {
        score += opportunity.closeoutOpportunity ? 260 : 190;
        reasons.push("install_interface_before_repeated_central");
      }
    }
  }

  if (
    candidate.kind === "safe_probe_run" &&
    opportunity.matchingRunEvents > 0
  ) {
    if (opportunity.runEventHasGoodTarget) {
      score += 150;
      reasons.push("use_run_event_when_target_good");
    } else {
      score -= 260;
      reasons.push("pivot_to_economy_or_rig_if_central_low_value");
    }
  }
  if (
    candidate.kind === "safe_probe_run" &&
    opportunity.targetServerId &&
    opportunity.repeatedLowValue
  ) {
    score -= 700;
    reasons.push("avoid_repeated_low_value_central");
  }

  return {
    score,
    reasons,
    evidence: [
      `central_pressure_target:${opportunity.targetServerId ?? "none"}`,
      `central_pressure_path_blocked:${opportunity.pathBlocked}`,
      `central_pressure_access_reachable:${opportunity.accessReachable}`,
      `central_pressure_unbreakable_no_access:${opportunity.pathBlockedByUnbreakableIce}`,
      `central_pressure_missing_coverage:${opportunity.pathBlockedByMissingCoverage}`,
      `central_pressure_known_etr_block:${opportunity.pathBlockedByKnownEtr}`,
      `central_pressure_break_cost:${opportunity.visibleBreakCost}`,
      `central_pressure_credits_after_path:${opportunity.creditsAfterPath}`,
      `central_pressure_reserve_target:${opportunity.reserveTarget}`,
      `central_pressure_preserves_reserve:${opportunity.preservesReserve}`,
      `central_pressure_open_or_cheap:${opportunity.openOrCheap}`,
      `central_pressure_interface_installed:${opportunity.anyInterfaceInstalled}`,
      `central_pressure_matching_interface_installed:${opportunity.matchingInterfaceInstalled}`,
      `central_pressure_multiaccess_installed:${opportunity.multiaccessInstalled}`,
      `central_pressure_multiaccess_suppressed_no_access:${opportunity.multiaccessInstalled && !opportunity.accessReachable}`,
      `central_pressure_install_opportunities:${opportunity.matchingPressureInstallActions}`,
      `central_pressure_run_events:${opportunity.matchingRunEvents}`,
      `central_pressure_run_event_good_target:${opportunity.runEventHasGoodTarget}`,
      `central_pressure_repeated_low_value:${opportunity.repeatedLowValue}`,
      `central_pressure_repeated_fresh_value:${opportunity.repeatedFreshValue}`,
      `central_closeout_opportunity:${opportunity.closeoutOpportunity}`,
      `central_closeout_reasons:${opportunity.closeoutReasons.join("|") || "none"}`,
      `central_pressure_clear:${opportunity.centralPressureClear}`,
      `central_pressure_remote_contestable:${opportunity.remoteContestableThreat}`,
      `central_pressure_remote_low_threat:${opportunity.remoteThreatLessValuable}`,
    ],
  };
}

function evaluateRunnerNoFreshCentralSubstitution(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
  beliefState: BeliefState,
): RunnerPlanEvaluatorResult {
  const context = runnerNoFreshCentralSubstitutionContext(input, beliefState);
  if (context.staleTargets.length === 0) {
    return {
      score: 0,
      reasons: [],
      evidence: ["no_fresh_central_window:false"],
    };
  }
  const reasons: string[] = [];
  let score = 0;
  const target = targetServerId(input, candidate);
  const centralTarget =
    target === "hq" || target === "rd" || target === "archives"
      ? target
      : undefined;
  const better = context.betterAlternatives;

  if (centralTarget && context.staleTargets.includes(centralTarget)) {
    if (context.allowedReasons.has("closeout")) {
      score += 120;
      reasons.push("allow_central_if_closeout");
    } else if (
      context.allowedReasons.has("interface") ||
      context.allowedReasons.has("multiaccess")
    ) {
      score += 95;
      reasons.push("allow_central_if_fresh_value");
    } else if (
      better.size === 0 &&
      context.allowedReasons.has("remote_uncontestable")
    ) {
      score += 55;
      reasons.push("allow_central_if_remote_uncontestable");
    } else if (
      better.size === 0 &&
      (context.allowedReasons.has("central_open") ||
        context.allowedReasons.has("no_better_action"))
    ) {
      score += 45;
      reasons.push("allow_central_if_no_better_action");
    } else {
      score -= 360 + better.size * 90;
      reasons.push("substitute_stale_central_with_better_action");
    }
  }

  if (candidate.kind === "contest_remote" && better.has("remote_contest")) {
    score += 620;
    reasons.push("substitute_stale_central_with_remote_contest");
  }
  if (candidate.kind === "recover_economy" && better.has("economy")) {
    score += 420;
    reasons.push("substitute_stale_central_with_economy");
  }
  if (candidate.kind === "build_rig" && better.has("rig_unlock")) {
    score += 360;
    reasons.push("substitute_stale_central_with_rig_unlock");
  }
  if (candidate.kind === "build_rig" && better.has("pressure_install")) {
    score += 300;
    reasons.push("substitute_stale_central_with_pressure_install");
  }
  if (candidate.kind === "draw_for_answers" && better.has("setup_search")) {
    score += 180;
    reasons.push("substitute_stale_central_with_setup");
  }

  return {
    score,
    reasons,
    evidence: [
      `no_fresh_central_window:true`,
      `no_fresh_central_targets:${context.staleTargets.join("|")}`,
      `no_fresh_central_better_alternatives:${[...better].join("|") || "none"}`,
      `stale_central_allowed_reasons:${[...context.allowedReasons].join("|") || "none"}`,
    ],
  };
}

function evaluateRunnerPlanContinuationAbort(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
  beliefState: BeliefState,
): RunnerPlanEvaluatorResult {
  if (!input.profileId.includes("v1.4.2")) {
    return {
      score: 0,
      reasons: [],
      evidence: ["plan_continuation_profile:false"],
    };
  }
  const intent = reconstructRunnerPlanContinuationIntent(input, beliefState);
  if (!intent) {
    return {
      score: 0,
      reasons: [],
      evidence: ["plan_continuation_opportunity:false"],
    };
  }
  const features = extractRunnerFeatures(input);
  const target = targetServerId(input, candidate);
  const samePlan = candidate.kind === intent.planKind;
  const abortNeeded = intent.abortReasons.length > 0 || intent.expired;
  const continuationPlan = runnerContinuationPlanMatches(
    input,
    candidate,
    intent,
    features,
    beliefState,
  );
  const abortPlan = runnerAbortPlanMatches(candidate, intent, features);
  let score = 0;
  const reasons: string[] = [];

  if (!abortNeeded && continuationPlan) {
    score += 110;
    reasons.push("continue_short_horizon_plan");
  }
  if (abortNeeded && abortPlan) {
    score += 145;
    reasons.push("abort_or_pivot_stale_plan");
  }
  if (abortNeeded && samePlan && !continuationPlan) {
    score -= intent.expired ? 360 : 260;
    reasons.push("do_not_repeat_aborted_plan");
  }
  if (
    intent.samePlanRepeatsWithoutProgress > 0 &&
    samePlan &&
    !continuationPlan
  ) {
    score -= 180 + intent.samePlanRepeatsWithoutProgress * 90;
    reasons.push("avoid_same_plan_repeat_without_progress");
  }
  if (
    intent.planKind === "recover_economy" &&
    candidate.kind === "recover_economy" &&
    features.credits >=
      runnerCreditReserveTargetForPlanInput(input, features) &&
    !runnerStillNeedsEconomyForVisibleContestOrTrash(input, features)
  ) {
    score -= 230;
    reasons.push("economy_plan_reserve_reached");
  }
  if (
    intent.planKind === "safe_probe_run" &&
    samePlan &&
    target === intent.targetServerId
  ) {
    score -= 240;
    reasons.push("probe_without_followup_should_pivot");
  }

  return {
    score,
    reasons,
    evidence: [
      "plan_continuation_opportunity:true",
      `plan_intent_side:runner`,
      `plan_intent_kind:${intent.planKind}`,
      `plan_intent_target:${intent.targetServerId ?? "none"}`,
      `plan_intent_own_decisions:${intent.ownStrategicDecisionCount}`,
      `plan_intent_same_repeats:${intent.samePlanRepeatsWithoutProgress}`,
      `plan_intent_expired:${intent.expired}`,
      `plan_abort_opportunity:${abortNeeded}`,
      `plan_abort_reason:${intent.abortReasons.join("|") || "none"}`,
      `plan_continuation_taken:${!abortNeeded && continuationPlan}`,
      `plan_abort_taken:${abortNeeded && abortPlan}`,
      `plan_candidate_kind:${candidate.kind}`,
      `plan_candidate_target:${target ?? "none"}`,
      ...intent.evidence,
    ],
  };
}

function evaluateRunnerOutcomeFollowup(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
  beliefState: BeliefState,
): RunnerPlanEvaluatorResult {
  if (!input.profileId.includes("v1.4.2") || !input.ownDeckDoctrine) {
    return {
      score: 0,
      reasons: [],
      evidence: ["outcome_followup_profile:false"],
    };
  }
  const outcome = reconstructRunnerOutcomeFollowup(input);
  if (!outcome) {
    return {
      score: 0,
      reasons: [],
      evidence: ["outcome_followup_opportunity:false"],
    };
  }
  const features = extractRunnerFeatures(input);
  const target = targetServerId(input, candidate);
  const sameTargetRun =
    target !== undefined &&
    target === outcome.targetServerId &&
    isRunPlan(candidate.kind);
  const centralTarget =
    outcome.targetServerId === "hq" ||
    outcome.targetServerId === "rd" ||
    outcome.targetServerId === "archives"
      ? outcome.targetServerId
      : undefined;
  const candidateActions = actionsForRunnerCandidate(input, candidate);
  const freshCentral =
    centralTarget !== undefined &&
    runnerCentralTargetHasFreshPlanValue(input, centralTarget, beliefState);
  const pathEstimate = target
    ? runnerKnownPathEstimate(input, target, features)
    : undefined;
  const rigUnlock = candidateActions.some((action) =>
    runnerInstallUnlocksVisiblePath(input, action),
  );
  const reserveTarget = runnerCreditReserveTargetForPlanInput(input, features);
  const candidateCentralFreshValue =
    target === "hq" || target === "rd" || target === "archives"
      ? runnerCentralTargetHasFreshPlanValue(input, target, beliefState)
      : false;
  const blockedFollowupRun =
    isRunPlan(candidate.kind) &&
    target !== undefined &&
    (features.blockedRunServers.has(target) ||
      (pathEstimate?.blocked ?? false));
  const economyProgression =
    candidate.kind === "recover_economy" && features.credits <= reserveTarget;
  const rigProgression =
    candidate.kind === "build_rig" &&
    (rigUnlock || features.blockedRunServers.size > 0);
  const runPivotProgression =
    isRunPlan(candidate.kind) &&
    target !== undefined &&
    target !== outcome.targetServerId &&
    pathEstimate !== undefined &&
    !blockedFollowupRun &&
    (candidateCentralFreshValue ||
      (candidate.kind === "contest_remote" &&
        target.startsWith("remote_") &&
        runnerRemoteTargetStillContestable(input, target, features)));
  const pivotCreatesProgression =
    economyProgression || rigProgression || runPivotProgression;
  const pivot =
    candidate.kind === "recover_economy" ||
    candidate.kind === "build_rig" ||
    candidate.kind === "draw_for_answers" ||
    (isRunPlan(candidate.kind) && target !== outcome.targetServerId);
  let score = 0;
  const reasons: string[] = [];
  const evidence: string[] = [
    "outcome_followup_opportunity:true",
    `outcome_kind:${outcome.kind}`,
    `outcome_source_version:${outcome.sourceVersion}`,
    `outcome_stale:${outcome.stale}`,
    `outcome_candidate_kind:${candidate.kind}`,
    ...(sameTargetRun ? ["outcome_candidate_same_target_run:true"] : []),
    ...outcome.evidence,
  ];
  const applyFollowup = (...flags: string[]): void => {
    evidence.push(
      "outcome_followup_taken:true",
      "outcome_followup_applied:true",
    );
    evidence.push(...flags);
  };
  const suppressByProgressionCost = (...flags: string[]): void => {
    evidence.push("outcome_followup_suppressed_by_progression_cost:true");
    if (blockedFollowupRun)
      evidence.push("effective_run_quote_blocked_followup_run:true");
    evidence.push(...flags);
  };

  switch (outcome.kind) {
    case "central_no_value":
      if (sameTargetRun && !freshCentral) {
        score -= 290;
        reasons.push("avoid_post_access_no_value_central_repeat");
        evidence.push(
          "bad_outcome_repeated_without_new_info:true",
          "runner_central_success_followed_by_repeat_no_value:true",
          "runner_access_no_value_repeated:true",
        );
      } else if (pivot && pivotCreatesProgression) {
        score += candidate.kind === "recover_economy" ? 150 : 115;
        reasons.push("pivot_after_no_value_central_access");
        applyFollowup(
          "outcome_pivot_with_reason:true",
          "runner_central_no_value_pivoted:true",
          "runner_access_no_value_pivoted:true",
        );
      } else if (pivot) {
        reasons.push("suppress_no_value_central_pivot_without_progression");
        suppressByProgressionCost();
      }
      break;
    case "central_fresh_value":
      if (
        sameTargetRun &&
        (freshCentral || outcome.kind === "central_fresh_value")
      ) {
        score += 145;
        reasons.push("continue_central_after_fresh_value");
        applyFollowup(
          "good_outcome_converted:true",
          "runner_central_success_followed_by_value:true",
        );
      }
      break;
    case "remote_empty_or_low_value":
      if (sameTargetRun) {
        const sameRemoteStillHasKnownRelevantTrash =
          outcome.targetServerId !== undefined &&
          remoteServerHasKnownRelevantTrashTarget(
            input,
            outcome.targetServerId,
          );
        score -= sameRemoteStillHasKnownRelevantTrash ? 640 : 560;
        reasons.push(
          sameRemoteStillHasKnownRelevantTrash
            ? "avoid_repeat_remote_after_declined_trash"
            : "avoid_empty_remote_repeat",
        );
        evidence.push("bad_outcome_repeated_without_new_info:true");
        if (sameRemoteStillHasKnownRelevantTrash) {
          evidence.push(
            "runner_repeat_remote_after_declined_trash_penalized:true",
          );
        }
      } else if (
        pivot &&
        (economyProgression || rigProgression || runPivotProgression)
      ) {
        score += candidate.kind === "recover_economy" ? 150 : 110;
        reasons.push("pivot_after_empty_remote_access");
        applyFollowup(
          "outcome_pivot_with_reason:true",
          "runner_remote_empty_or_low_value_pivoted:true",
        );
      } else if (pivot) {
        reasons.push("suppress_empty_remote_pivot_without_progression");
        suppressByProgressionCost();
      }
      break;
    case "remote_value":
      if (sameTargetRun && outcome.targetServerId) {
        const contestable = runnerRemoteTargetStillContestable(
          input,
          outcome.targetServerId,
          features,
        );
        const sameRemoteStillHasKnownRelevantTrash =
          remoteServerHasKnownRelevantTrashTarget(
            input,
            outcome.targetServerId,
          );
        if (sameRemoteStillHasKnownRelevantTrash) {
          score -= 520;
          reasons.push("avoid_repeat_remote_after_declined_trash");
          evidence.push(
            "bad_outcome_repeated_without_new_info:true",
            "runner_repeat_remote_after_declined_trash_penalized:true",
          );
        } else if (!contestable) {
          score -= 210;
          reasons.push("avoid_finished_remote_repeat");
          evidence.push("bad_outcome_repeated_without_new_info:true");
        }
      } else if (pivot && pivotCreatesProgression) {
        score += 85;
        reasons.push("reassess_after_remote_value");
        applyFollowup(
          "good_outcome_converted:true",
          "runner_remote_success_followed_by_value:true",
        );
      } else if (pivot) {
        reasons.push("suppress_remote_value_pivot_without_progression");
        suppressByProgressionCost();
      }
      break;
    case "jack_out_blocked":
      if (
        sameTargetRun &&
        (features.blockedRunServers.has(target ?? "") ||
          (pathEstimate?.blocked ?? false))
      ) {
        score -= 340;
        reasons.push("avoid_repeating_blocked_run_after_jack_out");
        evidence.push(
          "bad_outcome_repeated_without_new_info:true",
          "runner_jack_out_repeated_same_server_without_new_info:true",
        );
        if (blockedFollowupRun)
          evidence.push("effective_run_quote_blocked_followup_run:true");
      } else if (
        economyProgression ||
        rigProgression ||
        (rigUnlock && candidate.kind === "build_rig")
      ) {
        score += rigUnlock ? 230 : 170;
        reasons.push("repair_path_after_jack_out");
        applyFollowup(
          "outcome_pivot_with_reason:true",
          "runner_jack_out_followed_by_economy_or_rig:true",
        );
      } else if (
        candidate.kind === "recover_economy" ||
        candidate.kind === "build_rig" ||
        isRunPlan(candidate.kind)
      ) {
        reasons.push("suppress_jack_out_followup_without_path_progress");
        suppressByProgressionCost();
      }
      break;
    case "economy_or_rig_ready":
      if (
        isRunPlan(candidate.kind) &&
        target &&
        pathEstimate &&
        !pathEstimate.blocked
      ) {
        score += candidate.kind === "contest_remote" ? 180 : 135;
        reasons.push("convert_economy_or_rig_into_run");
        applyFollowup(
          "good_outcome_converted:true",
          outcome.evidence.includes("outcome_source:runner_rig")
            ? "runner_rig_converted_after_outcome:true"
            : "runner_economy_converted_after_outcome:true",
        );
      } else if (isRunPlan(candidate.kind) && blockedFollowupRun) {
        reasons.push("suppress_ready_followup_run_blocked_by_effective_quote");
        suppressByProgressionCost();
      } else if (
        (candidate.kind === "recover_economy" ||
          candidate.kind === "draw_for_answers") &&
        input.playerView.own.credits >=
          runnerCreditReserveTargetForPlanInput(input, features)
      ) {
        score -= 120;
        reasons.push("avoid_setup_spam_after_outcome_ready");
      }
      break;
  }

  if (
    evidence.includes("outcome_followup_opportunity:true") &&
    !evidence.includes("outcome_followup_taken:true") &&
    (evidence.includes("bad_outcome_repeated_without_new_info:true") ||
      evidence.includes(
        "runner_central_success_followed_by_repeat_no_value:true",
      ))
  ) {
    evidence.push("outcome_ignored:true");
  }

  return { score, reasons, evidence };
}

function evaluateRunnerEconomyReserveDiscipline(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
): RunnerPlanEvaluatorResult {
  const features = extractRunnerFeatures(input);
  const reserveTarget = runnerCreditReserveTargetForPlanInput(input, features);
  const belowReserve = features.credits < reserveTarget;
  const remoteThreatVisible = runnerHasVisibleRemoteScoreThreat(input);
  const immediateOpenRemoteThreat = runnerHasImmediateOpenRemoteScoreThreat(
    input,
    features,
  );
  const affordableRemoteContest = runnerHasAffordableRemoteContest(
    input,
    features,
  );
  const runTarget = targetServerId(input, candidate);
  const runPath = runTarget
    ? runnerKnownPathEstimate(input, runTarget, features)
    : undefined;
  let score = 0;
  const reasons: string[] = [];

  if (candidate.kind === "recover_economy" && belowReserve) {
    score += immediateOpenRemoteThreat
      ? 60
      : affordableRemoteContest
        ? -60
        : remoteThreatVisible
          ? 320
          : 210;
    reasons.push(
      remoteThreatVisible
        ? "economy_before_remote_contest"
        : "build_cash_reserve",
    );
  }

  if (isRunPlan(candidate.kind) && runPath) {
    if (runPath.blocked) {
      if (runPath.remoteScoreThreat) {
        score -= 220;
        reasons.push("emergency_run_known_path_unaffordable");
      } else {
        score -= 760;
        reasons.push("known_path_unaffordable");
      }
    } else if (
      runPath.creditsAfterPath < reserveTarget &&
      !(runPath.remoteScoreThreat && runPath.visibleBreakCost === 0)
    ) {
      const centralRun =
        runTarget === "hq" || runTarget === "rd" || runTarget === "archives";
      if (runPath.remoteScoreThreat) {
        score -= 170;
        reasons.push("save_for_steal_or_trash");
      } else if (
        centralRun &&
        !remoteThreatVisible &&
        runnerTwoTurnIntentReadyForCandidate(input, candidate)
      ) {
        score += 45;
        reasons.push("two_turn_central_run_ready");
      } else if (centralRun && remoteThreatVisible) {
        score -= 300;
        reasons.push("delay_low_value_central_run");
      } else {
        score -= 100;
        reasons.push("preserve_contest_reserve");
      }
    } else if (runPath.remoteScoreThreat) {
      score += runPath.visibleBreakCost === 0 ? 240 : 115;
      reasons.push(
        runPath.visibleBreakCost === 0
          ? "contest_immediate_score_threat"
          : "run_when_reserve_sufficient",
      );
    }
    if (
      runTarget !== undefined &&
      runTarget.startsWith("remote_") &&
      runPath.remoteScoreThreat
    ) {
      const postRunTarget = runnerPostRunReserveTargetForRemote(
        input,
        runTarget,
        features,
      );
      if (!runPath.blocked && runPath.creditsAfterPath < postRunTarget) {
        score -= 520;
        reasons.push("preserve_credits_for_steal_or_trash");
      } else if (!runPath.blocked) {
        score += 120;
        reasons.push("remote_run_if_post_run_reserve_sufficient");
      }
    }
  }

  if (candidate.kind === "build_rig") {
    const bestInstallRemaining = bestRemainingCreditsForCandidateActions(
      input,
      candidate,
      (action) => action.type === "install_card",
    );
    const unlocksKnownRun = candidate.legalActionIds
      .map((actionId) =>
        input.legalActions.find((action) => action.actionId === actionId),
      )
      .some(
        (action) =>
          action?.type === "install_card" &&
          rolesForAction(input, action).some((role) =>
            role.startsWith("breaker_"),
          ) &&
          features.blockedRunServers.size > 0,
      );
    const redundantLowValue = candidate.legalActionIds
      .map((actionId) =>
        input.legalActions.find((action) => action.actionId === actionId),
      )
      .some((action): action is LegalAction =>
        Boolean(action && isRunnerLowValueDuplicateInstall(input, action)),
      );
    if (unlocksKnownRun) {
      score += 150;
      reasons.push("install_breaker_if_it_unlocks_runs");
    }
    if (
      Number.isFinite(bestInstallRemaining) &&
      bestInstallRemaining < reserveTarget &&
      belowReserve &&
      !unlocksKnownRun
    ) {
      score -= redundantLowValue ? 360 : 210;
      reasons.push(
        redundantLowValue
          ? "delay_low_value_install"
          : "avoid_spending_below_contest_floor",
      );
    }
  }

  if (candidate.kind === "trash_asset") {
    const remainingCredits = bestRemainingCreditsForCandidateActions(
      input,
      candidate,
      (action) => action.type === "trash_accessed_card",
    );
    const context = currentRemoteTrashAccessContext(input);
    if (
      remainingCredits < Math.max(1, reserveTarget - 3) &&
      context.role === "low_value"
    ) {
      score -= 240;
      reasons.push("do_not_trash_low_value_card");
    }
  }

  return {
    score,
    reasons,
    evidence: [
      `runner_credit_reserve_target:${reserveTarget}`,
      `runner_credits:${features.credits}`,
      `runner_below_reserve:${belowReserve}`,
      `remote_score_threat_visible:${remoteThreatVisible}`,
      `immediate_open_remote_threat:${immediateOpenRemoteThreat}`,
      `affordable_remote_contest:${affordableRemoteContest}`,
      `known_path_target:${runTarget ?? "none"}`,
      `known_path_cost:${runPath?.visibleBreakCost ?? "none"}`,
      `known_path_blocked:${runPath?.blocked ?? false}`,
      `known_path_credits_after:${runPath?.creditsAfterPath ?? "none"}`,
    ],
  };
}

function runnerTwoTurnIntentReadyForCandidate(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
): boolean {
  const intent = evaluateRunnerTwoTurnRunIntent(input, candidate);
  return intent.evidence.includes("two_turn_run_intent_ready:true");
}

function runnerCreditReserveTargetForPlanInput(
  input: AiDecisionInput,
  features: RunnerFeatures = extractRunnerFeatures(input),
): number {
  let target = 4;
  for (const server of input.playerView.servers) {
    if (!server.id.startsWith("remote_")) continue;
    const visibleBreakCost = features.visibleRunBreakCosts.get(server.id) ?? 0;
    const hasScoreThreat = remoteServerHasVisibleScoreThreat(input, server.id);
    const relevantTrashCosts = server.root
      .filter((card) => card.known)
      .filter((card) => {
        const role = remoteTrashRoleForCard(card);
        return role !== "low_value" && role !== "unknown";
      })
      .map((card) => remoteRootTrashCost(card))
      .filter((cost): cost is number => typeof cost === "number");
    const cheapestRelevantTrash =
      relevantTrashCosts.length > 0 ? Math.min(...relevantTrashCosts) : 0;
    const visibleStealTax = server.root.some(
      (card) =>
        card.known &&
        rolesForCardId(card.definitionId).some(
          (role) =>
            role.includes("agenda_steal_tax") ||
            role.includes("remote_upgrade_tax") ||
            role.includes("access_tax"),
        ),
    )
      ? 5
      : 0;
    if (hasScoreThreat)
      target = Math.max(target, visibleBreakCost + 3 + visibleStealTax);
    if (cheapestRelevantTrash > 0)
      target = Math.max(target, visibleBreakCost + cheapestRelevantTrash + 1);
  }
  return Math.min(12, Math.max(2, Math.ceil(target)));
}

function runnerKnownPathEstimate(
  input: AiDecisionInput,
  serverId: string,
  features: RunnerFeatures = extractRunnerFeatures(input),
):
  | {
      visibleBreakCost: number;
      creditsAfterPath: number;
      blocked: boolean;
      canReachAccess: boolean;
      knownPathBlockedByUnbreakableIce: boolean;
      knownPathBlockedByMissingCoverage: boolean;
      knownPathBlockedByEtr: boolean;
      canBreakNextIceButNotFullPath: boolean;
      unpayableReason?: KnownRezzedIcePathAssessment["unpayableReason"];
      noAccessReason?: KnownRezzedIcePathAssessment["noAccessReason"];
      creditsSpentBeforeUnpayableIce: number;
      remoteScoreThreat: boolean;
    }
  | undefined {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) return undefined;
  const assessment = assessKnownRezzedIcePath(
    server.ice,
    input.playerView.own.rig ?? [],
    input.playerView.own.credits,
    server.root,
  );
  const visibleBreakCost =
    assessment.visibleBreakCost ??
    features.visibleRunBreakCosts.get(serverId) ??
    0;
  return {
    visibleBreakCost,
    creditsAfterPath: assessment.creditsAfterPath,
    blocked: assessment.blocked || features.blockedRunServers.has(serverId),
    canReachAccess:
      assessment.canReachAccess && !features.blockedRunServers.has(serverId),
    knownPathBlockedByUnbreakableIce:
      assessment.knownPathBlockedByUnbreakableIce,
    knownPathBlockedByMissingCoverage:
      assessment.knownPathBlockedByMissingCoverage,
    knownPathBlockedByEtr: assessment.knownPathBlockedByEtr,
    canBreakNextIceButNotFullPath: assessment.canBreakNextIceButNotFullPath,
    ...(assessment.unpayableReason
      ? { unpayableReason: assessment.unpayableReason }
      : {}),
    ...(assessment.noAccessReason
      ? { noAccessReason: assessment.noAccessReason }
      : {}),
    creditsSpentBeforeUnpayableIce: assessment.creditsSpentBeforeUnpayableIce,
    remoteScoreThreat:
      serverId.startsWith("remote_") &&
      remoteServerHasVisibleScoreThreat(input, serverId),
  };
}

function runnerHasVisibleRemoteScoreThreat(input: AiDecisionInput): boolean {
  return input.playerView.servers.some(
    (server) =>
      server.id.startsWith("remote_") &&
      remoteServerHasVisibleScoreThreat(input, server.id),
  );
}

function runnerHasImmediateOpenRemoteScoreThreat(
  input: AiDecisionInput,
  features: RunnerFeatures = extractRunnerFeatures(input),
): boolean {
  return input.legalActions.some((action) => {
    if (
      action.type !== "start_run" ||
      typeof action.payload?.serverId !== "string" ||
      !action.payload.serverId.startsWith("remote_") ||
      !remoteServerHasVisibleScoreThreat(input, action.payload.serverId)
    )
      return false;
    const estimate = runnerKnownPathEstimate(
      input,
      action.payload.serverId,
      features,
    );
    return (
      estimate !== undefined &&
      !estimate.blocked &&
      estimate.visibleBreakCost === 0
    );
  });
}

function runnerHasAffordableRemoteContest(
  input: AiDecisionInput,
  features: RunnerFeatures = extractRunnerFeatures(input),
): boolean {
  if (features.credits < 3) return false;
  return input.legalActions.some((action) => {
    if (
      action.type !== "start_run" ||
      typeof action.payload?.serverId !== "string" ||
      !action.payload.serverId.startsWith("remote_")
    )
      return false;
    const server = input.playerView.servers.find(
      (candidate) => candidate.id === action.payload?.serverId,
    );
    if (!server || server.root.length === 0) return false;
    const estimate = runnerKnownPathEstimate(
      input,
      action.payload.serverId,
      features,
    );
    return estimate !== undefined && !estimate.blocked;
  });
}

function bestCitySurveillanceDrawProjection(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
): CitySurveillanceDrawProjection {
  const projections = candidate.legalActionIds
    .map((actionId) =>
      input.legalActions.find((action) => action.actionId === actionId),
    )
    .filter(
      (action): action is LegalAction =>
        action !== undefined && action.type === "draw_card",
    )
    .map(citySurveillanceDrawProjectionForAction)
    .filter((projection) => projection.sourceCount > 0)
    .sort(
      (left, right) =>
        left.tagsAdded - right.tagsAdded ||
        left.creditsPaid - right.creditsPaid ||
        left.decision.localeCompare(right.decision),
    );
  return (
    projections[0] ?? {
      sourceCount: 0,
      creditsPaid: 0,
      tagsAdded: 0,
      decision: "none",
    }
  );
}

function citySurveillanceDrawProjectionForAction(
  action: LegalAction,
): CitySurveillanceDrawProjection {
  const sourceCount = Number(action.payload?.citySurveillanceSourceCount ?? 0);
  if (!Number.isFinite(sourceCount) || sourceCount <= 0) {
    return { sourceCount: 0, creditsPaid: 0, tagsAdded: 0, decision: "none" };
  }
  const creditsPaid = Number(
    action.payload?.citySurveillanceProjectedCreditsPaid ?? 0,
  );
  const tagsAdded = Number(
    action.payload?.citySurveillanceProjectedTagsAdded ?? 0,
  );
  const decision =
    action.payload?.citySurveillanceDrawDecision === "pay" ? "pay" : "tag";
  return {
    sourceCount,
    creditsPaid: Number.isFinite(creditsPaid) ? creditsPaid : 0,
    tagsAdded: Number.isFinite(tagsAdded) ? tagsAdded : 0,
    decision,
  };
}

function inferRunnerTwoTurnRunIntent(
  input: AiDecisionInput,
): RunnerTwoTurnRunIntent | undefined {
  if (
    input.side !== "runner" ||
    input.playerView.phase !== "runner_action_phase"
  )
    return undefined;
  const features = extractRunnerFeatures(input);
  const visibleBreakerRoles = [...features.rigRoles]
    .filter((role) => role.startsWith("breaker_"))
    .sort();
  if (visibleBreakerRoles.length === 0) return undefined;
  const legalRunTargets = new Set(
    input.legalActions
      .filter(
        (action) =>
          action.type === "start_run" &&
          typeof action.payload?.serverId === "string",
      )
      .map((action) => String(action.payload?.serverId)),
  );
  const candidates = [...legalRunTargets]
    .map((serverId) => {
      const server = features.serverFeatures.get(serverId);
      const visibleBreakCost = features.visibleRunBreakCosts.get(serverId);
      if (!server || visibleBreakCost === undefined || visibleBreakCost <= 0)
        return undefined;
      if (!isStrategicTwoTurnRunTarget(serverId, server)) return undefined;
      const thresholdCredits = Math.max(1, Math.ceil(visibleBreakCost));
      const creditsNeeded = Math.max(0, thresholdCredits - features.credits);
      const ready = creditsNeeded === 0;
      if (!ready && creditsNeeded > 3) return undefined;
      return {
        intent: {
          targetServerId: serverId,
          thresholdCredits,
          visibleBreakCost,
          creditsNeeded,
          ready,
          stateKey: [
            serverId,
            `credits:${features.credits}`,
            `break:${visibleBreakCost}`,
            `ice:${server.iceCount}`,
            `rezzed:${server.rezzedIceCount}`,
            `rig:${visibleBreakerRoles.join(",") || "none"}`,
          ].join("|"),
        },
        priority:
          twoTurnRunTargetPriority(serverId, server) +
          (ready ? 40 : Math.max(0, 4 - creditsNeeded) * 20) -
          visibleBreakCost * 4,
      };
    })
    .filter(
      (
        candidate,
      ): candidate is { intent: RunnerTwoTurnRunIntent; priority: number } =>
        Boolean(candidate),
    )
    .sort(
      (left, right) =>
        right.priority - left.priority ||
        left.intent.targetServerId.localeCompare(right.intent.targetServerId),
    );
  return candidates[0]?.intent;
}

function isStrategicTwoTurnRunTarget(
  serverId: string,
  server: RunnerServerFeatures,
): boolean {
  if (serverId === "rd" || serverId === "hq") return true;
  return serverId.startsWith("remote_") && server.rootCount > 0;
}

function twoTurnRunTargetPriority(
  serverId: string,
  server: RunnerServerFeatures,
): number {
  if (serverId.startsWith("remote_"))
    return 120 + server.rootCount * 35 + server.advancedRootCount * 45;
  if (serverId === "rd") return 100;
  if (serverId === "hq") return 85;
  if (serverId === "archives") return 35;
  return 0;
}

function evaluateVisibleBreakerPlan(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
): RunnerPlanEvaluatorResult {
  const pressure = assessVisibleBreakerPressure(input);
  const target = targetServerId(input, candidate);
  if (pressure.blockedServerIds.size === 0) {
    return {
      score: 0,
      reasons: [],
      evidence: ["visible_breaker_pressure:false"],
    };
  }
  let score = 0;
  const reasons: string[] = [];
  const hasCandidateSearch = candidate.legalActionIds.some((actionId) =>
    pressure.searchActionIds.has(actionId),
  );
  const hasCandidateRecovery = candidate.legalActionIds.some((actionId) =>
    pressure.recoveryActionIds.has(actionId),
  );
  const needsCreditsForCoverage =
    pressure.requiredCoverageCredits > input.playerView.own.credits;
  if (candidate.kind === "build_rig") {
    if (
      candidate.legalActionIds.some((actionId) =>
        pressure.matchingInstallActionIds.has(actionId),
      )
    ) {
      score += 380;
      reasons.push("visible_matching_breaker_install_available");
    } else if (hasCandidateRecovery && !needsCreditsForCoverage) {
      score += 330;
      reasons.push("visible_missing_breaker_recovery_available");
    } else if (hasCandidateSearch && !needsCreditsForCoverage) {
      score += 310;
      reasons.push("visible_missing_breaker_search_available");
    } else if (hasCandidateSearch || hasCandidateRecovery) {
      score += 95;
      reasons.push("visible_missing_breaker_search_needs_credits");
    } else if (pressure.matchingGripBreakerCount > 0) {
      score += 120;
      reasons.push("visible_matching_breaker_in_grip");
    }
  }
  if (
    candidate.kind === "recover_economy" &&
    ((pressure.matchingGripBreakerCount > 0 &&
      pressure.matchingInstallActionIds.size === 0) ||
      pressure.searchActionIds.size > 0 ||
      pressure.recoveryActionIds.size > 0) &&
    needsCreditsForCoverage
  ) {
    score += 240;
    reasons.push("visible_matching_breaker_needs_credits");
  }
  if (
    candidate.kind === "draw_for_answers" &&
    pressure.matchingGripBreakerCount === 0 &&
    pressure.searchActionIds.size === 0 &&
    pressure.recoveryActionIds.size === 0 &&
    pressure.missingAnswerCount > 0
  ) {
    score += 170;
    reasons.push("visible_blocker_needs_draw_or_search");
  }
  if (
    target &&
    pressure.blockedServerIds.has(target) &&
    isRunPlan(candidate.kind)
  ) {
    score -= 180;
    reasons.push("visible_blocker_requires_intermediate_plan");
  }
  return {
    score,
    reasons,
    evidence: [
      `visible_breaker_pressure:true`,
      `visible_blocked_servers:${pressure.blockedServerIds.size}`,
      `known_ice_blocked_servers:${pressure.knownIceBlockedServerIds.size}`,
      `missing_ice_definitions:${pressure.missingIceDefinitionIds.size}`,
      `missing_breaker_roles:${pressure.missingBreakerRoles.size}`,
      `matching_grip_breakers:${pressure.matchingGripBreakerCount}`,
      `structured_matching_grip_breakers:${pressure.ontologyMatchingGripBreakerCount}`,
      `matching_install_actions:${pressure.matchingInstallActionIds.size}`,
      `coverage_search_actions:${pressure.searchActionIds.size}`,
      `coverage_recovery_actions:${pressure.recoveryActionIds.size}`,
      `heap_matching_breakers:${pressure.heapMatchingBreakerCount}`,
      `structured_heap_matching_breakers:${pressure.ontologyHeapMatchingBreakerCount}`,
      `deck_breaker_answers:${pressure.deckAnswerCount}`,
      `missing_breaker_answers:${pressure.missingAnswerCount}`,
      `coverage_required_credits:${pressure.requiredCoverageCredits}`,
      `coverage_needs_credits:${needsCreditsForCoverage}`,
      `visible_breaker_target:${target ?? "none"}`,
    ],
  };
}

function evaluateRunnerPhaseExitPressure(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
  beliefState: BeliefState,
): RunnerPlanEvaluatorResult {
  if (input.difficulty === "easy") {
    return {
      score: 0,
      reasons: [],
      evidence: ["runner_phase_exit_disabled_for_easy:true"],
    };
  }
  const features = extractRunnerFeatures(input);
  const assessment = assessRunnerPressureReady(input, beliefState, features);
  const bestTarget = assessment.readyTargets[0];
  const phaseExitActive = runnerPhaseExitPressureActive(input, assessment);
  const target = targetServerId(input, candidate);
  const matchesReadyTarget = Boolean(
    phaseExitActive &&
    target &&
    bestTarget &&
    assessment.readyTargets.some(
      (ready) =>
        ready.targetServerId === target && ready.planKind === candidate.kind,
    ),
  );
  const setupContinuation = runnerSetupContinuationCandidate(input, candidate);
  let score = 0;
  const reasons: string[] = [];
  if (matchesReadyTarget) {
    score += bestTarget?.targetType === "remote" ? 230 : 170;
    reasons.push("phase_exit_pressure_ready");
  } else if (
    phaseExitActive &&
    assessment.readyTargets.length > 0 &&
    setupContinuation &&
    !(
      candidate.kind === "recover_economy" &&
      (runnerStillNeedsEconomyForVisibleContestOrTrash(input, features) ||
        runnerNeedsEconomyForKnownRemoteTrash(input, features))
    )
  ) {
    score -= candidate.kind === "build_rig" ? 80 : 125;
    reasons.push("phase_exit_suppress_setup_after_pressure_ready");
  }
  return {
    score,
    reasons,
    evidence: [
      `runner_pressure_ready_windows:${assessment.broadReady ? 1 : 0}`,
      `runner_pressure_ready_true:${assessment.readyTargets.length > 0}`,
      `runner_pressure_ready_false_positive:${assessment.falsePositive}`,
      `runner_pressure_ready_targets:${assessment.readyTargets.length}`,
      `runner_pressure_ready_best:${bestTarget?.targetServerId ?? "none"}`,
      `runner_pressure_ready_best_type:${bestTarget?.targetType ?? "none"}`,
      `runner_pressure_ready_reason:${bestTarget?.reason ?? "none"}`,
      `runner_phase_exit_active:${phaseExitActive}`,
      `runner_phase_exit_candidate_target:${target ?? "none"}`,
      `runner_phase_exit_matches_pressure:${matchesReadyTarget}`,
      `runner_phase_exit_setup_continuation:${setupContinuation}`,
      `runner_pressure_skipped_reason:${[...assessment.blockers].join("|") || "none"}`,
    ],
  };
}

function runnerNeedsEconomyForKnownRemoteTrash(
  input: AiDecisionInput,
  features: RunnerFeatures,
): boolean {
  return input.playerView.servers.some((server) => {
    if (!server.id.startsWith("remote_")) return false;
    const estimate = runnerKnownPathEstimate(input, server.id, features);
    if (!estimate || estimate.blocked) return false;
    return server.root.some((card) => {
      const trashCost = remoteRootTrashCost(card);
      if (trashCost === undefined) return false;
      const role = remoteTrashRoleForCard(card);
      return (
        role !== "low_value" &&
        role !== "unknown" &&
        estimate.creditsAfterPath < trashCost + 1
      );
    });
  });
}

function runnerPhaseExitPressureActive(
  input: AiDecisionInput,
  assessment: RunnerPressureReadyAssessment,
): boolean {
  if (assessment.readyTargets.length === 0) return false;
  if (assessment.readyTargets.some((target) => target.targetType === "remote"))
    return true;
  const outcome = reconstructRunnerOutcomeFollowup(input);
  return (
    outcome?.kind === "economy_or_rig_ready" &&
    outcome.ownStrategicDecisionCount <= 2
  );
}

function assessRunnerPressureReady(
  input: AiDecisionInput,
  beliefState: BeliefState,
  features: RunnerFeatures = extractRunnerFeatures(input),
): RunnerPressureReadyAssessment {
  const blockers = new Set<RunnerPressureReadyBlocker>();
  const readyTargets: RunnerPressureReadyTarget[] = [];
  let broadReady = false;
  const seen = new Set<string>();
  for (const action of input.legalActions) {
    if (
      action.type !== "start_run" ||
      typeof action.payload?.serverId !== "string"
    )
      continue;
    const targetServerId = action.payload.serverId;
    if (seen.has(targetServerId)) continue;
    seen.add(targetServerId);
    const estimate = runnerKnownPathEstimate(input, targetServerId, features);
    if (!estimate) continue;
    if (!estimate.blocked) broadReady = true;
    const server = input.playerView.servers.find(
      (candidate) => candidate.id === targetServerId,
    );
    if (!server) continue;
    if (estimate.blocked) {
      if (estimate.visibleBreakCost > input.playerView.own.credits)
        blockers.add("insufficient_credits");
      else blockers.add("no_valuable_target");
      continue;
    }
    const target = runnerPressureReadyTargetForServer(
      input,
      targetServerId,
      server,
      estimate,
      features,
      beliefState,
    );
    if (target) readyTargets.push(target);
    else blockers.add("no_valuable_target");
  }
  readyTargets.sort(
    (left, right) =>
      right.priority - left.priority ||
      left.targetServerId.localeCompare(right.targetServerId),
  );
  return {
    broadReady,
    readyTargets,
    falsePositive: broadReady && readyTargets.length === 0,
    blockers,
  };
}

function runnerPressureReadyTargetForServer(
  input: AiDecisionInput,
  targetServerId: string,
  server: AiDecisionInput["playerView"]["servers"][number],
  estimate: NonNullable<ReturnType<typeof runnerKnownPathEstimate>>,
  features: RunnerFeatures,
  beliefState: BeliefState,
): RunnerPressureReadyTarget | undefined {
  if (estimate.creditsAfterPath < 0) return undefined;
  if (targetServerId.startsWith("remote_")) {
    const profile = runnerRemoteContestProfile(input, targetServerId, features);
    const remoteValue =
      profile.contestable ||
      (profile.relevantTrash &&
        !profile.blockedByBreakerCoverage &&
        !profile.blockedByKnownIceCost &&
        !profile.blockedByPostRunReserve);
    if (!remoteValue) return undefined;
    return {
      targetServerId,
      targetType: "remote",
      planKind: "contest_remote",
      visibleBreakCost: estimate.visibleBreakCost,
      creditsAfterPath: estimate.creditsAfterPath,
      reason: profile.contestable ? "remote_contest" : "remote_trash",
      priority:
        260 +
        (profile.advanced ? 100 : 0) +
        (profile.relevantTrash ? 55 : 0) -
        estimate.visibleBreakCost * 8,
    };
  }
  if (
    targetServerId !== "hq" &&
    targetServerId !== "rd" &&
    targetServerId !== "archives"
  )
    return undefined;
  const centralTarget = targetServerId as "hq" | "rd" | "archives";
  if (estimate.creditsAfterPath < 1) return undefined;
  if (!centralPressureTargetIsGood(input, centralTarget, features, beliefState))
    return undefined;
  const targetType = targetServerId === "rd" ? "rnd" : targetServerId;
  const planKind =
    targetServerId === "rd"
      ? "pressure_rnd"
      : targetServerId === "hq"
        ? "pressure_hq"
        : "safe_probe_run";
  return {
    targetServerId,
    targetType,
    planKind,
    visibleBreakCost: estimate.visibleBreakCost,
    creditsAfterPath: estimate.creditsAfterPath,
    reason: runnerCentralCloseoutProfile(input, centralTarget, beliefState)
      .opportunity
      ? "central_closeout"
      : "central_fresh_pressure",
    priority:
      (targetServerId === "rd" ? 210 : targetServerId === "hq" ? 190 : 120) -
      estimate.visibleBreakCost * 8 +
      (server.ice.length === 0 ? 35 : 0),
  };
}

function runnerSetupContinuationCandidate(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
): boolean {
  if (
    candidate.kind === "recover_economy" ||
    candidate.kind === "draw_for_answers"
  )
    return true;
  if (candidate.kind !== "build_rig") return false;
  return candidate.legalActionIds.some((actionId) => {
    const action = input.legalActions.find(
      (candidateAction) => candidateAction.actionId === actionId,
    );
    if (!action) return false;
    return (
      action.type === "install_card" ||
      runnerCoverageSearchAction(input, action) ||
      Boolean(classifyShellTradersAction(input, action))
    );
  });
}

export function evaluateRunnerEarlyTurnDoctrine(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
): RunnerPlanEvaluatorResult {
  const doctrine = input.ownDeckDoctrine;
  if (!doctrine || doctrine.side !== "runner") {
    return { score: 0, reasons: [], evidence: ["early_turn_doctrine:none"] };
  }
  const earlyTurn = isEarlyRunnerTurn(input);
  const features = extractRunnerFeatures(input);
  const rigBreakerCount = [...features.rigRoles].filter((role) =>
    role.startsWith("breaker_"),
  ).length;
  const handBreakerCount = [...features.handRoles].filter((role) =>
    role.startsWith("breaker_"),
  ).length;
  const handEconomyCount = [...features.handRoles].filter(
    (role) => role === "economy" || role === "tempo" || role === "draw",
  ).length;
  const target = targetServerId(input, candidate);
  const visibleIce = target
    ? (features.serverFeatures.get(target)?.iceCount ?? 0)
    : 0;
  const tags = doctrine.archetypeTags.slice(0, 3);
  const tagSet = new Set(tags);
  let score = 0;
  const reasons: string[] = [];

  if (earlyTurn && tagSet.has("rig_builder")) {
    if (
      candidate.kind === "build_rig" &&
      rigBreakerCount === 0 &&
      handBreakerCount > 0
    ) {
      score += 70;
      reasons.push("early_rig_builder_setup");
    }
    if (candidate.kind === "recover_economy" && features.credits < 4) {
      score += 45;
      reasons.push("early_rig_builder_credit_floor");
    }
    if (
      (candidate.kind === "pressure_rnd" || candidate.kind === "pressure_hq") &&
      rigBreakerCount === 0 &&
      (visibleIce > 0 || features.credits < 4)
    ) {
      score -= 50;
      reasons.push("early_rig_builder_pressure_not_ready");
    }
  }

  if (earlyTurn && tagSet.has("economy_dense")) {
    if (
      candidate.kind === "recover_economy" &&
      (features.credits < 5 || handEconomyCount > 0)
    ) {
      score += 55;
      reasons.push("early_economy_dense_reserve");
    }
    if (candidate.kind === "draw_for_answers" && handBreakerCount === 0) {
      score += 25;
      reasons.push("early_economy_dense_find_setup");
    }
    if (
      isRunPlan(candidate.kind) &&
      rigBreakerCount === 0 &&
      features.credits < 4
    ) {
      score -= 35;
      reasons.push("early_economy_dense_run_paced");
    }
  }

  if (
    earlyTurn &&
    tagSet.has("rnd_pressure") &&
    candidate.kind === "pressure_rnd"
  ) {
    const pressureReady =
      features.credits >= 3 && (rigBreakerCount > 0 || visibleIce === 0);
    score += pressureReady ? 40 : -50;
    reasons.push(
      pressureReady
        ? "early_rnd_pressure_ready"
        : "early_rnd_pressure_not_ready",
    );
  }
  if (
    earlyTurn &&
    tagSet.has("hq_pressure") &&
    candidate.kind === "pressure_hq"
  ) {
    const pressureReady =
      features.credits >= 3 && (rigBreakerCount > 0 || visibleIce === 0);
    score += pressureReady ? 40 : -50;
    reasons.push(
      pressureReady ? "early_hq_pressure_ready" : "early_hq_pressure_not_ready",
    );
  }
  if (
    earlyTurn &&
    tagSet.has("remote_contest") &&
    candidate.kind === "contest_remote"
  ) {
    const server = target ? features.serverFeatures.get(target) : undefined;
    const pressureReady =
      features.credits >= 3 &&
      ((server?.advancedRootCount ?? 0) > 0 ||
        rigBreakerCount > 0 ||
        visibleIce === 0);
    score += pressureReady ? 35 : -45;
    reasons.push(
      pressureReady
        ? "early_remote_contest_ready"
        : "early_remote_contest_not_ready",
    );
  }

  return {
    score,
    reasons,
    evidence: [
      `early_turn:${earlyTurn}`,
      `early_turn_doctrine:${tags.join(",") || "neutral"}`,
      `early_turn_score:${score}`,
      `early_rig_breakers:${rigBreakerCount}`,
      `early_hand_breakers:${handBreakerCount}`,
      `early_hand_economy:${handEconomyCount}`,
      `early_credits:${features.credits}`,
      `early_visible_ice:${visibleIce}`,
    ],
  };
}

export function evaluateRunnerRig(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
): RunnerPlanEvaluatorResult {
  const features = extractRunnerFeatures(input);
  const breakerCount = [...features.rigRoles].filter((role) =>
    role.startsWith("breaker_"),
  ).length;
  const handBreakerRoles = [...features.handRoles].filter((role) =>
    role.startsWith("breaker_"),
  );
  const reservePenalty =
    candidate.kind === "build_rig"
      ? lowReserveInstallPenalty(input, candidate, features.credits)
      : 0;
  const centralPressurePenalty = centralPressureWithoutRigPenalty(
    input,
    candidate,
    features,
    breakerCount,
  );
  const score =
    candidate.kind === "build_rig"
      ? 150 +
        Math.max(0, 3 - breakerCount) * 45 +
        (features.memoryRemaining <= 1 ? 35 : 0) -
        reservePenalty
      : isRunPlan(candidate.kind)
        ? breakerCount * 30 -
          Math.max(0, 2 - features.credits) * 30 -
          centralPressurePenalty
        : handBreakerRoles.length * 8;
  return {
    score,
    reasons: sortedUnique([
      breakerCount > 0
        ? "visible_rig_has_breaker_roles"
        : "visible_rig_incomplete",
      ...(reservePenalty > 0 ? ["credit_reserve_after_install_low"] : []),
      ...(centralPressurePenalty > 0 ? ["central_pressure_underprepared"] : []),
    ]),
    evidence: [
      `rig_breakers:${breakerCount}`,
      `hand_breaker_roles:${handBreakerRoles.length}`,
      `memory_remaining:${features.memoryRemaining}`,
      `credits:${features.credits}`,
      `central_pressure_penalty:${centralPressurePenalty}`,
    ],
  };
}

function centralPressureWithoutRigPenalty(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
  features: RunnerFeatures,
  breakerCount: number,
): number {
  if (candidate.kind !== "pressure_rnd" && candidate.kind !== "pressure_hq")
    return 0;
  if (
    input.playerView.opponent.agendaPoints >=
    input.playerView.agendaPointsToWin - 2
  )
    return 0;
  const target = targetServerId(input, candidate);
  if (target !== "rd" && target !== "hq") return 0;
  const centralIceCount = features.serverFeatures.get(target)?.iceCount ?? 0;
  if (breakerCount === 0) {
    if (features.credits <= 1) return 240;
    if (features.credits === 2) return 180;
    if (features.credits === 3) return centralIceCount > 0 ? 230 : 120;
    return 0;
  }
  if (features.credits <= 1) return centralIceCount > 0 ? 230 : 170;
  if (features.credits === 2) return 70;
  return 0;
}

export function estimateRunCost(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
): RunnerPlanEvaluatorResult {
  const features = extractRunnerFeatures(input);
  const target = targetServerId(input, candidate);
  const server = target ? features.serverFeatures.get(target) : undefined;
  const blocked = target ? features.blockedRunServers.has(target) : false;
  const visibleBreakCost = target
    ? features.visibleRunBreakCosts.get(target)
    : undefined;
  const fullPathAssessment = target
    ? features.visibleRunFullPathAssessments.get(target)
    : undefined;
  const knownNoAccess =
    fullPathAssessment?.canReachAccess === false &&
    fullPathAssessment.assessedKnownIceCount > 0;
  const knownUnbreakableNoAccess =
    knownNoAccess &&
    runnerKnownPathAssessmentIsUnbreakableNoAccess(fullPathAssessment);
  const knownUnrezzedIceAdjustment = knownUnrezzedIceCostAdjustment(
    input,
    target,
    beliefStateForCost(input),
  );
  const rezzedIce = server?.rezzedIceCount ?? 0;
  const breakCostPressure =
    visibleBreakCost === undefined
      ? 0
      : visibleBreakCost * 18 +
        Math.max(0, visibleBreakCost - features.credits) * 55;
  const knownIcePressure =
    knownUnrezzedIceAdjustment.cost * 16 +
    (knownUnrezzedIceAdjustment.blocked ? 420 : 0);
  const score =
    candidate.kind === "recover_economy"
      ? features.credits < 4
        ? 120
        : 40
      : blocked
        ? knownNoAccess
          ? -50000
          : -520
        : Math.max(
            -180,
            90 -
              rezzedIce * 55 -
              Math.max(0, 3 - features.credits) * 35 -
              breakCostPressure -
              knownIcePressure,
          );
  return {
    score,
    reasons: blocked
      ? [
          "run_blocked_by_visible_rezzed_ice",
          knownUnbreakableNoAccess
            ? "visible_ice_unbreakable_missing_coverage"
            : "visible_ice_unaffordable_to_break",
          ...(knownNoAccess ? ["known_full_path_no_access"] : []),
          ...(knownUnbreakableNoAccess
            ? ["known_unbreakable_path_no_access"]
            : []),
          ...(fullPathAssessment?.canBreakNextIceButNotFullPath
            ? ["can_break_next_ice_but_not_full_path"]
            : []),
        ]
      : ["run_cost_from_visible_ice"],
    evidence: [
      `target:${target ?? "none"}`,
      `rezzed_ice:${rezzedIce}`,
      `blocked:${blocked}`,
      `credit_reserve:${features.credits}`,
      `visible_etr_break_cost:${visibleBreakCost ?? "unavailable"}`,
      `known_path_can_reach_access:${fullPathAssessment?.canReachAccess ?? "unknown"}`,
      `known_path_credits_after_full_path:${fullPathAssessment?.creditsAfterPath ?? "unknown"}`,
      `known_path_unpayable_reason:${fullPathAssessment?.unpayableReason ?? "none"}`,
      `known_path_no_access_reason:${fullPathAssessment?.noAccessReason ?? "none"}`,
      `known_path_missing_coverage:${fullPathAssessment?.missingCoverage?.join("|") ?? "none"}`,
      `known_path_can_break_next_not_full:${fullPathAssessment?.canBreakNextIceButNotFullPath ?? false}`,
      ...knownUnrezzedIceAdjustment.evidence,
    ],
  };
}

export function evaluateServerAccessValue(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
  beliefState: BeliefState = reconstructBeliefState(input),
): RunnerPlanEvaluatorResult {
  const features = extractRunnerFeatures(input);
  const target = targetServerId(input, candidate);
  const server = target ? features.serverFeatures.get(target) : undefined;
  const history = publicServerMentions(input, target);
  const freshness = beliefState.runnerOpponentModel?.rndTopFreshness;
  const hqHandMemory = beliefState.runnerOpponentModel?.hqHandMemory;
  const blocked =
    target && isRunPlan(candidate.kind)
      ? features.blockedRunServers.has(target)
      : false;
  const staleArchivesPenalty = staleArchivesRepeatPenalty(
    input,
    target,
    server,
  );
  const evidence = [
    `target:${target ?? "none"}`,
    `ice_count:${server?.iceCount ?? 0}`,
    `root_count:${server?.rootCount ?? 0}`,
    `known_root_count:${server?.knownRootCount ?? 0}`,
    `server_history:${history}`,
    `rnd_freshness:${freshness?.freshness ?? "unknown"}`,
    `hq_hand_known:${hqHandMemory?.allCardsKnown === true ? "all" : hqHandMemory && hqHandMemory.knownCount > 0 ? "partial" : "unknown"}`,
    `hq_known_count:${hqHandMemory?.knownCount ?? 0}`,
    `hq_hand_count:${hqHandMemory?.handCount ?? input.playerView.opponent.handCount}`,
  ];
  if (blocked) {
    return {
      score: -160,
      reasons: ["visible_run_path_blocked"],
      evidence,
    };
  }
  const staleRndPenalty = staleKnownRndPlanPenalty(
    candidate,
    target,
    freshness,
  );
  const rndMemoryValue = evaluateKnownRndRunMemoryValue(
    input,
    candidate,
    target,
    freshness,
  );
  const hqMemoryValue = evaluateKnownHqRunMemoryValue(
    input,
    candidate,
    target,
    hqHandMemory,
  );
  const lowValueKnownHq = hqMemoryValue.fullyKnownNoAgenda;
  const staleHqPenalty =
    target === "hq" &&
    (candidate.kind === "pressure_hq" || candidate.kind === "safe_probe_run") &&
    lowValueKnownHq
      ? candidate.kind === "pressure_hq"
        ? 430
        : 230
      : 0;
  const recentCentralPenalty = recentCentralPressurePenalty(
    input,
    candidate,
    target,
  );
  const knownRemoteValue = evaluateKnownRemoteMemoryValue(
    input,
    candidate,
    target,
    beliefState,
  );
  evidence.push(`recent_central_penalty:${recentCentralPenalty}`);
  const score =
    candidate.kind === "pressure_rnd"
      ? 135 +
        history * 10 +
        rndMemoryValue.score -
        staleRndPenalty -
        recentCentralPenalty
      : candidate.kind === "pressure_hq"
        ? 110 +
          Math.max(0, 5 - input.playerView.opponent.handCount) * 4 +
          history * 8 +
          hqMemoryValue.knownCardValue +
          hqMemoryValue.unknownCardValue -
          staleHqPenalty -
          recentCentralPenalty
        : candidate.kind === "contest_remote"
          ? 90 +
            (server?.rootCount ?? 0) * 55 +
            (server?.advancedRootCount ?? 0) * 35 +
            knownRemoteValue.score
          : candidate.kind === "trash_asset"
            ? 150
            : candidate.kind === "safe_probe_run"
              ? 55 -
                staleRndPenalty * 0.4 -
                Math.max(0, rndMemoryValue.penalty) * 0.4 +
                Math.max(0, rndMemoryValue.score) * 0.4 -
                staleHqPenalty * 0.4 -
                staleArchivesPenalty
              : 0;
  const reasons = [
    "server_value_from_visible_projection",
    ...(staleRndPenalty > 0 ? ["known_rnd_top_not_fresh"] : []),
    ...rndMemoryValue.reasons,
    ...(staleHqPenalty > 0 ? ["known_hq_hand_low_value"] : []),
    ...(hqMemoryValue.knownAgendaCount > 0 ? ["known_hq_agenda_pressure"] : []),
    ...(hqMemoryValue.unknownCount > 0 && target === "hq"
      ? ["unknown_hq_cards_remain"]
      : []),
    ...(recentCentralPenalty > 0 ? ["recent_central_pressure_repeated"] : []),
    ...(staleArchivesPenalty > 0 ? ["known_archives_access_not_fresh"] : []),
    ...knownRemoteValue.reasons,
  ];
  return {
    score,
    reasons,
    evidence: [
      ...evidence,
      ...rndMemoryValue.evidence,
      ...hqMemoryValue.evidence,
      ...knownRemoteValue.evidence,
    ],
  };
}

function knownRemoteRootTrashAffordabilityPenalty(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
  target: string | undefined,
  features: RunnerFeatures,
): { penalty: number; reasons: string[]; evidence: string[] } {
  if (candidate.kind !== "contest_remote" || !target?.startsWith("remote_"))
    return { penalty: 0, reasons: [], evidence: [] };
  void features;
  const payoff = evaluateKnownRemoteAccessPayoff(input, target);
  return {
    penalty: payoff.penalty,
    reasons: payoff.reasons,
    evidence: payoff.evidence,
  };
}

function isTrashableKnownRemoteRoot(card: VisibleCard): boolean {
  return (
    card.known &&
    (card.type === "asset" || card.type === "upgrade") &&
    remoteRootTrashCost(card) !== undefined
  );
}

function remoteRootTrashCost(card: VisibleCard): number | undefined {
  if (!card.known || !card.definitionId) return undefined;
  return (
    card.trashCost ??
    RUNTIME_CARDS[card.definitionId]?.numeric.trashCost ??
    DEMO_CARDS_BY_ID[card.definitionId]?.trashCost
  );
}

function staleKnownRndPlanPenalty(
  candidate: RunnerPlanCandidate,
  target: string | undefined,
  freshness: RndTopFreshnessMemory | undefined,
): number {
  if (
    target !== "rd" ||
    (candidate.kind !== "pressure_rnd" &&
      candidate.kind !== "safe_probe_run") ||
    freshness?.freshness !== "stale_known_same_top"
  )
    return 0;
  if (knownRndTopIsAgenda(freshness)) return 0;
  if (
    freshness.knownTopDefinitionId &&
    knownRndTopIsLowValue(freshness) === false
  )
    return 0;
  // This is a preference penalty, not a legality gate: the Runner has side-safe public evidence that the same R&D top card is still known,
  // so ordinary economy/draw plans should beat another identical access unless another evaluator contributes a concrete advantage.
  return candidate.kind === "pressure_rnd" ? 540 : 260;
}

function evaluateKnownRndRunMemoryValue(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
  target: string | undefined,
  freshness: RndTopFreshnessMemory | undefined,
): { score: number; penalty: number; reasons: string[]; evidence: string[] } {
  if (
    target !== "rd" ||
    (candidate.kind !== "pressure_rnd" && candidate.kind !== "safe_probe_run")
  )
    return { score: 0, penalty: 0, reasons: [], evidence: [] };
  const knownTopDefinitionId = freshness?.knownTopDefinitionId;
  const knownAgenda = knownRndTopIsAgenda(freshness);
  const knownLowValue = knownRndTopIsLowValue(freshness);
  const freshAfterRemoved = freshness?.freshness === "fresh_after_top_removed";
  const score = knownAgenda
    ? 520
    : freshAfterRemoved
      ? 165
      : knownLowValue && freshness?.freshness === "stale_known_same_top"
        ? 0
        : 0;
  const penalty =
    knownLowValue && freshness?.freshness === "stale_known_same_top" ? 300 : 0;
  return {
    score,
    penalty,
    reasons: [
      ...(freshAfterRemoved ? ["rnd_top_fresh_after_access_removed"] : []),
      ...(knownAgenda ? ["known_rnd_top_agenda_pressure"] : []),
      ...(knownLowValue && freshness?.freshness === "stale_known_same_top"
        ? ["known_rnd_top_low_value_stale"]
        : []),
    ],
    evidence: [
      `rnd_known_top_definition:${knownTopDefinitionId ?? "unknown"}`,
      `rnd_known_top_agenda:${knownAgenda}`,
      `rnd_known_top_low_value:${knownLowValue}`,
      `rnd_freshened_by_runner_access:${freshness?.freshenedByRunnerAccess === true}`,
      `rnd_known_sequence_count:${freshness?.knownSequenceDefinitionIds?.length ?? 0}`,
    ],
  };
}

function knownRndTopIsAgenda(
  freshness: RndTopFreshnessMemory | undefined,
): boolean {
  const definitionId = freshness?.knownTopDefinitionId;
  if (!definitionId) return false;
  return (
    freshness.knownTopIsAgenda === true ||
    RUNTIME_CARDS[definitionId]?.type === "agenda" ||
    DEMO_CARDS_BY_ID[definitionId]?.type === "agenda"
  );
}

function knownRndTopIsLowValue(
  freshness: RndTopFreshnessMemory | undefined,
): boolean {
  const definitionId = freshness?.knownTopDefinitionId;
  if (!definitionId) return false;
  const runtimeType = RUNTIME_CARDS[definitionId]?.type;
  const demoType = DEMO_CARDS_BY_ID[definitionId]?.type;
  const type = runtimeType ?? demoType;
  if (type === "agenda") return false;
  if (type === "asset" || type === "upgrade") return false;
  return freshness.knownTopIsLowValue === true || type !== undefined;
}

function recentCentralPressurePenalty(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
  target: string | undefined,
): number {
  if (
    (candidate.kind !== "pressure_hq" && candidate.kind !== "pressure_rnd") ||
    (target !== "hq" && target !== "rd")
  )
    return 0;
  if (target === "rd") {
    const freshness =
      reconstructBeliefState(input).runnerOpponentModel?.rndTopFreshness;
    if (
      freshness?.freshness === "fresh_after_top_removed" ||
      knownRndTopIsAgenda(freshness)
    )
      return 0;
  }
  const history = mergedPublicHistory(input);
  const lastSameCentralRun = findLastIndex(
    history,
    (event) =>
      serverIdFromEvent(event) === target &&
      (event.publicPayload.actionType === "start_run" ||
        event.type === "run_started"),
  );
  if (lastSameCentralRun < 0) return 0;
  const last = history[lastSameCentralRun];
  if (!last) return 0;
  const currentVersion = input.playerView.stateVersion;
  const distance = currentVersion - eventVersion(last);
  if (distance > 8) return 0;
  return target === "hq" ? 170 : 140;
}

function staleArchivesRepeatPenalty(
  input: AiDecisionInput,
  target: string | undefined,
  server: RunnerServerFeatures | undefined,
): number {
  if (target !== "archives" || !server) return 0;
  const history = mergedPublicHistory(input);
  const lastArchivesAccessIndex = findLastIndex(history, (event) =>
    isArchivesAccessEvent(event),
  );
  const visibleArchivesCards =
    input.playerView.servers.find((candidate) => candidate.id === "archives")
      ?.root ?? [];
  const archivesCardCount = input.playerView.opponent.discardCount;
  const hiddenArchivesCount = Math.max(
    0,
    archivesCardCount - visibleArchivesCards.length,
  );
  const allVisibleArchivesLowValue =
    visibleArchivesCards.length > 0 &&
    visibleArchivesCards.every(
      (card) =>
        card.known &&
        card.definitionId &&
        isLowValueKnownArchivesAccessCard(card.definitionId),
    );
  if (lastArchivesAccessIndex < 0) {
    if (archivesCardCount === 0) return 260;
    if (hiddenArchivesCount === 0 && allVisibleArchivesLowValue) return 520;
    return 0;
  }
  if (
    history
      .slice(lastArchivesAccessIndex + 1)
      .some((event) => eventMayChangeArchives(event))
  )
    return 0;
  if (hiddenArchivesCount > 0) return 0;
  const lastArchivesAccess = history[lastArchivesAccessIndex];
  if (!lastArchivesAccess) return 0;
  const accessedDefinitionId = stringPayloadValue(
    lastArchivesAccess,
    "cardDefinitionId",
  );
  const visibleArchivesDefinitions = new Set(
    visibleArchivesCards
      .map((card) => card.definitionId)
      .filter((definitionId): definitionId is string => Boolean(definitionId)),
  );
  if (
    accessedDefinitionId &&
    !visibleArchivesDefinitions.has(accessedDefinitionId)
  )
    return 0;
  if (
    visibleArchivesCards.length > 0 &&
    visibleArchivesCards.every((card) => card.known && card.definitionId)
  ) {
    return visibleArchivesCards.every((card) =>
      isLowValueKnownArchivesAccessCard(card.definitionId!),
    )
      ? 640
      : 0;
  }
  if (!accessedDefinitionId) return 0;
  return isLowValueKnownArchivesAccessCard(accessedDefinitionId) ? 360 : 0;
}

function mergedPublicHistory(input: AiDecisionInput): PublicGameEvent[] {
  const byId = new Map<string, PublicGameEvent>();
  for (const event of [...input.playerView.publicEvents, ...input.eventTail]) {
    byId.set(event.eventId, event);
  }
  return [...byId.values()].sort(
    (left, right) => eventVersion(left) - eventVersion(right),
  );
}

function reconstructRunnerPlanContinuationIntent(
  input: AiDecisionInput,
  beliefState: BeliefState,
): RunnerPlanContinuationIntent | undefined {
  const history = mergedPublicHistory(input);
  const lastProgressIndex = findLastIndex(
    history,
    runnerPublicEventConvertsPlan,
  );
  const ownStrategicEvents = history
    .slice(lastProgressIndex + 1)
    .filter(
      (event) =>
        event.publicPayload.actor === "runner" &&
        runnerPlanKindFromPublicEvent(event) !== undefined,
    );
  if (ownStrategicEvents.length === 0) return undefined;
  const first = ownStrategicEvents[0]!;
  const planKind = runnerPlanKindFromPublicEvent(first);
  if (!planKind) return undefined;
  const targetServerId = serverIdFromEvent(first);
  const ownStrategicDecisionCount = ownStrategicEvents.length;
  const samePlanRepeatsWithoutProgress = Math.max(
    0,
    ownStrategicEvents.filter(
      (event) =>
        runnerPlanKindFromPublicEvent(event) === planKind &&
        serverIdFromEvent(event) === targetServerId,
    ).length - 1,
  );
  const expired = ownStrategicDecisionCount > 3;
  const abortReasons = runnerPlanAbortReasons(
    input,
    {
      planKind,
      targetServerId,
      ownStrategicDecisionCount,
      samePlanRepeatsWithoutProgress,
      converted: false,
      expired,
      abortReasons: [],
      evidence: [],
    },
    beliefState,
  );
  return {
    planKind,
    targetServerId,
    ownStrategicDecisionCount,
    samePlanRepeatsWithoutProgress,
    converted: false,
    expired,
    abortReasons,
    evidence: [
      `plan_intent_source_version:${eventVersion(first)}`,
      `plan_intent_latest_own_version:${eventVersion(ownStrategicEvents.at(-1)!)}`,
    ],
  };
}

function reconstructRunnerOutcomeFollowup(
  input: AiDecisionInput,
): RunnerOutcomeFollowup | undefined {
  const history = mergedPublicHistory(input);
  const recent = history.slice(-18);
  const lastOutcomeIndex = findLastIndex(recent, (event) =>
    runnerEventCanStartOutcomeFollowup(event),
  );
  if (lastOutcomeIndex < 0) return undefined;
  const event = recent[lastOutcomeIndex]!;
  const actionType = publicActionType(event);
  const sourceVersion = eventVersion(event);
  const ownStrategicDecisionCount = recent
    .slice(lastOutcomeIndex + 1)
    .filter(
      (candidate) =>
        candidate.publicPayload.actor === "runner" &&
        runnerPlanKindFromPublicEvent(candidate) !== undefined,
    ).length;
  if (ownStrategicDecisionCount > 3) return undefined;

  if (actionType === "jack_out") {
    return {
      kind: "jack_out_blocked",
      targetServerId: serverIdFromEvent(event),
      sourceVersion,
      ownStrategicDecisionCount,
      stale: ownStrategicDecisionCount > 0,
      evidence: ["outcome_source:runner_jack_out"],
    };
  }

  if (
    actionType === "gain_credit" ||
    actionType === "install_card" ||
    actionType === "play_event" ||
    actionType === "activated_card_ability" ||
    actionType === "trigger_ability"
  ) {
    const features = extractRunnerFeatures(input);
    const roles = publicEventRoles(event);
    const sourceDefinitionId =
      stringPayloadValue(event, "sourceDefinitionId") ??
      stringPayloadValue(event, "cardDefinitionId") ??
      stringPayloadValue(event, "targetDefinitionId");
    const rigSource =
      actionType === "install_card" &&
      (roles.some((role) => role.startsWith("breaker_") || role === "memory") ||
        runnerDefinitionIsCoverageCard(sourceDefinitionId));
    const economySource =
      (actionType === "gain_credit" ||
        roles.some((role) => isRunnerEconomyRole(role))) &&
      features.credits >=
        runnerCreditReserveTargetForPlanInput(input, features);
    if (rigSource || economySource) {
      return {
        kind: "economy_or_rig_ready",
        targetServerId: serverIdFromEvent(event),
        sourceVersion,
        ownStrategicDecisionCount,
        stale: ownStrategicDecisionCount > 0,
        evidence: [
          rigSource
            ? "outcome_source:runner_rig"
            : "outcome_source:runner_economy",
        ],
      };
    }
  }

  const runIndex =
    actionType === "start_run"
      ? lastOutcomeIndex
      : findLastIndex(
          recent.slice(0, lastOutcomeIndex + 1),
          (candidate) =>
            candidate.publicPayload.actor === "runner" &&
            publicActionType(candidate) === "start_run",
        );
  if (runIndex < 0) return undefined;
  const run = recent[runIndex]!;
  const targetServerId = serverIdFromEvent(run);
  if (!targetServerId) return undefined;
  const afterRun = recent.slice(runIndex + 1, lastOutcomeIndex + 1);
  const hasStealOrTrash = afterRun.some((candidate) =>
    ["steal_agenda", "trash_accessed_card"].includes(
      publicActionType(candidate),
    ),
  );
  const hasAccess = afterRun.some(
    (candidate) =>
      publicActionType(candidate) === "access_card" ||
      candidate.type.includes("access"),
  );
  const hasFreshValue = afterRun.some((candidate) =>
    Boolean(
      candidate.publicPayload.runnerCentralFreshValue === true ||
      candidate.publicPayload.multiaccess === true ||
      candidate.publicPayload.interfaceValue === true ||
      candidate.publicPayload.closeoutPressure === true,
    ),
  );
  if (
    targetServerId === "hq" ||
    targetServerId === "rd" ||
    targetServerId === "archives"
  ) {
    if (!hasAccess && actionType === "start_run") return undefined;
    return {
      kind:
        hasStealOrTrash || hasFreshValue
          ? "central_fresh_value"
          : "central_no_value",
      targetServerId,
      sourceVersion,
      ownStrategicDecisionCount,
      stale: ownStrategicDecisionCount > 0,
      evidence: [
        "outcome_source:runner_central_run",
        `outcome_has_value:${hasStealOrTrash || hasFreshValue}`,
      ],
    };
  }
  if (targetServerId.startsWith("remote_")) {
    if (!hasAccess && actionType === "start_run") return undefined;
    return {
      kind: hasStealOrTrash ? "remote_value" : "remote_empty_or_low_value",
      targetServerId,
      sourceVersion,
      ownStrategicDecisionCount,
      stale: ownStrategicDecisionCount > 0,
      evidence: [
        "outcome_source:runner_remote_run",
        `outcome_has_value:${hasStealOrTrash}`,
      ],
    };
  }
  return undefined;
}

function runnerEventCanStartOutcomeFollowup(event: PublicGameEvent): boolean {
  if (event.publicPayload.actor !== "runner") return false;
  const actionType = publicActionType(event);
  return (
    actionType === "access_card" ||
    actionType === "steal_agenda" ||
    actionType === "trash_accessed_card" ||
    actionType === "jack_out" ||
    actionType === "gain_credit" ||
    actionType === "install_card" ||
    actionType === "play_event" ||
    actionType === "activated_card_ability" ||
    actionType === "trigger_ability"
  );
}

function runnerPlanKindFromPublicEvent(
  event: PublicGameEvent,
): RunnerPlanKind | undefined {
  const actionType =
    typeof event.publicPayload.actionType === "string"
      ? event.publicPayload.actionType
      : event.type;
  const serverId = serverIdFromEvent(event);
  if (actionType === "start_run") {
    if (serverId === "rd") return "pressure_rnd";
    if (serverId === "hq") return "pressure_hq";
    if (serverId?.startsWith("remote_")) return "contest_remote";
    return "safe_probe_run";
  }
  if (actionType === "jack_out") return "safe_probe_run";
  if (actionType === "trash_accessed_card") return "trash_asset";
  if (actionType === "install_card") return "build_rig";
  if (actionType === "draw_card") return "draw_for_answers";
  if (
    actionType === "gain_credit" ||
    actionType === "play_event" ||
    actionType === "activated_card_ability" ||
    actionType === "trigger_ability"
  ) {
    return publicEventRoles(event).some((role) => role.includes("draw"))
      ? "draw_for_answers"
      : "recover_economy";
  }
  return undefined;
}

function publicEventRoles(event: PublicGameEvent): string[] {
  return [
    stringPayloadValue(event, "sourceDefinitionId"),
    stringPayloadValue(event, "cardDefinitionId"),
    stringPayloadValue(event, "targetDefinitionId"),
  ].flatMap((definitionId) =>
    definitionId ? rolesForCardId(definitionId) : [],
  );
}

function runnerDefinitionIsCoverageCard(
  definitionId: string | undefined,
): boolean {
  if (!definitionId) return false;
  const runtimeDefinition = RUNTIME_CARDS[definitionId];
  const demoDefinition = DEMO_CARDS_BY_ID[definitionId];
  const type = runtimeDefinition?.type ?? demoDefinition?.type;
  const subtypes = [
    ...(((runtimeDefinition as { subtypes?: string[] } | undefined)?.subtypes ??
      []) as string[]),
    ...(((demoDefinition as { subtypes?: string[] } | undefined)?.subtypes ??
      []) as string[]),
  ].map((subtype) => subtype.toLowerCase());
  return (
    type === "program" &&
    (subtypes.includes("icebreaker") ||
      subtypes.includes("fracter") ||
      subtypes.includes("decoder") ||
      subtypes.includes("killer"))
  );
}

function publicActionType(event: PublicGameEvent): string {
  return typeof event.publicPayload.actionType === "string"
    ? event.publicPayload.actionType
    : event.type;
}

function runnerPublicEventConvertsPlan(event: PublicGameEvent): boolean {
  const actionType = publicActionType(event);
  return (
    actionType === "steal_agenda" ||
    actionType === "trash_accessed_card" ||
    actionType === "score_agenda"
  );
}

function runnerPlanAbortReasons(
  input: AiDecisionInput,
  intent: RunnerPlanContinuationIntent,
  beliefState: BeliefState,
): string[] {
  const features = extractRunnerFeatures(input);
  const reasons: string[] = [];
  if (intent.expired) reasons.push("ttl_expired");
  if (
    intent.planKind === "recover_economy" &&
    features.credits >=
      runnerCreditReserveTargetForPlanInput(input, features) &&
    !runnerStillNeedsEconomyForVisibleContestOrTrash(input, features)
  )
    reasons.push("reserve_reached");
  if (intent.planKind === "contest_remote") {
    const target = intent.targetServerId;
    if (!target || !runnerRemoteTargetStillContestable(input, target, features))
      reasons.push("remote_not_contestable");
  }
  if (intent.planKind === "pressure_hq" || intent.planKind === "pressure_rnd") {
    const target = intent.planKind === "pressure_hq" ? "hq" : "rd";
    const hasFreshValue = runnerCentralTargetHasFreshPlanValue(
      input,
      target,
      beliefState,
    );
    if (
      intent.samePlanRepeatsWithoutProgress > 0 &&
      runnerCentralTargetIsNoFresh(input, target, beliefState, features) &&
      !hasFreshValue
    )
      reasons.push("central_stale");
    if (features.blockedRunServers.has(target)) reasons.push("central_blocked");
  }
  if (
    intent.planKind === "safe_probe_run" &&
    intent.samePlanRepeatsWithoutProgress > 0
  )
    reasons.push("probe_without_followup");
  return sortedUnique(reasons);
}

function runnerCentralTargetHasFreshPlanValue(
  input: AiDecisionInput,
  target: "hq" | "rd" | "archives",
  beliefState: BeliefState,
): boolean {
  const installed = input.playerView.own.rig ?? [];
  const matchingInterfaceInstalled = installed.some((card) =>
    centralPressureCardSupportsTarget(card.definitionId, target, true),
  );
  const anyInterfaceInstalled = installed.some((card) =>
    centralPressureCardSupportsTarget(card.definitionId, target, false),
  );
  const multiaccessInstalled = installed.some((card) =>
    rolesForCardId(card.definitionId).some((role) =>
      role.includes("multiaccess"),
    ),
  );
  const runEventHasGoodTarget = input.legalActions.some(
    (action) =>
      action.type === "play_event" &&
      rolesForAction(input, action).some(isRunnerPressureRole) &&
      centralPressureTargetIsGood(
        input,
        target,
        extractRunnerFeatures(input),
        beliefState,
      ),
  );
  const closeout = runnerCentralCloseoutProfile(input, target, beliefState, {
    matchingInterfaceInstalled,
    anyInterfaceInstalled,
    multiaccessInstalled,
    runEventHasGoodTarget,
  });
  return centralRepeatHasFreshValue(input, target, beliefState, {
    matchingInterfaceInstalled,
    anyInterfaceInstalled,
    multiaccessInstalled,
    runEventHasGoodTarget,
    closeoutOpportunity: closeout.opportunity,
  });
}

function runnerContinuationPlanMatches(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
  intent: RunnerPlanContinuationIntent,
  features: RunnerFeatures,
  beliefState: BeliefState,
): boolean {
  const target = targetServerId(input, candidate);
  const reserveTarget = runnerCreditReserveTargetForPlanInput(input, features);
  switch (intent.planKind) {
    case "recover_economy":
      if (features.credits < reserveTarget)
        return candidate.kind === "recover_economy";
      if (candidate.kind === "build_rig") return true;
      if (!target || !isRunPlan(candidate.kind)) return false;
      if (
        candidate.kind === "contest_remote" &&
        evaluateServerAccessValue(
          input,
          candidate,
          beliefState,
        ).reasons.includes("known_remote_root_trash_unaffordable_after_ice")
      )
        return false;
      if (target.startsWith("remote_"))
        return runnerRemoteTargetStillContestable(input, target, features);
      return !features.blockedRunServers.has(target);
    case "build_rig":
      return Boolean(
        target &&
        isRunPlan(candidate.kind) &&
        !features.blockedRunServers.has(target),
      );
    case "contest_remote":
      return (
        candidate.kind === "contest_remote" &&
        target === intent.targetServerId &&
        Boolean(
          target && runnerRemoteTargetStillContestable(input, target, features),
        )
      );
    case "pressure_hq":
    case "pressure_rnd": {
      if (candidate.kind !== intent.planKind) return false;
      const opportunity = runnerCentralPressureOpportunity(
        input,
        candidate,
        beliefState,
      );
      return (
        opportunity.matchingInterfaceInstalled ||
        opportunity.multiaccessInstalled ||
        opportunity.repeatedFreshValue ||
        opportunity.closeoutOpportunity
      );
    }
    case "safe_probe_run":
      return candidate.kind !== "safe_probe_run";
    default:
      return false;
  }
}

function runnerAbortPlanMatches(
  candidate: RunnerPlanCandidate,
  intent: RunnerPlanContinuationIntent,
  features: RunnerFeatures,
): boolean {
  if (intent.expired) return candidate.kind !== intent.planKind;
  if (intent.abortReasons.includes("reserve_reached"))
    return candidate.kind !== "recover_economy";
  if (intent.abortReasons.includes("remote_not_contestable"))
    return candidate.kind !== "contest_remote";
  if (
    intent.abortReasons.includes("central_stale") ||
    intent.abortReasons.includes("central_blocked") ||
    intent.abortReasons.includes("probe_without_followup")
  )
    return candidate.kind !== intent.planKind;
  return features.credits >= 0 && candidate.kind !== intent.planKind;
}

function runnerStillNeedsEconomyForVisibleContestOrTrash(
  input: AiDecisionInput,
  features: RunnerFeatures,
): boolean {
  return input.legalActions
    .filter(
      (action) =>
        action.type === "start_run" &&
        typeof action.payload?.serverId === "string" &&
        action.payload.serverId.startsWith("remote_"),
    )
    .map((action) =>
      runnerRemoteContestProfile(
        input,
        String(action.payload?.serverId),
        features,
      ),
    )
    .some(
      (profile) =>
        (profile.advanced || profile.relevantTrash) &&
        (profile.blockedByPostRunReserve || profile.blockedByKnownIceCost),
    );
}

function runnerRemoteTargetStillContestable(
  input: AiDecisionInput,
  target: string,
  features: RunnerFeatures,
): boolean {
  const server = features.serverFeatures.get(target);
  if (!server || server.rootCount <= 0) return false;
  const estimate = runnerKnownPathEstimate(input, target, features);
  if (!estimate || estimate.blocked) return false;
  const payoff = evaluateKnownRemoteAccessPayoff(input, target);
  if (payoff.knownNoCurrentPayoff) return false;
  return runnerRemoteContestProfile(input, target, features).contestable;
}

function findLastIndex<T>(
  values: T[],
  predicate: (value: T) => boolean,
): number {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (predicate(values[index]!)) return index;
  }
  return -1;
}

function isArchivesAccessEvent(event: PublicGameEvent): boolean {
  return (
    event.publicPayload.actionType === "access_card" &&
    serverIdFromEvent(event) === "archives"
  );
}

function eventMayChangeArchives(event: PublicGameEvent): boolean {
  const payload = event.publicPayload;
  if (
    payload.discardZone === "archives" ||
    payload.hiddenZoneAction === "discard_phase"
  )
    return true;
  const actionType =
    typeof payload.actionType === "string" ? payload.actionType : event.type;
  return (
    actionType === "trash_accessed_card" ||
    actionType === "trash_card" ||
    actionType === "play_operation"
  );
}

function stringPayloadValue(
  event: PublicGameEvent,
  key: string,
): string | undefined {
  const value = event.publicPayload[key];
  return typeof value === "string" ? value : undefined;
}

function eventVersion(event: PublicGameEvent): number {
  return typeof event.stateVersionAfter === "number"
    ? event.stateVersionAfter
    : 0;
}

function isKnownLowValueHqHand(
  input: AiDecisionInput,
  target: string | undefined,
  hqHandMemory: KnownHqHandMemory | undefined,
): boolean {
  if (
    target !== "hq" ||
    !hqHandMemory?.allCardsKnown ||
    hqHandMemory.knownDefinitions.length === 0
  )
    return false;
  return hqHandMemory.knownDefinitions.every((definitionId) =>
    isLowValueKnownHqAccessCard(definitionId, input.playerView.own.credits),
  );
}

function evaluateKnownHqRunMemoryValue(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
  target: string | undefined,
  hqHandMemory: KnownHqHandMemory | undefined,
): {
  knownCardValue: number;
  unknownCardValue: number;
  knownAgendaCount: number;
  knownNonAgendaCount: number;
  knownAgendaPoints: number;
  unknownCount: number;
  fullyKnownNoAgenda: boolean;
  evidence: string[];
} {
  if (target !== "hq" || !hqHandMemory) {
    return {
      knownCardValue: 0,
      unknownCardValue: 0,
      knownAgendaCount: 0,
      knownNonAgendaCount: 0,
      knownAgendaPoints: 0,
      unknownCount: 0,
      fullyKnownNoAgenda: false,
      evidence: [],
    };
  }
  const knownAgendaDefinitions = hqHandMemory.knownDefinitions.filter(
    (definitionId) => cardDefinitionType(definitionId) === "agenda",
  );
  const knownAgendaPoints = knownAgendaDefinitions.reduce(
    (sum, definitionId) => sum + cardDefinitionAgendaPoints(definitionId),
    0,
  );
  const knownNonAgendaCount =
    hqHandMemory.knownDefinitions.length - knownAgendaDefinitions.length;
  const unknownCount = Math.max(
    0,
    hqHandMemory.handCount - hqHandMemory.knownCount,
  );
  const fullyKnownNoAgenda =
    hqHandMemory.allCardsKnown &&
    hqHandMemory.knownCount > 0 &&
    knownAgendaDefinitions.length === 0 &&
    hqHandMemory.knownDefinitions.every((definitionId) =>
      isLowValueKnownHqAccessCard(definitionId, input.playerView.own.credits),
    );
  const pressureMultiplier = candidate.kind === "pressure_hq" ? 1 : 0.45;
  const knownCardValue = Math.round(
    pressureMultiplier *
      (knownAgendaDefinitions.length * 520 + knownAgendaPoints * 80),
  );
  const unknownCardValue = Math.round(
    pressureMultiplier * Math.min(140, unknownCount * 55),
  );
  return {
    knownCardValue,
    unknownCardValue,
    knownAgendaCount: knownAgendaDefinitions.length,
    knownNonAgendaCount,
    knownAgendaPoints,
    unknownCount,
    fullyKnownNoAgenda,
    evidence: [
      `hq_known_cards:${hqHandMemory.knownCount}`,
      `hq_unknown_cards:${unknownCount}`,
      `hq_known_fraction:${
        hqHandMemory.handCount > 0
          ? roundScore(hqHandMemory.knownCount / hqHandMemory.handCount)
          : 0
      }`,
      `hq_fully_known:${hqHandMemory.allCardsKnown}`,
      `hq_known_agenda_count:${knownAgendaDefinitions.length}`,
      `hq_known_non_agenda_count:${knownNonAgendaCount}`,
      `hq_known_agenda_points:${knownAgendaPoints}`,
      `hq_run_value_from_known_cards:${knownCardValue}`,
      `hq_run_value_from_unknown_cards:${unknownCardValue}`,
      ...(fullyKnownNoAgenda
        ? ["hq_run_suppressed_because_fully_known_no_agenda:true"]
        : []),
      ...(knownAgendaDefinitions.length > 0
        ? ["hq_run_boosted_because_known_agenda:true"]
        : []),
      ...(unknownCount > 0
        ? ["hq_run_boosted_because_unknown_cards_remain:true"]
        : []),
    ],
  };
}

function evaluateKnownRemoteMemoryValue(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
  target: string | undefined,
  beliefState: BeliefState,
): { score: number; reasons: string[]; evidence: string[] } {
  if (candidate.kind !== "contest_remote" || !target?.startsWith("remote_")) {
    return { score: 0, reasons: [], evidence: [] };
  }
  const payoff = evaluateKnownRemoteAccessPayoff(input, target, beliefState);
  const score = payoff.score - payoff.penalty;
  return {
    score,
    reasons: sortedUnique(payoff.reasons),
    evidence: [...payoff.evidence, `known_remote_memory_score:${score}`],
  };
}

function beliefStateForCost(input: AiDecisionInput): BeliefState {
  return reconstructBeliefState(input);
}

function knownUnrezzedIceCostAdjustment(
  input: AiDecisionInput,
  target: string | undefined,
  beliefState: BeliefState,
): { cost: number; blocked: boolean; evidence: string[] } {
  if (!target) return { cost: 0, blocked: false, evidence: [] };
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === target,
  );
  if (!server) return { cost: 0, blocked: false, evidence: [] };
  const knownIce = (
    beliefState.runnerOpponentModel?.knownPositionMemory ?? []
  ).filter(
    (entry) =>
      entry.zone === target &&
      entry.positionKey.startsWith("ice:") &&
      server.ice.some((ice) => !ice.known || ice.rezzed !== true),
  );
  if (knownIce.length === 0) return { cost: 0, blocked: false, evidence: [] };
  const pseudoIce = knownIce.map((entry) =>
    visibleIceFromKnownDefinition(entry.definitionId),
  );
  const assessment = assessKnownRezzedIcePath(
    pseudoIce,
    input.playerView.own.rig ?? [],
    input.playerView.own.credits,
  );
  return {
    cost: assessment.visibleBreakCost ?? 0,
    blocked: assessment.blocked,
    evidence: [
      `known_unrezzed_ice_from_expose:${knownIce.length}`,
      `run_cost_adjusted_by_known_unrezzed_ice:${assessment.visibleBreakCost ?? 0}`,
      ...(assessment.blocked ? ["known_unrezzed_ice_blocks_path:true"] : []),
    ],
  };
}

function visibleIceFromKnownDefinition(definitionId: string): VisibleCard {
  const definition = DEMO_CARDS_BY_ID[definitionId];
  return {
    instanceId: `known_unrezzed_${definitionId}`,
    known: true,
    definitionId,
    title: definition?.title ?? RUNTIME_CARDS[definitionId]?.title,
    type: "ice",
    subtypes: definition?.subtypes ?? [],
    rezzed: true,
    strength: definition?.strength,
    subroutines: definition?.subroutines ?? [],
    owner: "corp",
    controller: "corp",
  } as VisibleCard;
}

function isLowValueKnownHqAccessCard(
  definitionId: string,
  runnerCredits: number,
): boolean {
  const runtimeDefinition = RUNTIME_CARDS[definitionId];
  const demoDefinition = DEMO_CARDS_BY_ID[definitionId];
  const type = runtimeDefinition?.type ?? demoDefinition?.type;
  if (!type) return false;
  if (type === "agenda") return false;
  const trashCost =
    runtimeDefinition?.numeric.trashCost ?? demoDefinition?.trashCost ?? 0;
  if ((type === "asset" || type === "upgrade") && runnerCredits >= trashCost)
    return false;
  return true;
}

function cardDefinitionTrashCost(definitionId: string): number | undefined {
  return (
    RUNTIME_CARDS[definitionId]?.numeric.trashCost ??
    DEMO_CARDS_BY_ID[definitionId]?.trashCost
  );
}

function cardDefinitionType(definitionId: string): string | undefined {
  return (
    RUNTIME_CARDS[definitionId]?.type ?? DEMO_CARDS_BY_ID[definitionId]?.type
  );
}

function cardDefinitionAgendaPoints(definitionId: string): number {
  return (
    RUNTIME_CARDS[definitionId]?.numeric.agendaPoints ??
    DEMO_CARDS_BY_ID[definitionId]?.agendaPoints ??
    0
  );
}

function isLowValueKnownArchivesAccessCard(definitionId: string): boolean {
  const runtimeDefinition = RUNTIME_CARDS[definitionId];
  const demoDefinition = DEMO_CARDS_BY_ID[definitionId];
  const type = runtimeDefinition?.type ?? demoDefinition?.type;
  return Boolean(type && type !== "agenda");
}

export function evaluateRemoteThreat(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
  beliefState: BeliefState = reconstructBeliefState(input),
): RunnerPlanEvaluatorResult {
  const features = extractRunnerFeatures(input);
  const target = targetServerId(input, candidate);
  const server = target ? features.serverFeatures.get(target) : undefined;
  const blocked = target ? features.blockedRunServers.has(target) : false;
  const remoteThreat = target?.startsWith("remote_")
    ? (server?.rootCount ?? 0) * 40 + (server?.advancedRootCount ?? 0) * 55
    : 0;
  const lowReserveRemotePenalty = lowReserveRemoteContestPenalty(
    input,
    candidate,
    target,
    server,
  );
  const recentRemotePenalty = recentRemoteContestPenalty(
    input,
    candidate,
    target,
  );
  const remoteBeliefBoost = target?.startsWith("remote_")
    ? Math.round(
        beliefState.runnerOpponentModel?.remoteCardBelief
          .filter((belief) => belief.serverId === target)
          .reduce((sum, belief) => sum + belief.confidence * 25, 0) ?? 0,
      )
    : 0;
  const knownRemoteValue = evaluateKnownRemoteMemoryValue(
    input,
    candidate,
    target,
    beliefState,
  );
  if (candidate.kind === "contest_remote" && blocked) {
    return {
      score: -90,
      reasons: ["remote_threat_unreachable_by_visible_ice"],
      evidence: [
        `remote_target:${target?.startsWith("remote_") ? target : "none"}`,
        `advanced_roots:${server?.advancedRootCount ?? 0}`,
        `remote_belief_boost:${remoteBeliefBoost}`,
        ...knownRemoteValue.evidence,
        `low_reserve_remote_penalty:${lowReserveRemotePenalty}`,
        `recent_remote_penalty:${recentRemotePenalty}`,
      ],
    };
  }
  return {
    score:
      candidate.kind === "contest_remote"
        ? remoteThreat +
          80 +
          remoteBeliefBoost -
          lowReserveRemotePenalty -
          recentRemotePenalty +
          knownRemoteValue.score
        : candidate.kind === "safe_probe_run"
          ? Math.min(30, remoteThreat)
          : 0,
    reasons: sortedUnique([
      remoteThreat > 0 ? "remote_threat_visible" : "remote_threat_uncertain",
      ...(lowReserveRemotePenalty > 0
        ? ["remote_contest_credit_reserve_low"]
        : []),
      ...(recentRemotePenalty > 0 ? ["recent_remote_contest_repeated"] : []),
      ...knownRemoteValue.reasons,
    ]),
    evidence: [
      `remote_target:${target?.startsWith("remote_") ? target : "none"}`,
      `advanced_roots:${server?.advancedRootCount ?? 0}`,
      `remote_belief_boost:${remoteBeliefBoost}`,
      ...knownRemoteValue.evidence,
      `low_reserve_remote_penalty:${lowReserveRemotePenalty}`,
      `recent_remote_penalty:${recentRemotePenalty}`,
    ],
  };
}

function lowReserveRemoteContestPenalty(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
  target: string | undefined,
  server: RunnerServerFeatures | undefined,
): number {
  if (candidate.kind !== "contest_remote" || !target?.startsWith("remote_"))
    return 0;
  if (input.playerView.own.credits > 1) return 0;
  if ((server?.advancedRootCount ?? 0) > 0) return 0;
  if (
    input.playerView.opponent.agendaPoints >=
    input.playerView.agendaPointsToWin - 2
  )
    return 0;
  return 260;
}

function recentRemoteContestPenalty(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
  target: string | undefined,
): number {
  if (candidate.kind !== "contest_remote" || !target?.startsWith("remote_"))
    return 0;
  const history = mergedPublicHistory(input);
  const lastSameRemoteRun = findLastIndex(
    history,
    (event) =>
      serverIdFromEvent(event) === target &&
      (event.publicPayload.actionType === "start_run" ||
        event.type === "run_started"),
  );
  if (lastSameRemoteRun < 0) return 0;
  const last = history[lastSameRemoteRun];
  if (!last) return 0;
  const distance = input.playerView.stateVersion - eventVersion(last);
  if (distance > 8) return 0;
  return recentSameRemoteJackOutWithoutAccess(
    history,
    lastSameRemoteRun,
    target,
  )
    ? 620
    : 180;
}

function recentSameRemoteJackOutWithoutAccess(
  history: PublicGameEvent[],
  startIndex: number,
  target: string,
): boolean {
  const afterStart = history.slice(startIndex + 1);
  const jackOutIndex = afterStart.findIndex((event) => {
    const actionType =
      typeof event.publicPayload.actionType === "string"
        ? event.publicPayload.actionType
        : event.type;
    if (actionType !== "jack_out") return false;
    const eventServerId = serverIdFromEvent(event);
    return eventServerId === undefined || eventServerId === target;
  });
  if (jackOutIndex < 0) return false;
  const beforeJackOut = afterStart.slice(0, jackOutIndex);
  if (
    beforeJackOut.some(
      (event) =>
        serverIdFromEvent(event) === target &&
        event.publicPayload.actionType === "access_card",
    )
  )
    return false;
  return !afterStart
    .slice(jackOutIndex + 1)
    .some((event) => eventMayRefreshRemoteRun(event, target));
}

function eventMayRefreshRemoteRun(
  event: PublicGameEvent,
  target: string,
): boolean {
  const actionType =
    typeof event.publicPayload.actionType === "string"
      ? event.publicPayload.actionType
      : event.type;
  if (actionType === "access_card" && serverIdFromEvent(event) === target)
    return true;
  return (
    actionType === "gain_credit" ||
    actionType === "draw_card" ||
    actionType === "install_card" ||
    actionType === "play_event" ||
    actionType === "trigger_ability" ||
    actionType === "rez_ice"
  );
}

export function evaluateCorpScoringThreat(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
  beliefState: BeliefState = reconstructBeliefState(input),
): RunnerPlanEvaluatorResult {
  const corpAgenda = input.playerView.opponent.agendaPoints;
  const toWin = input.playerView.agendaPointsToWin;
  const pressureNeeded = toWin - corpAgenda <= 3;
  const scoringTrend =
    beliefState.runnerOpponentModel?.corpPlanEstimate.scoring ?? 0;
  const score =
    candidate.kind === "contest_remote" && pressureNeeded
      ? 80 + scoringTrend * 35
      : isRunPlan(candidate.kind) && pressureNeeded
        ? 35 + scoringTrend * 20
        : 0;
  return {
    score,
    reasons: pressureNeeded
      ? ["corp_near_scoring_threshold"]
      : ["corp_scoring_threshold_not_immediate"],
    evidence: [
      `corp_agenda:${corpAgenda}`,
      `agenda_to_win:${toWin}`,
      `corp_credits:${input.playerView.opponent.credits}`,
      `corp_scoring_trend:${round(scoringTrend)}`,
    ],
  };
}

export function runnerPlanUsesOnlyAiSupportedCards(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
): boolean {
  return candidate.legalActionIds.every((actionId) => {
    const action = input.legalActions.find(
      (legalAction) => legalAction.actionId === actionId,
    );
    if (
      !action ||
      action.source === "basic_action" ||
      action.source === "game_rule"
    )
      return true;
    const card = findVisibleCard(input, action.source);
    return card ? isAiSupportedCard(card.definitionId) : true;
  });
}

function evaluateInstalledEconomyActions(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
): RunnerPlanEvaluatorResult {
  if (candidate.kind !== "recover_economy")
    return { score: 0, reasons: [], evidence: [] };
  const assessments = candidate.legalActionIds
    .map((actionId) =>
      input.legalActions.find((action) => action.actionId === actionId),
    )
    .map((action) =>
      action ? classifyInstalledEconomyAction(input, action) : undefined,
    )
    .filter((assessment): assessment is InstalledEconomyActionAssessment =>
      Boolean(assessment),
    );
  if (assessments.length === 0)
    return { score: 0, reasons: [], evidence: ["installed_economy:false"] };
  let score = 0;
  const reasons: string[] = [];
  const payout = assessments
    .filter(
      (assessment) =>
        assessment.kind === "direct_payout" ||
        assessment.kind === "pool_payout",
    )
    .sort(
      (left, right) =>
        right.netCredits - left.netCredits ||
        right.immediateGain - left.immediateGain ||
        left.ability.localeCompare(right.ability),
    )[0];
  const poolBuild = assessments
    .filter((assessment) => assessment.kind === "pool_build")
    .sort(
      (left, right) =>
        right.futurePoolAfter - left.futurePoolAfter ||
        left.ability.localeCompare(right.ability),
    )[0];

  if (payout) {
    score +=
      90 +
      Math.max(0, payout.netCredits - 1) * 45 +
      (input.playerView.own.credits < 4 ? 120 : 35);
    reasons.push(
      payout.kind === "pool_payout"
        ? "installed_economy_pool_payout"
        : "installed_economy_direct_payout",
    );
  }
  if (poolBuild) {
    const horizon = brokerPoolBuildHorizon(input, poolBuild);
    score += horizon.score;
    reasons.push(horizon.reason);
  }

  const best = payout ?? poolBuild ?? assessments[0]!;
  const brokerHorizon =
    best.kind === "pool_build"
      ? brokerPoolBuildHorizon(input, best)
      : undefined;
  return {
    score,
    reasons,
    evidence: [
      "installed_economy:true",
      `installed_economy_kind:${best.kind}`,
      `installed_economy_immediate_gain:${best.immediateGain}`,
      `installed_economy_net_credits:${best.netCredits}`,
      `installed_economy_stored_credits:${best.storedCredits}`,
      `installed_economy_future_pool_after:${best.futurePoolAfter}`,
      `economy_need:${input.playerView.own.credits < 4 ? "acute" : "stable"}`,
      ...(brokerHorizon
        ? [
            `broker_horizon:${brokerHorizon.reason}`,
            `broker_horizon_clicks:${brokerHorizon.clicksRemaining}`,
            `broker_horizon_visible_threshold:${brokerHorizon.visibleThreshold}`,
            `broker_horizon_immediate_credit_need:${brokerHorizon.immediateCreditNeed}`,
          ]
        : []),
    ],
  };
}

function brokerPoolBuildHorizon(
  input: AiDecisionInput,
  assessment: InstalledEconomyActionAssessment,
): BrokerPoolBuildHorizon {
  const clicksRemaining = Math.max(0, Math.floor(input.playerView.own.clicks));
  const visibleThreshold = runnerHasVisibleImmediateCreditThreshold(input);
  const immediateCreditNeed =
    input.playerView.own.credits < 3 || visibleThreshold;
  if (immediateCreditNeed) {
    return {
      score: -80,
      priority: 42,
      reason: "installed_economy_pool_build_deferred_for_credit_need",
      immediateCreditNeed,
      visibleThreshold,
      clicksRemaining,
    };
  }
  const clickWindowBonus =
    clicksRemaining >= 2 ? 35 : clicksRemaining === 1 ? 8 : -25;
  return {
    score: 45 + Math.min(80, assessment.futurePoolAfter * 8) + clickWindowBonus,
    priority:
      68 +
      Math.min(20, assessment.futurePoolAfter * 2) +
      (clicksRemaining >= 2 ? 8 : 0),
    reason:
      clicksRemaining >= 2
        ? "installed_economy_pool_build_horizon_value"
        : "installed_economy_pool_build_late_click_value",
    immediateCreditNeed,
    visibleThreshold,
    clicksRemaining,
  };
}

function runnerHasVisibleImmediateCreditThreshold(
  input: AiDecisionInput,
): boolean {
  const features = extractRunnerFeatures(input);
  return [...features.visibleRunBreakCosts.values()].some(
    (cost) => cost > features.credits && cost <= features.credits + 1,
  );
}

function evaluateShellTradersActions(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
): RunnerPlanEvaluatorResult {
  if (candidate.kind !== "build_rig")
    return { score: 0, reasons: [], evidence: [] };
  const assessments = candidate.legalActionIds
    .map((actionId) =>
      input.legalActions.find((action) => action.actionId === actionId),
    )
    .map((action) =>
      action ? classifyShellTradersAction(input, action) : undefined,
    )
    .filter((assessment): assessment is ShellTradersActionAssessment =>
      Boolean(assessment),
    );
  if (assessments.length === 0)
    return { score: 0, reasons: [], evidence: ["shell_traders:false"] };
  const backlog = shellTradersBacklog(input);

  const prepare = assessments
    .filter((assessment) => assessment.kind === "prepare")
    .sort(
      (left, right) =>
        shellTradersTargetValue(right) - shellTradersTargetValue(left) ||
        left.shellCounters - right.shellCounters,
    )[0];
  const remove = assessments
    .filter((assessment) => assessment.kind === "remove_counter")
    .sort(
      (left, right) =>
        Number(right.immediateInstall) - Number(left.immediateInstall) ||
        shellTradersTargetValue(right) - shellTradersTargetValue(left) ||
        left.shellCounters - right.shellCounters,
    )[0];
  const preparePenalty = prepare
    ? shellTradersPrepareBacklogPenalty(input, backlog, remove, prepare)
    : 0;
  const prepareScore = prepare
    ? 165 +
      shellTradersTargetValue(prepare) +
      Math.max(0, 4 - input.playerView.own.credits) * 20 -
      preparePenalty
    : Number.NEGATIVE_INFINITY;
  const removeScore = remove
    ? (remove.immediateInstall
        ? 230
        : 125 + Math.max(0, 4 - remove.shellCounters) * 12) +
      Math.min(85, shellTradersTargetValue(remove) / 2)
    : Number.NEGATIVE_INFINITY;
  const best =
    removeScore >= prepareScore
      ? (remove ?? prepare ?? assessments[0]!)
      : (prepare ?? remove ?? assessments[0]!);
  const score = Math.max(prepareScore, removeScore, 0);
  const reasons = sortedUnique([
    ...(best.kind === "prepare"
      ? ["shell_traders_prepare_build_rig"]
      : [
          best.immediateInstall
            ? "shell_traders_finish_install"
            : "shell_traders_progress_counter",
        ]),
    ...(prepare && preparePenalty > 0
      ? ["shell_traders_prepare_backlog_limited"]
      : []),
    ...(backlog.preparedCount >= 2 ? ["shell_traders_backlog_present"] : []),
    ...(remove?.immediateInstall
      ? ["shell_traders_immediate_install_available"]
      : []),
  ]);

  return {
    score,
    reasons,
    evidence: [
      "shell_traders:true",
      `shell_traders_kind:${best.kind}`,
      `shell_traders_prepare_actions:${assessments.filter((assessment) => assessment.kind === "prepare").length}`,
      `shell_traders_remove_actions:${assessments.filter((assessment) => assessment.kind === "remove_counter").length}`,
      `shell_traders_backlog:${backlog.preparedCount}`,
      `shell_traders_near_install:${backlog.nearInstallCount}`,
      `shell_traders_total_counters:${backlog.totalShellCounters}`,
      `shell_traders_prepare_score:${Number.isFinite(prepareScore) ? round(prepareScore) : "none"}`,
      `shell_traders_remove_score:${Number.isFinite(removeScore) ? round(removeScore) : "none"}`,
      `shell_traders_prepare_backlog_penalty:${preparePenalty}`,
      `shell_traders_immediate_install:${best.immediateInstall}`,
      `shell_traders_direct_install_available:${best.directInstallAvailable}`,
      `shell_traders_direct_install_urgency:${best.directInstallUrgency}`,
      `shell_traders_target_roles:${best.targetRoles.slice(0, 3).join(",") || "unknown"}`,
      `shell_traders_shell_counters:${best.shellCounters}`,
      `shell_traders_source_visible:${best.sourceVisible}`,
    ],
  };
}

function shellTradersBacklog(input: AiDecisionInput): ShellTradersBacklog {
  const preparedCards =
    input.playerView.specialZones?.setAside.filter(
      (card) =>
        card.known &&
        card.owner === "runner" &&
        card.counters?.shell !== undefined,
    ) ?? [];
  return {
    preparedCount: preparedCards.length,
    nearInstallCount: preparedCards.filter(
      (card) => Math.max(0, card.counters?.shell ?? 0) <= 1,
    ).length,
    totalShellCounters: preparedCards.reduce(
      (sum, card) => sum + Math.max(0, card.counters?.shell ?? 0),
      0,
    ),
  };
}

function shellTradersPrepareBacklogPenalty(
  input: AiDecisionInput,
  backlog: ShellTradersBacklog,
  remove: ShellTradersActionAssessment | undefined,
  prepare?: ShellTradersActionAssessment,
): number {
  let penalty = 0;
  if (backlog.preparedCount >= 2)
    penalty += 180 + Math.max(0, backlog.preparedCount - 2) * 45;
  else if (backlog.preparedCount === 1) penalty += 55;
  if (remove?.immediateInstall) penalty += 110;
  if (backlog.nearInstallCount > 0) penalty += backlog.nearInstallCount * 35;
  if (input.playerView.own.credits <= 1 && backlog.preparedCount >= 2)
    penalty += 55;
  if (prepare?.directInstallAvailable)
    penalty += shellTradersDirectInstallPreparePenalty(prepare);
  return penalty;
}

function classifyShellTradersAction(
  input: AiDecisionInput,
  action: LegalAction,
): ShellTradersActionAssessment | undefined {
  if (
    input.side !== "runner" ||
    action.side !== "runner" ||
    action.type !== "trigger_ability"
  )
    return undefined;
  if (action.source === "basic_action" || action.source === "game_rule")
    return undefined;
  const ability = action.payload?.shellTradersAbility;
  if (ability !== "set_aside_from_grip" && ability !== "remove_shell_counter")
    return undefined;
  const sourceCard = findVisibleCard(input, action.source);
  const sourceVisible = Boolean(
    sourceCard &&
    input.playerView.own.rig?.some(
      (card) => card.instanceId === sourceCard.instanceId && card.known,
    ),
  );
  if (!sourceVisible) return undefined;

  const targetCardId =
    typeof action.payload?.targetCardId === "string"
      ? action.payload.targetCardId
      : "";
  const targetDefinitionId =
    typeof action.payload?.targetCardDefinitionId === "string"
      ? action.payload.targetCardDefinitionId
      : findVisibleCard(input, targetCardId)?.definitionId;
  const targetRoles = rolesForCardId(targetDefinitionId);
  const directInstall =
    ability === "set_aside_from_grip"
      ? shellTradersDirectInstallAction(input, targetCardId)
      : undefined;
  const directInstallRemainingCredits = directInstall
    ? input.playerView.own.credits - actionCreditCost(directInstall)
    : undefined;
  const directInstallUrgency = directInstall
    ? shellTradersDirectInstallUrgency(
        input,
        targetRoles,
        directInstallRemainingCredits ?? 0,
      )
    : 0;
  const shellCounters = Math.max(
    0,
    numberPayload(action, "shellCounterAmount"),
    numberPayload(action, "remainingCountersBefore"),
    numberPayload(action, "remainingCounters"),
  );
  const immediateInstall =
    ability === "remove_shell_counter" && shellCounters <= 1;
  return {
    kind: ability === "set_aside_from_grip" ? "prepare" : "remove_counter",
    shellCounters,
    ...(targetDefinitionId ? { targetDefinitionId } : {}),
    targetRoles,
    immediateInstall,
    sourceVisible,
    directInstallAvailable: Boolean(directInstall),
    ...(directInstallRemainingCredits !== undefined
      ? { directInstallRemainingCredits }
      : {}),
    directInstallUrgency,
  };
}

function shellTradersTargetValue(
  assessment: ShellTradersActionAssessment,
): number {
  let value = 0;
  if (assessment.targetRoles.some((role) => role.startsWith("breaker_")))
    value += 105;
  if (
    assessment.targetRoles.includes("memory") ||
    assessment.targetRoles.includes("memory_support")
  )
    value += 55;
  if (
    assessment.targetRoles.includes("setup") ||
    assessment.targetRoles.includes("build_rig")
  )
    value += 45;
  if (
    assessment.targetRoles.includes("economy") ||
    assessment.targetRoles.includes("tempo")
  )
    value += 20;
  value += Math.min(60, assessment.shellCounters * 10);
  return value;
}

function shellTradersDirectInstallAction(
  input: AiDecisionInput,
  targetCardId: string,
): LegalAction | undefined {
  if (!targetCardId) return undefined;
  return input.legalActions.find(
    (action) =>
      action.type === "install_card" && action.source === targetCardId,
  );
}

function shellTradersDirectInstallUrgency(
  input: AiDecisionInput,
  roles: string[],
  remainingCredits: number,
): number {
  const features = extractRunnerFeatures(input);
  let urgency = 0;
  if (
    roles.some(
      (role) => role.startsWith("breaker_") && !features.rigRoles.has(role),
    )
  )
    urgency += 145;
  if (
    roles.some(
      (role) => role.startsWith("breaker_") && features.rigRoles.has(role),
    )
  )
    urgency -= 25;
  if (roles.includes("memory") || roles.includes("memory_support"))
    urgency += features.memoryRemaining <= 1 ? 110 : 25;
  if (roles.includes("setup") || roles.includes("build_rig"))
    urgency += features.rigRoles.size === 0 ? 45 : 15;
  if (roles.includes("economy") || roles.includes("tempo"))
    urgency += input.playerView.own.credits < 4 ? 55 : 15;
  if (remainingCredits >= 2) urgency += 45;
  else if (remainingCredits < 1) urgency -= 35;
  return Math.max(0, urgency);
}

function shellTradersDirectInstallPreparePenalty(
  assessment: ShellTradersActionAssessment,
): number {
  if (!assessment.directInstallAvailable) return 0;
  let penalty = 35 + Math.min(170, assessment.directInstallUrgency);
  if ((assessment.directInstallRemainingCredits ?? 0) >= 2) penalty += 35;
  return penalty;
}

function classifyInstalledEconomyAction(
  input: AiDecisionInput,
  action: LegalAction,
): InstalledEconomyActionAssessment | undefined {
  if (
    input.side !== "runner" ||
    action.side !== "runner" ||
    (action.type !== "trigger_ability" &&
      action.type !== "activated_card_ability")
  )
    return undefined;
  if (action.source === "basic_action" || action.source === "game_rule")
    return undefined;
  const sourceCard = findVisibleCard(input, action.source);
  if (
    !sourceCard ||
    !input.playerView.own.rig?.some(
      (card) => card.instanceId === sourceCard.instanceId && card.known,
    )
  )
    return undefined;
  const ability = runnerInstalledEconomyAbilityId(action, sourceCard);
  const roles = rolesForCardId(sourceCard.definitionId);
  const storedCredits = Math.max(
    0,
    sourceCard.counters?.power ??
      sourceCard.counters?.bit ??
      sourceCard.counters?.recurring_credit ??
      0,
  );
  const activatedGain = activatedRunnerEconomyCreditGain(
    action,
    sourceCard,
    storedCredits,
  );
  const hintActionGain = runnerInstalledHintActionCreditGain(
    input,
    action,
    sourceCard,
  );
  const activatedBuild = activatedRunnerEconomyCreditBuild(action, sourceCard);
  const immediateGain = Math.max(
    0,
    activatedGain,
    hintActionGain,
    numberPayload(action, "gainCreditsAmount"),
    numberPayload(action, "gainedCredits"),
    numberPayload(action, "amount"),
    numberPayload(action, "removePowerCounterAmount"),
  );
  const addedCounters = Math.max(
    0,
    activatedBuild,
    numberPayload(action, "addCounterAmount"),
    numberPayload(action, "addedCounterAmount"),
  );
  const removedCounters = Math.max(
    0,
    activatedGain,
    numberPayload(action, "removePowerCounterAmount"),
    numberPayload(action, "removeCounterAmount"),
    numberPayload(action, "removedCounterAmount"),
  );
  const futurePoolAfter = Math.max(
    storedCredits,
    storedCredits + addedCounters - removedCounters,
  );
  const netCredits = immediateGain - actionCreditCost(action);

  if (ability === "broker_load_credits") {
    const cost = actionCreditCost(action);
    return {
      kind: "pool_build",
      immediateGain: 0,
      netCredits: cost > 0 ? -cost : 0,
      storedCredits,
      futurePoolAfter,
      ability,
    };
  }
  if (ability === "broker_take_credits") {
    const brokerGain = Math.max(immediateGain, storedCredits);
    return {
      kind: "pool_payout",
      immediateGain: brokerGain,
      netCredits: brokerGain - actionCreditCost(action),
      storedCredits,
      futurePoolAfter: 0,
      ability,
    };
  }
  if (ability === "short_term_contract_take_credits") {
    return {
      kind: "direct_payout",
      immediateGain,
      netCredits,
      storedCredits,
      futurePoolAfter: Math.max(
        0,
        storedCredits - Math.max(removedCounters, immediateGain),
      ),
      ability,
    };
  }
  if (immediateGain > 0 && (removedCounters > 0 || storedCredits > 0)) {
    return {
      kind: "pool_payout",
      immediateGain,
      netCredits,
      storedCredits,
      futurePoolAfter: Math.max(0, futurePoolAfter),
      ability: ability || "counter_payout",
    };
  }
  if (immediateGain > 0) {
    return {
      kind: "direct_payout",
      immediateGain,
      netCredits,
      storedCredits,
      futurePoolAfter,
      ability: ability || "credit_payout",
    };
  }
  if (
    addedCounters > 0 &&
    (ability || roles.some((role) => role.includes("economy")))
  ) {
    const cost = actionCreditCost(action);
    return {
      kind: "pool_build",
      immediateGain: 0,
      netCredits: cost > 0 ? -cost : 0,
      storedCredits,
      futurePoolAfter,
      ability: ability || "counter_build",
    };
  }
  if (roles.some((role) => role.includes("economy")) && ability) {
    return {
      kind: "side_economy",
      immediateGain: 0,
      netCredits: -actionCreditCost(action),
      storedCredits,
      futurePoolAfter,
      ability,
    };
  }
  return undefined;
}

function runnerInstalledEconomyAbilityId(
  action: LegalAction,
  sourceCard: VisibleCard,
): string {
  if (typeof action.payload?.resourceAbility === "string")
    return action.payload.resourceAbility;
  if (action.type !== "activated_card_ability") return "";
  const label =
    typeof action.payload?.cardImplementationAbilityLabel === "string"
      ? action.payload.cardImplementationAbilityLabel
      : action.label;
  if (sourceCard.definitionId === "onr_v1_154_broker") {
    if (/auf Broker legen/i.test(label)) return "broker_load_credits";
    if (/von Broker nehmen/i.test(label)) return "broker_take_credits";
  }
  if (
    sourceCard.definitionId === "onr_v1_178_short-term-contract" &&
    /Credits?\s+nehmen/i.test(label)
  )
    return "short_term_contract_take_credits";
  return "";
}

function activatedRunnerEconomyCreditGain(
  action: LegalAction,
  sourceCard: VisibleCard,
  storedCredits: number,
): number {
  if (action.type !== "activated_card_ability") return 0;
  const label =
    typeof action.payload?.cardImplementationAbilityLabel === "string"
      ? action.payload.cardImplementationAbilityLabel
      : action.label;
  if (
    sourceCard.definitionId === "onr_v1_154_broker" &&
    /von Broker nehmen/i.test(label)
  )
    return storedCredits;
  const amount = runnerCreditGainLabelAmount(label);
  return Math.min(storedCredits, amount);
}

function runnerInstalledHintActionCreditGain(
  input: AiDecisionInput,
  action: LegalAction,
  sourceCard: VisibleCard,
): number {
  if (
    action.type !== "activated_card_ability" &&
    action.type !== "trigger_ability"
  )
    return 0;
  if (!sourceCard.definitionId) return 0;
  const hint = AI_HINTS.get(sourceCard.definitionId);
  const directActionAmounts = runnerHintActionCreditAmounts(
    sourceCard,
    "action_economy",
  );
  const economyAmounts = runnerHintActionCreditAmounts(sourceCard, "economy");
  const allAmounts = [...directActionAmounts, ...economyAmounts];
  if (!hint || allAmounts.length === 0) return 0;

  const labelAmount = runnerCreditGainLabelAmount(
    typeof action.payload?.cardImplementationAbilityLabel === "string"
      ? action.payload.cardImplementationAbilityLabel
      : action.label,
  );
  if (labelAmount > 0) {
    if (allAmounts.includes(labelAmount)) return labelAmount;
    if (directActionAmounts.length > 0)
      return Math.max(labelAmount, ...directActionAmounts);
    return labelAmount;
  }

  if (directActionAmounts.length > 0) return Math.max(...directActionAmounts);
  const sourceAbilityActionCount = input.legalActions.filter(
    (candidate) =>
      candidate.source === action.source &&
      (candidate.type === "activated_card_ability" ||
        candidate.type === "trigger_ability"),
  ).length;
  return sourceAbilityActionCount === 1 ? Math.max(...economyAmounts) : 0;
}

function runnerHintActionCreditAmounts(
  sourceCard: VisibleCard,
  kind: "action_economy" | "economy",
): number[] {
  if (!sourceCard.definitionId) return [];
  const hint = AI_HINTS.get(sourceCard.definitionId);
  return (hint?.effects ?? [])
    .filter(
      (effect) =>
        effect.kind === kind &&
        effect.timing === "action" &&
        effect.scope === "runner" &&
        effect.resource === "credits",
    )
    .map((effect) => effect.amount ?? 0)
    .filter((amount) => Number.isFinite(amount) && amount > 0);
}

function runnerCreditGainLabelAmount(label: string): number {
  const match = /(\d+)\s+Credits?\s+nehmen/i.exec(label);
  if (!match) return 0;
  const amount = Number(match[1]);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

function activatedRunnerEconomyCreditBuild(
  action: LegalAction,
  sourceCard: VisibleCard,
): number {
  if (action.type !== "activated_card_ability") return 0;
  const label =
    typeof action.payload?.cardImplementationAbilityLabel === "string"
      ? action.payload.cardImplementationAbilityLabel
      : action.label;
  if (
    sourceCard.definitionId !== "onr_v1_154_broker" ||
    !/auf Broker legen/i.test(label)
  )
    return 0;
  const match = /(\d+)\s+Credits?/i.exec(label);
  const amount = Number(match?.[1] ?? 0);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

function buildCandidate(
  input: AiDecisionInput,
  kind: RunnerPlanKind,
  actions: LegalAction[],
): RunnerPlanCandidate | null {
  const legalActions = actions.filter(
    (action) => action.side === "runner" && PLAN_ACTION_TYPES.has(action.type),
  );
  if (legalActions.length === 0) return null;
  const steps = legalActions.map((action, index) => ({
    stepId: `${kind}:step:${index + 1}`,
    actionId: action.actionId,
    actionType: action.type,
    ...(typeof action.payload?.serverId === "string"
      ? { targetServerId: action.payload.serverId }
      : {}),
    roleTags: rolesForAction(input, action),
  }));
  const requiredRoles = sortedUnique(steps.flatMap((step) => step.roleTags));
  return {
    planId: `${kind}:${legalActions
      .map((action) => action.actionId)
      .sort()
      .join("|")}`,
    kind,
    legalActionIds: legalActions.map((action) => action.actionId).sort(),
    steps,
    visibleBenefits: visibleBenefitsForPlan(kind),
    visibleRisks: visibleRisksForPlan(kind, requiredRoles),
    uncertainty: uncertaintyForPlan(kind),
    requiredRoles,
  };
}

function selectPlanAction(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
): LegalAction | undefined {
  const actions = candidate.legalActionIds
    .map((actionId) =>
      input.legalActions.find((action) => action.actionId === actionId),
    )
    .filter((action): action is LegalAction => Boolean(action));
  const selectableActions = actions.filter(
    (action) => !runnerPlanActionExclusion(input, candidate.kind, action),
  );
  return (selectableActions.length > 0 ? selectableActions : actions)
    .sort(
      (left, right) =>
        actionPriority(candidate.kind, right, input) -
          actionPriority(candidate.kind, left, input) ||
        compareAction(left, right),
    )[0];
}

function runnerActionAlternativesForPlan(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
  selectedActionId: string,
): AiDecisionActionAlternative[] {
  return candidate.legalActionIds
    .map((actionId) =>
      input.legalActions.find((action) => action.actionId === actionId),
    )
    .filter((action): action is LegalAction => Boolean(action))
    .map((action) => ({
      action,
      exclusion: runnerPlanActionExclusion(input, candidate.kind, action),
      priority: actionPriority(candidate.kind, action, input),
    }))
    .sort(
      (left, right) =>
        Number(Boolean(left.exclusion)) - Number(Boolean(right.exclusion)) ||
        right.priority - left.priority ||
        compareAction(left.action, right.action),
    )
    .slice(0, 8)
    .map((entry, index) =>
      runnerActionAlternativeForAction(
        input,
        candidate.kind,
        entry.action,
        entry.priority,
        entry.exclusion,
        entry.action.actionId === selectedActionId,
        index + 1,
      ),
    );
}

function runnerActionAlternativeForAction(
  input: AiDecisionInput,
  kind: RunnerPlanKind,
  action: LegalAction,
  priority: number,
  exclusion: string | undefined,
  selected: boolean,
  rank: number,
): AiDecisionActionAlternative {
  const sourceCard =
    action.source !== "basic_action" && action.source !== "game_rule"
      ? findVisibleCard(input, action.source)
      : undefined;
  const sourceTitle =
    sourceCard && isDebugPublicSourceCard(input, sourceCard.instanceId)
      ? sourceCard.title
      : undefined;
  const installedEconomy = classifyInstalledEconomyAction(input, action);
  const economyNeed = input.playerView.own.credits < 4 ? "acute" : "stable";
  const economy =
    kind === "recover_economy" && action.type === "gain_credit"
      ? {
          economyKind: "basic_credit",
          immediateGain: 1,
          netCredits: 1,
          storedCredits: 0,
          futurePoolAfter: 0,
          economyNeed,
        }
      : installedEconomy
        ? {
            economyKind: installedEconomy.kind,
            ability: installedEconomy.ability,
            immediateGain: installedEconomy.immediateGain,
            netCredits: installedEconomy.netCredits,
            storedCredits: installedEconomy.storedCredits,
            futurePoolAfter: installedEconomy.futurePoolAfter,
            economyNeed,
          }
        : undefined;
  return {
    rank,
    actionId: action.actionId,
    actionType: action.type,
    label:
      sourceTitle ||
      action.source === "basic_action" ||
      action.source === "game_rule"
        ? action.label
        : action.type,
    source: sourceCard
      ? sourceTitle
        ? "visible_card"
        : "private_card"
      : action.source,
    ...(sourceTitle ? { sourceTitle } : {}),
    selected,
    ...(exclusion ? { excluded: true } : { priority: roundScore(priority) }),
    ...(selected
      ? { whyChosen: runnerActionWhy(input, action, installedEconomy, true) }
      : {
          whyNot: exclusion
            ? [`semantic_excluded:${exclusion}`]
            : runnerActionWhy(input, action, installedEconomy, false)
        }),
    ...(economy ? { economy } : {}),
  };
}

function isDebugPublicSourceCard(
  input: AiDecisionInput,
  instanceId: string,
): boolean {
  const ownPublicCards = [
    input.playerView.own.scoreArea,
    ...(input.playerView.own.rig ? [input.playerView.own.rig] : []),
    ...input.playerView.servers.map((server) => [
      ...server.ice,
      ...server.root,
    ]),
  ];
  const opponentPublicCards = [
    input.playerView.opponent.scoreArea,
    ...(input.playerView.opponent.rig ? [input.playerView.opponent.rig] : []),
  ];
  return [...ownPublicCards, ...opponentPublicCards].some((cards) =>
    cards.some((card) => card.instanceId === instanceId && card.known),
  );
}

function runnerActionWhy(
  input: AiDecisionInput,
  action: LegalAction,
  installedEconomy: InstalledEconomyActionAssessment | undefined,
  selected: boolean,
): string[] {
  if (selected) return ["selected_action"];
  if (action.type === "gain_credit")
    return ["basic_credit_lower_action_priority"];
  if (!installedEconomy) return ["lower_action_priority"];
  if (installedEconomy.kind === "pool_build") {
    return input.playerView.own.credits < 4
      ? ["pool_build_deferred_for_credit_need"]
      : ["pool_build_future_value_below_selected_action"];
  }
  if (installedEconomy.kind === "pool_payout")
    return ["pool_payout_lower_action_priority"];
  if (installedEconomy.kind === "direct_payout")
    return ["direct_payout_lower_action_priority"];
  return ["side_economy_lower_action_priority"];
}

function runnerPlanActionExclusion(
  input: AiDecisionInput,
  kind: RunnerPlanKind,
  action: LegalAction,
  features?: RunnerFeatures,
): string | undefined {
  const runPlan =
    kind === "contest_remote" ||
    kind === "pressure_rnd" ||
    kind === "pressure_hq" ||
    kind === "safe_probe_run";
  if (!runPlan || action.type !== "start_run") return undefined;
  const runnerFeatures = features ?? extractRunnerFeatures(input);
  return runnerRunActionIsKnownNoAccess(input, action, runnerFeatures)
    ? "known_ice_path_no_access"
    : undefined;
}

function actionPriority(
  kind: RunnerPlanKind,
  action: LegalAction,
  input: AiDecisionInput,
): number {
  const reachedAccessMovement = runnerReachedAccessMovement(input);
  const affordableMovement = runnerCanAffordCurrentMovementIce(input);
  if (kind === "trash_asset" && action.type === "trash_accessed_card")
    return 100;
  if (kind === "contest_remote" && action.type === "start_run") {
    const features = extractRunnerFeatures(input);
    if (runnerPlanActionExclusion(input, kind, action, features)) return 0;
    const serverId =
      typeof action.payload?.serverId === "string"
        ? action.payload.serverId
        : "";
    if (serverId.startsWith("remote_")) {
      const profile = runnerRemoteContestProfile(input, serverId);
      return (
        90 +
        (profile.contestable ? 80 : 0) +
        (profile.advanced ? 30 : 0) +
        (profile.relevantTrash ? 18 : 0) -
        (profile.blockedByPostRunReserve ? 45 : 0) -
        (profile.blockedByKnownIceCost || profile.blockedByBreakerCoverage
          ? 80
          : 0)
      );
    }
    return 90;
  }
  if (
    (kind === "pressure_rnd" ||
      kind === "pressure_hq" ||
      kind === "safe_probe_run") &&
    action.type === "start_run"
  ) {
    const features = extractRunnerFeatures(input);
    if (runnerPlanActionExclusion(input, kind, action, features)) return 0;
    const target =
      typeof action.payload?.serverId === "string"
        ? action.payload.serverId
        : "";
    if (target === "hq" || target === "rd" || target === "archives") {
      const beliefState = reconstructBeliefState(input);
      const goodTarget = centralPressureTargetIsGood(
        input,
        target,
        features,
        beliefState,
      );
      const installedInterface = (input.playerView.own.rig ?? []).some((card) =>
        centralPressureCardSupportsTarget(card.definitionId, target, true),
      );
      return 90 + (goodTarget ? 24 : -12) + (installedInterface ? 34 : 0);
    }
    return 90;
  }
  if (kind === "safe_probe_run" && action.type === "continue_run")
    return reachedAccessMovement ||
      affordableMovement ||
      runnerShouldContinueCurrentRemoteRun(input)
      ? 92
      : 70;
  if (kind === "safe_probe_run" && action.type === "jack_out")
    return reachedAccessMovement ||
      affordableMovement ||
      runnerShouldContinueCurrentRemoteRun(input)
      ? 30
      : 88;
  if (kind === "safe_probe_run" && action.type === "play_event") {
    const eventTarget = centralPressureTargetForAction(input, action);
    const goodTarget = eventTarget
      ? centralPressureTargetIsGood(
          input,
          eventTarget,
          extractRunnerFeatures(input),
          reconstructBeliefState(input),
        )
      : false;
    return rolesForAction(input, action).some(isRunnerPressureRole)
      ? goodTarget
        ? 104
        : 38
      : 45;
  }
  if (kind === "build_rig" && action.type === "install_card")
    return runnerInstallPriority(input, action);
  if (kind === "build_rig" && runnerCoverageSearchAction(input, action)) {
    const pressure = assessVisibleBreakerPressure(input);
    const recovery = runnerCoverageRecoveryAction(input, action);
    const relevant =
      pressure.searchActionIds.has(action.actionId) ||
      pressure.recoveryActionIds.has(action.actionId);
    return (
      76 +
      (relevant ? 58 : 0) +
      (recovery && pressure.heapMatchingBreakerCount > 0 ? 28 : 0) +
      Math.max(0, 5 - actionCreditCost(action)) * 4
    );
  }
  if (
    kind === "build_rig" &&
    (action.type === "trigger_ability" ||
      action.type === "activated_card_ability")
  )
    return runnerShellTradersPriority(input, action);
  if (kind === "recover_economy" && action.type === "play_event") return 80;
  if (
    kind === "recover_economy" &&
    (action.type === "trigger_ability" ||
      action.type === "activated_card_ability")
  )
    return runnerInstalledEconomyPriority(input, action);
  if (kind === "recover_economy" && action.type === "gain_credit") return 65;
  if (kind === "draw_for_answers" && action.type === "play_event") return 70;
  if (kind === "draw_for_answers" && action.type === "draw_card") return 60;
  return 10;
}

function runnerReachedAccessMovement(input: AiDecisionInput): boolean {
  const run = input.playerView.run;
  return (
    input.playerView.timingPoint === "run.jack_out_window" &&
    run?.phase === "movement" &&
    run.position?.kind === "server"
  );
}

function runnerCanAffordCurrentMovementIce(input: AiDecisionInput): boolean {
  const run = input.playerView.run;
  if (
    input.playerView.timingPoint !== "run.jack_out_window" ||
    run?.phase !== "movement" ||
    run.position?.kind !== "ice"
  )
    return false;
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === run.position?.serverId,
  );
  const ice = server?.ice[run.position.iceIndex];
  if (!ice?.known || ice.rezzed !== true) return false;
  return !assessKnownRezzedIcePath(
    [ice],
    input.playerView.own.rig ?? [],
    input.playerView.own.credits,
    server?.root ?? [],
  ).blocked;
}

function runnerShouldContinueCurrentRemoteRun(input: AiDecisionInput): boolean {
  const run = input.playerView.run;
  if (
    input.playerView.timingPoint !== "run.jack_out_window" ||
    run?.phase !== "movement" ||
    run.position?.kind !== "ice" ||
    !run.attackedServerId.startsWith("remote_")
  )
    return false;
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === run.attackedServerId,
  );
  if (!server || server.root.length === 0) return false;
  const currentIce = server.ice[run.position.iceIndex];
  if (currentIce?.known && currentIce.rezzed === true) {
    return runnerCanAffordCurrentMovementIce(input);
  }
  const profile = runnerRemoteContestProfile(input, run.attackedServerId);
  return (
    (profile.contestable || profile.relevantTrash) &&
    !profile.blockedByBreakerCoverage &&
    !profile.blockedByKnownIceCost &&
    !profile.blockedByPostRunReserve
  );
}

function extractRunnerFeatures(input: AiDecisionInput): RunnerFeatures {
  const rigCards = input.playerView.own.rig ?? [];
  const rigRoles = new Set(
    rigCards.flatMap((card) => rolesForCardId(card.definitionId)),
  );
  const handRoles = new Set(
    input.playerView.own.gripOrHq.flatMap((card) =>
      rolesForCardId(card.definitionId),
    ),
  );
  const serverFeatures = new Map(
    input.playerView.servers.map((server) => [
      server.id,
      {
        iceCount: server.ice.length,
        rootCount: server.root.length,
        knownRootCount: server.root.filter((card) => card.known).length,
        rezzedIceCount: server.ice.filter((card) => card.rezzed === true)
          .length,
        advancedRootCount: server.root.filter(
          (card) => (card.advancementCounters ?? 0) > 0,
        ).length,
      },
    ]),
  );
  const blockedRunServers = new Set<string>();
  const visibleRunBreakCosts = new Map<string, number>();
  const visibleRunFullPathAssessments = new Map<
    string,
    KnownRezzedIcePathAssessment
  >();
  for (const server of input.playerView.servers) {
    const assessment = assessKnownRezzedIcePath(
      server.ice,
      rigCards,
      input.playerView.own.credits,
      server.root,
    );
    visibleRunFullPathAssessments.set(server.id, assessment);
    if (assessment.visibleBreakCost !== undefined) {
      visibleRunBreakCosts.set(server.id, assessment.visibleBreakCost);
    }
    if (assessment.blocked) blockedRunServers.add(server.id);
  }
  return {
    credits: input.playerView.own.credits,
    clicks: input.playerView.own.clicks,
    tags: input.playerView.own.tags,
    citySurveillanceSourceCount: visibleCitySurveillanceSourceCount(input),
    memoryRemaining:
      (input.playerView.own.memoryLimit ?? 0) -
      (input.playerView.own.memoryUsed ?? 0),
    handCount: input.playerView.own.gripOrHq.length,
    rigRoles,
    handRoles,
    serverFeatures,
    blockedRunServers,
    visibleRunBreakCosts,
    visibleRunFullPathAssessments,
  };
}

function rolesForAction(input: AiDecisionInput, action: LegalAction): string[] {
  if (action.source === "basic_action" || action.source === "game_rule")
    return [];
  const visible = findVisibleCard(input, action.source);
  return rolesForCardId(visible?.definitionId);
}

function findVisibleCard(
  input: AiDecisionInput,
  instanceId: string,
): VisibleCard | undefined {
  const zones = [
    input.playerView.own.gripOrHq,
    input.playerView.own.heapOrArchives,
    input.playerView.own.scoreArea,
    ...(input.playerView.own.rig ?? []),
    ...input.playerView.servers.flatMap((server) => [server.ice, server.root]),
  ];
  return zones
    .flat()
    .find((card) => card.instanceId === instanceId && card.known);
}

function visibleCitySurveillanceSourceCount(input: AiDecisionInput): number {
  return input.playerView.servers.reduce(
    (count, server) =>
      count +
      server.root.filter(
        (card) =>
          card.known &&
          card.rezzed === true &&
          card.definitionId === "onr_v1_313_city-surveillance",
      ).length,
    0,
  );
}

function rolesForCardId(cardId: string | undefined): string[] {
  if (!cardId || !isAiSupportedCard(cardId)) return [];
  const roleRecord = CARD_ROLES_BY_CARD.get(cardId);
  const hint = AI_HINTS.get(cardId);
  return sortedUnique([
    ...(roleRecord?.roles ?? []),
    ...(hint?.roles ?? []),
    ...(hint?.planRoles ?? []),
  ]);
}

function lowReserveInstallPenalty(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
  credits: number,
): number {
  const installActions = candidate.legalActionIds
    .map((actionId) =>
      input.legalActions.find((action) => action.actionId === actionId),
    )
    .filter((action): action is LegalAction => action?.type === "install_card");
  if (installActions.length === 0) return 0;
  const bestRemainingCredits = Math.max(
    ...installActions.map((action) => credits - actionCreditCost(action)),
  );
  return bestRemainingCredits < 2 ? 460 : 0;
}

function bestRemainingCreditsForCandidateActions(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
  predicate: (action: LegalAction) => boolean,
): number {
  const remainingCredits = candidate.legalActionIds
    .map((actionId) =>
      input.legalActions.find((action) => action.actionId === actionId),
    )
    .filter((action): action is LegalAction => Boolean(action))
    .filter((action) => predicate(action))
    .map((action) => input.playerView.own.credits - actionCreditCost(action));
  return remainingCredits.length > 0
    ? Math.max(...remainingCredits)
    : Number.NEGATIVE_INFINITY;
}

function runnerHandUseOpportunity(
  input: AiDecisionInput,
): RunnerHandUseOpportunity {
  const actions = input.legalActions.filter(
    (action) => action.side === "runner",
  );
  const features = extractRunnerFeatures(input);
  return {
    playableEconomyActionCount: actions.filter((action) =>
      isRunnerPlayableEconomyAction(input, action),
    ).length,
    installableBreakerActionCount: actions.filter((action) =>
      isRunnerInstallableRelevantBreaker(input, action),
    ).length,
    runnablePressureActionCount: actions.filter((action) =>
      isRunnerRunnablePressureAction(input, action, features),
    ).length,
    remoteTrashActionCount: actions.filter((action) =>
      isRunnerRemoteTrashAction(input, action),
    ).length,
    drawDiscardPressure:
      input.playerView.own.gripOrHq.length + 1 >=
      input.playerView.own.maxHandSize,
    lowValueDuplicateInstallCount: actions.filter((action) =>
      isRunnerLowValueDuplicateInstall(input, action),
    ).length,
  };
}

function isRunnerPlayableEconomyAction(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  if (action.side !== "runner") return false;
  if (action.type === "gain_credit") return input.playerView.own.credits < 4;
  if (
    action.type !== "play_event" &&
    action.type !== "install_card" &&
    action.type !== "trigger_ability" &&
    action.type !== "activated_card_ability"
  )
    return false;
  return rolesForAction(input, action).some(isRunnerEconomyRole);
}

function isRunnerInstallableRelevantBreaker(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  if (action.type !== "install_card") return false;
  const definitionId = sourceDefinitionIdForAction(input, action);
  if (breakerCardBlocksAccessReachability(definitionId)) return false;
  const roles = rolesForAction(input, action).filter((role) =>
    role.startsWith("breaker_"),
  );
  const features = extractRunnerFeatures(input);
  if (roles.length > 0 && roles.some((role) => !features.rigRoles.has(role)))
    return true;
  const profile = getStructuredBreakerProfileForCard(definitionId);
  if (!profile) return false;
  const installedCoverage = new Set(
    (input.playerView.own.rig ?? []).flatMap(
      (card) => {
        if (breakerCardBlocksAccessReachability(card.definitionId)) return [];
        return getStructuredBreakerProfileForCard(card.definitionId)?.coverage ?? [];
      },
    ),
  );
  return (profile.coverage ?? []).some(
    (coverage) => !installedCoverage.has(coverage),
  );
}

function isStructuredBreakerInstallAction(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  if (action.type !== "install_card") return false;
  const definitionId = sourceDefinitionIdForAction(input, action);
  return Boolean(
    definitionId &&
      !breakerCardBlocksAccessReachability(definitionId) &&
      estimateBreakerCostProfileFromOntology(definitionId),
  );
}

function isRunnerRunnablePressureAction(
  input: AiDecisionInput,
  action: LegalAction,
  features: RunnerFeatures = extractRunnerFeatures(input),
): boolean {
  if (action.side !== "runner") return false;
  const roles = rolesForAction(input, action);
  if (
    (action.type === "play_event" || action.type === "install_card") &&
    roles.some(isRunnerPressureRole)
  )
    return true;
  if (action.type !== "start_run") return false;
  const serverId =
    typeof action.payload?.serverId === "string" ? action.payload.serverId : "";
  if (!serverId || features.blockedRunServers.has(serverId)) return false;
  const server = features.serverFeatures.get(serverId);
  if (serverId.startsWith("remote_") && (server?.rootCount ?? 0) === 0)
    return false;
  return features.credits >= 3 || (server?.iceCount ?? 0) === 0;
}

function isRunnerRemoteTrashAction(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  return (
    action.side === "runner" &&
    action.type === "trash_accessed_card" &&
    input.playerView.run?.attackedServerId.startsWith("remote_") === true
  );
}

function runnerCentralPressureOpportunity(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
  beliefState: BeliefState,
): RunnerCentralPressureOpportunity {
  const features = extractRunnerFeatures(input);
  const candidateTarget = centralTargetForCandidate(input, candidate);
  const fallbackTarget =
    candidateTarget ??
    bestCentralPressureTargetForVisibleBoard(input, features, beliefState);
  const target = fallbackTarget;
  const estimate = target
    ? runnerKnownPathEstimate(input, target, features)
    : undefined;
  const server = target
    ? input.playerView.servers.find(
        (candidateServer) => candidateServer.id === target,
      )
    : undefined;
  const visibleBreakCost = estimate?.visibleBreakCost ?? 0;
  const creditsAfterPath =
    estimate?.creditsAfterPath ??
    input.playerView.own.credits - visibleBreakCost;
  const accessReachable = estimate?.canReachAccess !== false;
  const reserveTarget = runnerCreditReserveTargetForPlanInput(input, features);
  const installedCards = input.playerView.own.rig ?? [];
  const matchingInterfaceInstalled =
    target !== undefined &&
    installedCards.some((card) =>
      centralPressureCardSupportsTarget(card.definitionId, target, true),
    );
  const anyInterfaceInstalled = installedCards.some((card) =>
    isCentralPressureCard(card.definitionId, true),
  );
  const multiaccessInstalled = installedCards.some((card) =>
    rolesForCardId(card.definitionId).some((role) =>
      role.includes("multiaccess"),
    ),
  );
  const installActions = input.legalActions.filter(
    (action) => action.type === "install_card" && action.side === "runner",
  );
  const matchingPressureInstallActions = installActions.filter((action) => {
    const definitionId = sourceDefinitionIdForAction(input, action);
    return (
      definitionId !== undefined &&
      (target
        ? centralPressureCardSupportsTarget(definitionId, target, true)
        : isCentralPressureCard(definitionId, true))
    );
  }).length;
  const runEvents = input.legalActions.filter(
    (action) =>
      action.side === "runner" &&
      action.type === "play_event" &&
      rolesForAction(input, action).some(isRunnerPressureRole),
  );
  const matchingRunEvents = runEvents.filter((action) => {
    const eventTarget = centralPressureTargetForAction(input, action);
    return eventTarget !== undefined && (!target || eventTarget === target);
  }).length;
  const runEventHasGoodTarget = runEvents.some((action) => {
    const eventTarget = centralPressureTargetForAction(input, action);
    return (
      eventTarget !== undefined &&
      centralPressureTargetIsGood(input, eventTarget, features, beliefState)
    );
  });
  const closeout = target
    ? runnerCentralCloseoutProfile(input, target, beliefState, {
        matchingInterfaceInstalled:
          accessReachable && matchingInterfaceInstalled,
        anyInterfaceInstalled: accessReachable && anyInterfaceInstalled,
        multiaccessInstalled: accessReachable && multiaccessInstalled,
        matchingRunEvents: accessReachable ? matchingRunEvents : 0,
        runEventHasGoodTarget: accessReachable && runEventHasGoodTarget,
        remoteThreatLessValuable: true,
      })
    : { opportunity: false, reasons: [] };
  const repeatedFreshValue =
    target !== undefined &&
    centralRepeatHasFreshValue(input, target, beliefState, {
      matchingInterfaceInstalled: accessReachable && matchingInterfaceInstalled,
      anyInterfaceInstalled: accessReachable && anyInterfaceInstalled,
      multiaccessInstalled: accessReachable && multiaccessInstalled,
      runEventHasGoodTarget: accessReachable && runEventHasGoodTarget,
      closeoutOpportunity: closeout.opportunity,
    });
  const repeatedLowValue =
    target !== undefined &&
    isRepeatedLowValueCentralPressure(input, target, beliefState) &&
    !matchingInterfaceInstalled &&
    !runEventHasGoodTarget &&
    !repeatedFreshValue;
  const openOrCheap = Boolean(
    target && (visibleBreakCost <= 1 || (server?.ice.length ?? 0) === 0),
  );
  const preservesReserve = creditsAfterPath >= reserveTarget;
  const remoteProfiles = input.legalActions
    .filter(
      (action) =>
        action.type === "start_run" &&
        typeof action.payload?.serverId === "string" &&
        action.payload.serverId.startsWith("remote_"),
    )
    .map((action) =>
      runnerRemoteContestProfile(
        input,
        String(action.payload?.serverId),
        features,
      ),
    );
  const contestableRemoteProfiles = remoteProfiles.filter(
    (profile) => profile.advanced && profile.contestable,
  );
  const remoteThreatLessValuable =
    contestableRemoteProfiles.length === 0 ||
    remoteProfiles.every(
      (profile) =>
        !profile.advanced ||
        profile.blockedByBreakerCoverage ||
        profile.blockedByKnownIceCost ||
        profile.blockedByPostRunReserve,
    );
  if (
    target &&
    contestableRemoteProfiles.length > 0 &&
    !remoteThreatLessValuable
  ) {
    const remoteAwareCloseout = runnerCentralCloseoutProfile(
      input,
      target,
      beliefState,
      {
        matchingInterfaceInstalled:
          accessReachable && matchingInterfaceInstalled,
        anyInterfaceInstalled: accessReachable && anyInterfaceInstalled,
        multiaccessInstalled: accessReachable && multiaccessInstalled,
        matchingRunEvents,
        runEventHasGoodTarget: accessReachable && runEventHasGoodTarget,
        remoteThreatLessValuable,
      },
    );
    closeout.opportunity = remoteAwareCloseout.opportunity;
    closeout.reasons = remoteAwareCloseout.reasons;
  }
  const centralPressureClear =
    target !== undefined &&
    !estimate?.blocked &&
    accessReachable &&
    openOrCheap &&
    preservesReserve &&
    centralPressureTargetIsGood(input, target, features, beliefState);
  return {
    ...(target ? { targetServerId: target } : {}),
    pathBlocked: estimate?.blocked === true,
    pathBlockedByUnbreakableIce:
      estimate?.unpayableReason === "ice_unbreakable",
    pathBlockedByMissingCoverage:
      estimate?.knownPathBlockedByMissingCoverage === true,
    pathBlockedByKnownEtr: estimate?.knownPathBlockedByEtr === true,
    accessReachable,
    visibleBreakCost,
    creditsAfterPath,
    reserveTarget,
    preservesReserve,
    openOrCheap,
    matchingInterfaceInstalled,
    anyInterfaceInstalled,
    multiaccessInstalled,
    matchingPressureInstallActions,
    matchingRunEvents,
    runEventHasGoodTarget,
    repeatedLowValue,
    repeatedFreshValue,
    closeoutOpportunity: closeout.opportunity,
    closeoutReasons: closeout.reasons,
    centralPressureClear,
    remoteContestableThreat: contestableRemoteProfiles.length > 0,
    remoteThreatLessValuable,
  };
}

function runnerNoFreshCentralSubstitutionContext(
  input: AiDecisionInput,
  beliefState: BeliefState,
): RunnerNoFreshCentralSubstitutionContext {
  const features = extractRunnerFeatures(input);
  const staleTargets = (["rd", "hq", "archives"] as const).filter((target) =>
    runnerCentralTargetIsNoFresh(input, target, beliefState, features),
  );
  const betterAlternatives = new Set<
    | "economy"
    | "rig_unlock"
    | "remote_contest"
    | "pressure_install"
    | "setup_search"
  >();
  if (staleTargets.length === 0) {
    return { staleTargets: [], betterAlternatives, allowedReasons: new Set() };
  }
  const reserveTarget = runnerCreditReserveTargetForPlanInput(input, features);
  if (
    features.credits <= reserveTarget &&
    input.legalActions.some((action) =>
      isRunnerPlayableEconomyAction(input, action),
    )
  ) {
    betterAlternatives.add("economy");
  }
  const remoteProfiles = input.legalActions
    .filter(
      (action) =>
        action.type === "start_run" &&
        typeof action.payload?.serverId === "string" &&
        action.payload.serverId.startsWith("remote_"),
    )
    .map((action) =>
      runnerRemoteContestProfile(
        input,
        String(action.payload?.serverId),
        features,
      ),
    );
  if (
    remoteProfiles.some((profile) => profile.advanced && profile.contestable)
  ) {
    betterAlternatives.add("remote_contest");
  }
  if (
    input.legalActions.some((action) =>
      runnerInstallUnlocksVisiblePath(input, action),
    )
  ) {
    betterAlternatives.add("rig_unlock");
  }
  if (
    input.legalActions.some((action) =>
      runnerPressureInstallCreatesNearTermCentral(input, action, beliefState),
    )
  ) {
    betterAlternatives.add("pressure_install");
  }
  if (
    input.legalActions.some((action) => runnerSetupSearchAction(input, action))
  ) {
    betterAlternatives.add("setup_search");
  }

  const allowedReasons = new Set<
    | "closeout"
    | "interface"
    | "multiaccess"
    | "remote_uncontestable"
    | "central_open"
    | "no_better_action"
  >();
  for (const target of staleTargets) {
    const installed = input.playerView.own.rig ?? [];
    if (
      installed.some((card) =>
        centralPressureCardSupportsTarget(card.definitionId, target, true),
      )
    )
      allowedReasons.add("interface");
    if (
      installed.some((card) =>
        rolesForCardId(card.definitionId).some((role) =>
          role.includes("multiaccess"),
        ),
      )
    )
      allowedReasons.add("multiaccess");
    if (runnerCentralCloseoutProfile(input, target, beliefState).opportunity)
      allowedReasons.add("closeout");
    const estimate = runnerKnownPathEstimate(input, target, features);
    const server = input.playerView.servers.find(
      (candidate) => candidate.id === target,
    );
    if (
      estimate &&
      !estimate.blocked &&
      (estimate.visibleBreakCost <= 0 || (server?.ice.length ?? 0) === 0)
    ) {
      allowedReasons.add("central_open");
    }
  }
  if (
    remoteProfiles.length === 0 ||
    remoteProfiles.every(
      (profile) =>
        !profile.advanced ||
        profile.blockedByBreakerCoverage ||
        profile.blockedByKnownIceCost ||
        profile.blockedByPostRunReserve,
    )
  ) {
    allowedReasons.add("remote_uncontestable");
  }
  if (betterAlternatives.size === 0) allowedReasons.add("no_better_action");
  return { staleTargets, betterAlternatives, allowedReasons };
}

function runnerCentralTargetIsNoFresh(
  input: AiDecisionInput,
  target: "hq" | "rd" | "archives",
  beliefState: BeliefState,
  features: RunnerFeatures,
): boolean {
  const action = input.legalActions.find(
    (candidate) =>
      candidate.type === "start_run" && candidate.payload?.serverId === target,
  );
  if (!action) return false;
  const estimate = runnerKnownPathEstimate(input, target, features);
  if (!estimate || estimate.blocked) return false;
  const installedCards = input.playerView.own.rig ?? [];
  const matchingInterfaceInstalled = installedCards.some((card) =>
    centralPressureCardSupportsTarget(card.definitionId, target, true),
  );
  const anyInterfaceInstalled = installedCards.some((card) =>
    isCentralPressureCard(card.definitionId, true),
  );
  const multiaccessInstalled = installedCards.some((card) =>
    rolesForCardId(card.definitionId).some((role) =>
      role.includes("multiaccess"),
    ),
  );
  const runEventHasGoodTarget = input.legalActions.some((candidate) => {
    if (candidate.side !== "runner" || candidate.type !== "play_event")
      return false;
    const eventTarget = centralPressureTargetForAction(input, candidate);
    return (
      eventTarget === target &&
      centralPressureTargetIsGood(input, target, features, beliefState)
    );
  });
  const closeout = runnerCentralCloseoutProfile(input, target, beliefState, {
    matchingInterfaceInstalled,
    anyInterfaceInstalled,
    multiaccessInstalled,
    runEventHasGoodTarget,
  }).opportunity;
  const fresh = centralRepeatHasFreshValue(input, target, beliefState, {
    matchingInterfaceInstalled,
    anyInterfaceInstalled,
    multiaccessInstalled,
    runEventHasGoodTarget,
    closeoutOpportunity: closeout,
  });
  return (
    isRepeatedLowValueCentralPressure(input, target, beliefState) &&
    !matchingInterfaceInstalled &&
    !multiaccessInstalled &&
    !runEventHasGoodTarget &&
    !closeout &&
    !fresh
  );
}

function runnerInstallUnlocksVisiblePath(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  if (action.side !== "runner" || action.type !== "install_card") return false;
  const definitionId = sourceDefinitionIdForAction(input, action);
  if (!definitionId) return false;
  const roles = rolesForCardId(definitionId);
  if (!roles.some((role) => role.startsWith("breaker_"))) return false;
  return input.playerView.servers.some((server) => {
    if (server.ice.length === 0) return false;
    const current = assessKnownRezzedIcePath(
      server.ice,
      input.playerView.own.rig ?? [],
      input.playerView.own.credits,
      server.root,
    );
    if (!current.blocked) return false;
    const after = assessKnownRezzedIcePath(
      server.ice,
      [
        ...(input.playerView.own.rig ?? []),
        {
          instanceId: `candidate:${definitionId}`,
          definitionId,
          name: definitionId,
          side: "runner",
          type: "program",
          known: true,
        } as VisibleCard,
      ],
      input.playerView.own.credits - actionCreditCost(action),
      server.root,
    );
    return !after.blocked;
  });
}

function runnerPressureInstallCreatesNearTermCentral(
  input: AiDecisionInput,
  action: LegalAction,
  beliefState: BeliefState,
): boolean {
  if (action.side !== "runner" || action.type !== "install_card") return false;
  const definitionId = sourceDefinitionIdForAction(input, action);
  if (!isCentralPressureCard(definitionId, true)) return false;
  const features = extractRunnerFeatures(input);
  return (["rd", "hq"] as const).some((target) => {
    if (!centralPressureCardSupportsTarget(definitionId, target, true))
      return false;
    const estimate = runnerKnownPathEstimate(input, target, features);
    if (!estimate || estimate.blocked) return false;
    return centralPressureTargetIsGood(input, target, features, beliefState);
  });
}

function runnerSetupSearchAction(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  if (action.side !== "runner") return false;
  if (action.type === "draw_card" && input.playerView.own.gripOrHq.length <= 2)
    return true;
  if (runnerCoverageSearchAction(input, action)) return true;
  if (action.type !== "play_event" && action.type !== "resolve_choice")
    return false;
  const roles = rolesForAction(input, action);
  return roles.some(
    (role) =>
      role === "draw" ||
      role === "setup" ||
      role.includes("search") ||
      role.includes("tutor"),
  );
}

function centralTargetForCandidate(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
): "hq" | "rd" | "archives" | undefined {
  const target = targetServerId(input, candidate);
  if (target === "hq" || target === "rd" || target === "archives")
    return target;
  if (candidate.kind === "pressure_hq") return "hq";
  if (candidate.kind === "pressure_rnd") return "rd";
  if (candidate.kind === "safe_probe_run") {
    return candidate.legalActionIds
      .map((actionId) =>
        input.legalActions.find((action) => action.actionId === actionId),
      )
      .map((action) =>
        action ? centralPressureTargetForAction(input, action) : undefined,
      )
      .find((serverId): serverId is "hq" | "rd" | "archives" =>
        Boolean(serverId),
      );
  }
  return undefined;
}

function bestCentralPressureTargetForVisibleBoard(
  input: AiDecisionInput,
  features: RunnerFeatures,
  beliefState: BeliefState,
): "hq" | "rd" | "archives" | undefined {
  const targets = (["rd", "hq", "archives"] as const)
    .map((target) => {
      const estimate = runnerKnownPathEstimate(input, target, features);
      return {
        target,
        score:
          (centralPressureTargetIsGood(input, target, features, beliefState)
            ? 100
            : 0) +
          (estimate?.canReachAccess === false
            ? estimate.unpayableReason === "ice_unbreakable"
              ? -1200
              : -500
            : 0) +
          ((features.visibleRunBreakCosts.get(target) ?? 0) <= 1 ? 30 : 0),
      };
    })
    .sort(
      (left, right) =>
        right.score - left.score || left.target.localeCompare(right.target),
    );
  return targets[0]?.score && targets[0].score > 0
    ? targets[0].target
    : undefined;
}

function centralPressureTargetForAction(
  input: AiDecisionInput,
  action: LegalAction,
): "hq" | "rd" | "archives" | undefined {
  if (typeof action.payload?.serverId === "string") {
    const serverId = action.payload.serverId;
    if (serverId === "hq" || serverId === "rd" || serverId === "archives")
      return serverId;
  }
  const definitionId = sourceDefinitionIdForAction(input, action);
  if (!definitionId) return undefined;
  if (centralPressureCardSupportsTarget(definitionId, "rd", false)) return "rd";
  if (centralPressureCardSupportsTarget(definitionId, "hq", false)) return "hq";
  if (centralPressureCardSupportsTarget(definitionId, "archives", false))
    return "archives";
  return undefined;
}

function isCentralPressureCard(
  definitionId: string | undefined,
  installedOnly: boolean,
): boolean {
  if (!definitionId) return false;
  const roles = rolesForCardId(definitionId);
  if (!roles.some(isRunnerPressureRole)) return false;
  if (!installedOnly) return true;
  const type =
    RUNTIME_CARDS[definitionId]?.type ?? DEMO_CARDS_BY_ID[definitionId]?.type;
  return type === "hardware" || type === "program" || type === "resource";
}

function centralPressureCardSupportsTarget(
  definitionId: string | undefined,
  target: "hq" | "rd" | "archives",
  installedOnly: boolean,
): boolean {
  if (!isCentralPressureCard(definitionId, installedOnly)) return false;
  const roles = rolesForCardId(definitionId);
  if (target === "rd") {
    if (definitionId === "onr_v1_139_r-and-d-interface") return true;
    if (roles.includes("pressure_rnd") || roles.includes("rnd_pressure"))
      return true;
  }
  if (target === "hq") {
    if (definitionId === "onr_v1_129_hq-interface") return true;
    if (roles.includes("pressure_hq") || roles.includes("hq_pressure"))
      return true;
  }
  if (target === "archives" && roles.includes("archives_pressure")) return true;
  return (
    roles.some((role) => role.includes("multiaccess")) &&
    (definitionId === "onr_v1_024_expert-schedule-analyzer" ||
      definitionId === "onr_v1_041_microtech-ai-interface" ||
      definitionId === "onr_v1_105_priority-wreck")
  );
}

function centralPressureTargetIsGood(
  input: AiDecisionInput,
  target: "hq" | "rd" | "archives",
  features: RunnerFeatures,
  beliefState: BeliefState,
): boolean {
  const estimate = runnerKnownPathEstimate(input, target, features);
  if (!estimate || estimate.blocked) return false;
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === target,
  );
  const cheap =
    estimate.visibleBreakCost <= 1 || (server?.ice.length ?? 0) === 0;
  const closeout = runnerCentralCloseoutProfile(
    input,
    target,
    beliefState,
  ).opportunity;
  if (target === "rd") {
    const freshness =
      beliefState.runnerOpponentModel?.rndTopFreshness?.freshness;
    return cheap && (closeout || freshness !== "stale_known_same_top");
  }
  if (target === "hq") {
    const handCount = input.playerView.opponent.handCount;
    const known = beliefState.runnerOpponentModel?.hqHandMemory;
    const lowKnownValue = isKnownLowValueHqHand(input, "hq", known);
    return cheap && (closeout || handCount >= 4 || !lowKnownValue);
  }
  const archives = input.playerView.servers.find(
    (candidate) => candidate.id === "archives",
  );
  return (
    cheap && archives?.root.some((card) => card.type === "agenda") === true
  );
}

function isRepeatedLowValueCentralPressure(
  input: AiDecisionInput,
  target: "hq" | "rd" | "archives",
  beliefState: BeliefState,
): boolean {
  const recentPenalty =
    target === "rd"
      ? staleKnownRndPlanPenalty(
          { kind: "pressure_rnd" } as RunnerPlanCandidate,
          target,
          beliefState.runnerOpponentModel?.rndTopFreshness,
        )
      : 0;
  if (recentPenalty > 0) return true;
  const history = mergedPublicHistory(input);
  const lastSameCentralRun = findLastIndex(
    history,
    (event) =>
      serverIdFromEvent(event) === target &&
      (event.publicPayload.actionType === "start_run" ||
        event.type === "run_started"),
  );
  if (lastSameCentralRun < 0) return false;
  const last = history[lastSameCentralRun];
  if (!last || input.playerView.stateVersion - eventVersion(last) > 8)
    return false;
  const after = history.slice(lastSameCentralRun + 1);
  if (target === "hq" && after.some(eventMayChangeHqPressure)) return false;
  if (target === "rd" && after.some(eventMayChangeRndPressure)) return false;
  if (
    after.some(
      (event) =>
        event.type === "steal_agenda" ||
        event.publicPayload.actionType === "steal_agenda",
    )
  )
    return false;
  return true;
}

function eventMayChangeHqPressure(event: PublicGameEvent): boolean {
  const actionType =
    typeof event.publicPayload.actionType === "string"
      ? event.publicPayload.actionType
      : event.type;
  return (
    actionType === "draw_card" ||
    actionType === "mandatory_draw" ||
    actionType === "install_card" ||
    actionType === "play_operation"
  );
}

function eventMayChangeRndPressure(event: PublicGameEvent): boolean {
  const actionType =
    typeof event.publicPayload.actionType === "string"
      ? event.publicPayload.actionType
      : event.type;
  return (
    actionType === "draw_card" ||
    actionType === "mandatory_draw" ||
    actionType === "reorder_cards" ||
    actionType === "shuffle_stack" ||
    actionType === "steal_agenda" ||
    actionType === "trash_accessed_card" ||
    actionType === "move_to_removed_from_game" ||
    actionType === "move_to_set_aside"
  );
}

function runnerCentralCloseoutProfile(
  input: AiDecisionInput,
  target: "hq" | "rd" | "archives",
  beliefState: BeliefState,
  context: {
    matchingInterfaceInstalled?: boolean;
    anyInterfaceInstalled?: boolean;
    multiaccessInstalled?: boolean;
    matchingRunEvents?: number;
    runEventHasGoodTarget?: boolean;
    remoteThreatLessValuable?: boolean;
  } = {},
): { opportunity: boolean; reasons: string[] } {
  const pointsNeeded =
    input.playerView.agendaPointsToWin - input.playerView.own.agendaPoints;
  if (pointsNeeded > 2) return { opportunity: false, reasons: [] };
  const features = extractRunnerFeatures(input);
  const estimate = runnerKnownPathEstimate(input, target, features);
  if (!estimate || estimate.blocked) return { opportunity: false, reasons: [] };
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === target,
  );
  const visibleBreakCost = estimate.visibleBreakCost;
  const openOrCheap = visibleBreakCost <= 1 || (server?.ice.length ?? 0) === 0;
  const preservesReserve =
    estimate.creditsAfterPath >=
    runnerCreditReserveTargetForPlanInput(input, features);
  if (target === "archives") {
    const archives = input.playerView.servers.find(
      (server) => server.id === "archives",
    );
    const visibleAgenda =
      archives?.root.some((card) => card.known && card.type === "agenda") ===
      true;
    return {
      opportunity: visibleAgenda && openOrCheap,
      reasons: visibleAgenda ? ["archives_visible_agenda"] : [],
    };
  }
  const installedPressure =
    context.matchingInterfaceInstalled === true ||
    context.multiaccessInstalled === true ||
    context.anyInterfaceInstalled === true;
  const runEventPressure =
    (context.matchingRunEvents ?? 0) > 0 &&
    context.runEventHasGoodTarget === true;
  const hqPressure =
    target === "hq" &&
    (input.playerView.opponent.handCount >= 5 ||
      beliefState.runnerOpponentModel?.hqHandMemory?.knownDefinitions.some(
        (definitionId) => cardDefinitionType(definitionId) === "agenda",
      ) === true);
  const rndFreshness =
    target === "rd" &&
    beliefState.runnerOpponentModel?.rndTopFreshness?.freshness === "fresh";
  const remoteLowThreat = context.remoteThreatLessValuable === true;
  const reasons = [
    ...(pointsNeeded <= 2 ? ["near_win"] : []),
    ...(installedPressure ? ["multiaccess_or_interface"] : []),
    ...(runEventPressure ? ["run_event_pressure"] : []),
    ...(hqPressure ? ["hq_pressure"] : []),
    ...(rndFreshness ? ["rnd_freshness"] : []),
    ...(remoteLowThreat ? ["remote_uncontestable_or_low_value"] : []),
  ];
  const hasSpecificPressure =
    installedPressure || runEventPressure || hqPressure || rndFreshness;
  return {
    opportunity:
      openOrCheap &&
      (preservesReserve || installedPressure || runEventPressure) &&
      pointsNeeded <= 2 &&
      hasSpecificPressure,
    reasons,
  };
}

function centralRepeatHasFreshValue(
  input: AiDecisionInput,
  target: "hq" | "rd" | "archives",
  beliefState: BeliefState,
  context: {
    matchingInterfaceInstalled: boolean;
    anyInterfaceInstalled: boolean;
    multiaccessInstalled: boolean;
    runEventHasGoodTarget: boolean;
    closeoutOpportunity: boolean;
  },
): boolean {
  if (
    context.matchingInterfaceInstalled ||
    context.multiaccessInstalled ||
    context.runEventHasGoodTarget ||
    context.closeoutOpportunity
  )
    return true;
  const history = mergedPublicHistory(input);
  const lastSameCentralRun = findLastIndex(
    history,
    (event) =>
      serverIdFromEvent(event) === target &&
      (event.publicPayload.actionType === "start_run" ||
        event.type === "run_started"),
  );
  if (lastSameCentralRun < 0) return false;
  const after = history.slice(lastSameCentralRun + 1);
  if (target === "hq" && after.some(eventMayChangeHqPressure)) return true;
  if (target === "rd" && after.some(eventMayChangeRndPressure)) return true;
  if (
    target === "archives" &&
    after.some((event) => event.publicPayload.actionType === "trash_card")
  )
    return true;
  return false;
}

function runnerRemoteContestOpportunity(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
): RunnerRemoteContestOpportunity {
  const target = targetServerId(input, candidate);
  const features = extractRunnerFeatures(input);
  const legalRemoteRunTargets = new Set(
    input.legalActions
      .filter(
        (action) =>
          action.type === "start_run" &&
          typeof action.payload?.serverId === "string" &&
          action.payload.serverId.startsWith("remote_"),
      )
      .map((action) => String(action.payload?.serverId)),
  );
  const profiles = [...legalRemoteRunTargets].map((serverId) =>
    runnerRemoteContestProfile(input, serverId, features),
  );
  const advancedTargets = profiles.filter((profile) => profile.advanced);
  const contestableAdvancedTargets = advancedTargets.filter(
    (profile) => profile.contestable,
  );
  const relevantTrashTargets = profiles.filter(
    (profile) => profile.relevantTrash,
  );
  const selectedProfile = profiles.find(
    (profile) => profile.serverId === target,
  );
  const centralRun =
    target === "hq" || target === "rd" || target === "archives";
  const centralJustified =
    centralRun && target
      ? runnerCentralRunHasClearPressureJustification(
          input,
          target,
          contestableAdvancedTargets.length > 0,
          features,
        )
      : false;
  const centralRunBurnsContestReserve =
    centralRun &&
    target !== undefined &&
    contestableAdvancedTargets.length > 0 &&
    runnerCentralRunBurnsRemoteContestReserve(
      input,
      target,
      contestableAdvancedTargets,
      features,
    );
  return {
    advancedRemoteTargetCount: advancedTargets.length,
    contestableAdvancedRemoteTargetCount: contestableAdvancedTargets.length,
    relevantTrashRemoteTargetCount: relevantTrashTargets.length,
    selectedTargetAdvanced: selectedProfile?.advanced === true,
    selectedTargetContestable: selectedProfile?.contestable === true,
    selectedTargetPostRunReserveSufficient:
      selectedProfile !== undefined &&
      !selectedProfile.blockedByBreakerCoverage &&
      !selectedProfile.blockedByKnownIceCost &&
      !selectedProfile.blockedByPostRunReserve,
    selectedTargetPostRunReserve: selectedProfile?.postRunReserveTarget ?? 0,
    selectedTargetRelevantTrash: selectedProfile?.relevantTrash === true,
    centralRunWhileRemoteThreat:
      centralRun &&
      (advancedTargets.length > 0 || relevantTrashTargets.length > 0),
    centralRunWhileContestableThreat:
      centralRun && contestableAdvancedTargets.length > 0,
    centralRunJustified: centralJustified,
    centralRunBurnsContestReserve,
  };
}

function runnerRemoteContestProfile(
  input: AiDecisionInput,
  serverId: string,
  features: RunnerFeatures = extractRunnerFeatures(input),
): RunnerRemoteContestProfile {
  const estimate = runnerKnownPathEstimate(input, serverId, features);
  const visibleBreakCost = estimate?.visibleBreakCost ?? 0;
  const creditsAfterPath =
    estimate?.creditsAfterPath ??
    input.playerView.own.credits - visibleBreakCost;
  const postRunReserveTarget = runnerPostRunReserveTargetForRemote(
    input,
    serverId,
    features,
  );
  const advanced = remoteServerHasVisibleScoreThreat(input, serverId);
  const relevantTrash = remoteServerHasKnownRelevantTrashTarget(
    input,
    serverId,
  );
  const blockedByKnownIceCost = visibleBreakCost > input.playerView.own.credits;
  const blockedByBreakerCoverage =
    estimate?.blocked === true && !blockedByKnownIceCost;
  const blockedByPostRunReserve =
    !blockedByBreakerCoverage &&
    !blockedByKnownIceCost &&
    creditsAfterPath < postRunReserveTarget;
  return {
    serverId,
    advanced,
    relevantTrash,
    blockedByBreakerCoverage,
    blockedByKnownIceCost,
    blockedByPostRunReserve,
    visibleBreakCost,
    creditsAfterPath,
    postRunReserveTarget,
    contestable:
      advanced &&
      !blockedByBreakerCoverage &&
      !blockedByKnownIceCost &&
      !blockedByPostRunReserve,
  };
}

function runnerPostRunReserveTargetForRemote(
  input: AiDecisionInput,
  serverId: string,
  features: RunnerFeatures = extractRunnerFeatures(input),
): number {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) return 3;
  let target = remoteServerHasVisibleScoreThreat(input, serverId) ? 1 : 2;
  const visibleStealTax = server.root.some(
    (card) =>
      card.known &&
      rolesForCardId(card.definitionId).some(
        (role) =>
          role.includes("agenda_steal_tax") ||
          role.includes("remote_upgrade_tax") ||
          role.includes("access_tax") ||
          role.includes("remote_agenda_protection") ||
          role.includes("scoring_protection") ||
          role.includes("protect_remote"),
      ),
  );
  if (visibleStealTax) target = Math.max(target, 6);
  const relevantTrashCosts = server.root
    .filter((card) => card.known)
    .filter((card) => {
      const role = remoteTrashRoleForCard(card);
      return role !== "low_value" && role !== "unknown";
    })
    .map((card) => remoteRootTrashCost(card))
    .filter((cost): cost is number => typeof cost === "number");
  if (relevantTrashCosts.length > 0) {
    target = Math.max(target, Math.min(...relevantTrashCosts) + 1);
  }
  const pathCost = features.visibleRunBreakCosts.get(serverId) ?? 0;
  if (pathCost > 0) target = Math.max(target, 2);
  return Math.min(10, Math.max(1, Math.ceil(target)));
}

function runnerCentralRunHasClearPressureJustification(
  input: AiDecisionInput,
  target: string,
  contestableRemoteThreatVisible: boolean,
  features: RunnerFeatures = extractRunnerFeatures(input),
): boolean {
  if (target !== "hq" && target !== "rd" && target !== "archives") return false;
  const estimate = runnerKnownPathEstimate(input, target, features);
  if (!estimate || estimate.blocked) return false;
  const pressureRoles = [
    ...input.playerView.own.gripOrHq,
    ...(input.playerView.own.rig ?? []),
  ].flatMap((card) => rolesForCardId(card.definitionId));
  const hasCentralPressure = pressureRoles.some(isRunnerPressureRole);
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === target,
  );
  const openOrCheap =
    estimate.visibleBreakCost <= 1 || (server?.ice.length ?? 0) === 0;
  const reserveTarget = runnerCreditReserveTargetForPlanInput(input, features);
  const preservesReserve = estimate.creditsAfterPath >= reserveTarget;
  return (
    hasCentralPressure &&
    openOrCheap &&
    preservesReserve &&
    (!contestableRemoteThreatVisible || estimate.visibleBreakCost === 0)
  );
}

function runnerCentralRunBurnsRemoteContestReserve(
  input: AiDecisionInput,
  target: string,
  contestableProfiles: RunnerRemoteContestProfile[],
  features: RunnerFeatures = extractRunnerFeatures(input),
): boolean {
  const estimate = runnerKnownPathEstimate(input, target, features);
  if (!estimate || estimate.blocked || contestableProfiles.length === 0)
    return false;
  const requiredReserve = Math.max(
    ...contestableProfiles.map((profile) => profile.postRunReserveTarget),
  );
  return estimate.creditsAfterPath < requiredReserve;
}

function remoteServerHasVisibleScoreThreat(
  input: AiDecisionInput,
  serverId: string,
): boolean {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  return (
    server?.root.some(
      (card) =>
        (card.advancementCounters ?? 0) > 0 ||
        (card.known && card.type === "agenda"),
    ) === true
  );
}

function remoteServerHasKnownRelevantTrashTarget(
  input: AiDecisionInput,
  serverId: string,
): boolean {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) return false;
  const assessment = assessKnownRezzedIcePath(
    server.ice,
    input.playerView.own.rig ?? [],
    input.playerView.own.credits,
    server.root,
  );
  if (!assessment.canReachAccess) return false;
  const visibleBreakCost = assessment.visibleBreakCost ?? 0;
  const creditsAfterIce = input.playerView.own.credits - visibleBreakCost;
  return server.root.some((card) => {
    if (!card.known) return false;
    const trashCost = remoteRootTrashCost(card);
    if (trashCost === undefined || creditsAfterIce < trashCost) return false;
    const role = remoteTrashRoleForCard(card);
    return (
      (role !== "low_value" && role !== "unknown") ||
      remoteTrashCardLooksLikeFinitePool(card)
    );
  });
}

function currentRemoteTrashAccessContext(input: AiDecisionInput): {
  trashable: boolean;
  affordableRelevant: boolean;
  expensive: boolean;
  highImpact: boolean;
  acuteThreat: boolean;
  finitePoolEconomy: boolean;
  bbsWhisperingCampaign: boolean;
  corpValueRemaining: number;
  trashCost: number;
  generalCreditCost: number;
  dedicatedTrashCredits: number;
  creditsAfterGeneralTrash: number;
  reserveTarget: number;
  dropsBelowReserve: boolean;
  deferredByBudget: boolean;
  evidence: string[];
  role:
    | "economy"
    | "scoring_protection"
    | "run_tax"
    | "remote_capacity"
    | "tag_punish"
    | "ambush"
    | "low_value"
    | "unknown";
} {
  const run = input.playerView.run;
  const accessed = run?.accessedCard;
  if (!run || !run.attackedServerId.startsWith("remote_") || !accessed?.known) {
    return {
      trashable: false,
      affordableRelevant: false,
      expensive: false,
      highImpact: false,
      acuteThreat: false,
      finitePoolEconomy: false,
      bbsWhisperingCampaign: false,
      corpValueRemaining: 0,
      trashCost: 0,
      generalCreditCost: 0,
      dedicatedTrashCredits: 0,
      creditsAfterGeneralTrash: input.playerView.own.credits,
      reserveTarget: runnerCreditReserveTargetForPlanInput(input),
      dropsBelowReserve: false,
      deferredByBudget: false,
      evidence: ["remote_trash_access:none"],
      role: "unknown",
    };
  }
  const trashAction = input.legalActions.find(
    (action) => action.type === "trash_accessed_card",
  );
  const trashCost = trashAction
    ? remoteTrashActionTotalCost(trashAction)
    : (remoteRootTrashCost(accessed) ?? 0);
  const trashable = remoteRootTrashCost(accessed) !== undefined;
  const role = remoteTrashRoleForAccessedCard(input, accessed);
  const bbsWhisperingCampaign =
    accessed.definitionId === BBS_WHISPERING_CAMPAIGN_DEFINITION_ID;
  const corpValueRemaining = remoteTrashVisibleCorpValueRemaining(accessed);
  const finitePoolEconomy =
    bbsWhisperingCampaign ||
    (role === "economy" &&
      (corpValueRemaining > 0 || remoteTrashCardLooksLikeFinitePool(accessed)));
  const relevant =
    (role !== "low_value" && role !== "unknown") || finitePoolEconomy;
  const dedicatedTrashCredits = trashAction
    ? remoteTrashDedicatedCredits(input, trashAction, accessed)
    : 0;
  const generalCreditCost = Math.max(0, trashCost - dedicatedTrashCredits);
  const reserveTarget = runnerCreditReserveTargetForPlanInput(input);
  const creditsAfterGeneralTrash =
    input.playerView.own.credits - generalCreditCost;
  const dropsBelowReserve =
    trashable && creditsAfterGeneralTrash < Math.max(2, reserveTarget - 1);
  const expensive = trashCost >= 4 || generalCreditCost >= 4;
  const highImpact =
    relevant &&
    (role === "scoring_protection" ||
      role === "run_tax" ||
      role === "remote_capacity" ||
      role === "economy" ||
      role === "tag_punish" ||
      finitePoolEconomy);
  const acuteThreat = remoteTrashAccessProtectsAcuteThreat(
    input,
    run.attackedServerId,
  );
  const highRemainingFinitePool =
    finitePoolEconomy &&
    corpValueRemaining >= Math.max(trashCost + 2, 8) &&
    trashCost > 0;
  const deferredByBudget =
    trashable &&
    highImpact &&
    expensive &&
    dropsBelowReserve &&
    dedicatedTrashCredits <= 0 &&
    !acuteThreat &&
    !highRemainingFinitePool;
  const affordableRelevant =
    trashable && relevant && trashAction !== undefined && !deferredByBudget;
  return {
    trashable,
    affordableRelevant,
    expensive,
    highImpact,
    acuteThreat,
    finitePoolEconomy,
    bbsWhisperingCampaign,
    corpValueRemaining,
    trashCost,
    generalCreditCost,
    dedicatedTrashCredits,
    creditsAfterGeneralTrash,
    reserveTarget,
    dropsBelowReserve,
    deferredByBudget,
    evidence: [
      `remote_trash_role:${role}`,
      `remote_trash_cost:${trashCost}`,
      `remote_trash_general_credit_cost:${generalCreditCost}`,
      `remote_trash_dedicated_credits:${dedicatedTrashCredits}`,
      `remote_trash_credits_after:${creditsAfterGeneralTrash}`,
      `remote_trash_reserve_target:${reserveTarget}`,
      `remote_trash_drops_below_reserve:${dropsBelowReserve}`,
      `remote_trash_acute_threat:${acuteThreat}`,
      `remote_trash_deferred_by_budget:${deferredByBudget}`,
      `remote_trash_finite_pool_economy:${finitePoolEconomy}`,
      `remote_trash_bbs_whispering_campaign:${bbsWhisperingCampaign}`,
      `remote_trash_corp_value_remaining:${corpValueRemaining}`,
    ],
    role,
  };
}

function recentRunnerDeclinedRelevantRemoteTrash(
  input: AiDecisionInput,
  serverId: string,
): boolean {
  let currentRunTarget: string | undefined;
  let sawAccessOnTarget = false;
  let declinedOnTarget = false;
  for (const event of input.eventTail.slice(-40)) {
    if (event.publicPayload.actor !== "runner") continue;
    const actionType = publicActionType(event);
    if (actionType === "start_run") {
      currentRunTarget = serverIdFromEvent(event);
      sawAccessOnTarget = false;
      if (currentRunTarget !== serverId) declinedOnTarget = false;
      continue;
    }
    if (currentRunTarget !== serverId) continue;
    if (actionType === "access_card") {
      sawAccessOnTarget = true;
      continue;
    }
    if (actionType === "trash_accessed_card") {
      declinedOnTarget = false;
      sawAccessOnTarget = false;
      continue;
    }
    if (actionType === "decline_trash" && sawAccessOnTarget) {
      declinedOnTarget = true;
    }
  }
  return (
    declinedOnTarget && remoteServerHasKnownRelevantTrashTarget(input, serverId)
  );
}

function remoteTrashVisibleCorpValueRemaining(card: VisibleCard): number {
  return Math.max(
    0,
    card.counters?.bit ?? 0,
    card.counters?.recurring_credit ?? 0,
  );
}

function remoteTrashCardLooksLikeFinitePool(card: VisibleCard): boolean {
  if (card.definitionId === BBS_WHISPERING_CAMPAIGN_DEFINITION_ID) return true;
  const runtimeDefinition = card.definitionId
    ? RUNTIME_CARDS[card.definitionId]
    : undefined;
  const demoDefinition = card.definitionId
    ? DEMO_CARDS_BY_ID[card.definitionId]
    : undefined;
  const mechanics = [
    ...("mechanics" in (runtimeDefinition ?? {})
      ? ((runtimeDefinition as { mechanics?: string[] } | undefined)
          ?.mechanics ?? [])
      : []),
    ...(demoDefinition?.mechanics ?? []),
  ];
  const runtimeText =
    (runtimeDefinition as { text?: string } | undefined)?.text ?? "";
  const demoText =
    (demoDefinition as { text?: string } | undefined)?.text ?? "";
  const rulesText = `${runtimeText} ${demoText} ${
    card.rulesText ?? ""
  }`.toLowerCase();
  return (
    mechanics.some(
      (mechanic: string) =>
        mechanic.includes("finite_economy_pool") ||
        mechanic.includes("hosted_credits") ||
        mechanic.includes("bit_counter"),
    ) ||
    (rulesText.includes("put") &&
      rulesText.includes("from the bank") &&
      rulesText.includes("take") &&
      rulesText.includes("bits"))
  );
}

function remoteTrashRoleForAccessedCard(
  input: AiDecisionInput,
  card: VisibleCard,
): ReturnType<typeof remoteTrashRoleForCard> {
  const role = remoteTrashRoleForCard(card);
  if (role !== "unknown") return role;
  if (accessedCardContributesToVisibleRunTax(input, card)) return "run_tax";
  return role;
}

function remoteTrashRoleForCard(
  card: VisibleCard,
):
  | "economy"
  | "scoring_protection"
  | "run_tax"
  | "remote_capacity"
  | "tag_punish"
  | "ambush"
  | "low_value"
  | "unknown" {
  if (card.definitionId === "simple_upgrade") return "low_value";
  const roles = rolesForCardId(card.definitionId);
  const runtimeDefinition = card.definitionId
    ? RUNTIME_CARDS[card.definitionId]
    : undefined;
  const demoDefinition = card.definitionId
    ? DEMO_CARDS_BY_ID[card.definitionId]
    : undefined;
  const mechanics = [
    ...("mechanics" in (runtimeDefinition ?? {})
      ? ((runtimeDefinition as { mechanics?: string[] } | undefined)
          ?.mechanics ?? [])
      : []),
    ...(demoDefinition?.mechanics ?? []),
  ];
  const subtypes = [
    ...(runtimeDefinition?.subtypes ?? []),
    ...(demoDefinition?.subtypes ?? []),
  ];
  if (
    roles.some(
      (role) =>
        role.includes("agenda_steal_tax") ||
        role.includes("access_tax") ||
        role.includes("remote_agenda_protection") ||
        role.includes("scoring") ||
        role.includes("protect_remote") ||
        role.includes("remote_upgrade_tax"),
    )
  )
    return "scoring_protection";
  if (
    roles.some(
      (role) =>
        role.includes("run_tax") ||
        role.includes("ice_tax") ||
        role.includes("access_tax") ||
        role.includes("server_tax"),
    ) ||
    mechanics.some(
      (mechanic: string) =>
        mechanic.includes("break_subroutine_cost") ||
        mechanic.includes("trash_cost_modifier") ||
        mechanic.includes("trace_bid_credit_source") ||
        mechanic.includes("run_flow"),
    ) ||
    subtypes.some((subtype) => subtype.toLowerCase() === "region")
  )
    return "run_tax";
  if (
    roles.some((role) => role.includes("remote_capacity")) ||
    mechanics.some((mechanic: string) => mechanic.includes("remote_capacity"))
  )
    return "remote_capacity";
  if (roles.some((role) => role.includes("economy"))) return "economy";
  if (
    roles.some(
      (role) =>
        role.includes("tag") ||
        role.includes("trace") ||
        role.includes("punish") ||
        role.includes("damage"),
    )
  )
    return "tag_punish";
  if (roles.some((role) => role.includes("ambush") || role.includes("trap")))
    return "ambush";
  return "unknown";
}

function remoteTrashActionTotalCost(action: LegalAction): number {
  const payloadCost = action.payload?.accessTrashTotalCost;
  return typeof payloadCost === "number" && Number.isFinite(payloadCost)
    ? payloadCost
    : actionCreditCost(action);
}

function remoteTrashDedicatedCredits(
  input: AiDecisionInput,
  action: LegalAction,
  accessed: VisibleCard,
): number {
  const scatter =
    accessed.type === "upgrade" &&
    typeof action.payload?.scatterShotRecurringCreditsAvailable === "number"
      ? action.payload.scatterShotRecurringCreditsAvailable
      : 0;
  const poltergeist =
    accessed.type === "asset" &&
    typeof action.payload?.poltergeistRecurringCreditsAvailable === "number"
      ? action.payload.poltergeistRecurringCreditsAvailable
      : 0;
  const payloadCredits = scatter + poltergeist;
  const rigCredits =
    input.playerView.own.rig?.reduce((sum, card) => {
      const runtimeDefinition = card.definitionId
        ? RUNTIME_CARDS[card.definitionId]
        : undefined;
      const demoDefinition = card.definitionId
        ? DEMO_CARDS_BY_ID[card.definitionId]
        : undefined;
      const mechanics = [
        ...("mechanics" in (runtimeDefinition ?? {})
          ? ((runtimeDefinition as { mechanics?: string[] } | undefined)
              ?.mechanics ?? [])
          : []),
        ...(demoDefinition?.mechanics ?? []),
      ];
      const supportsUpgradeTrash =
        accessed.type === "upgrade" &&
        mechanics.some((mechanic: string) =>
          mechanic.includes("upgrade_trash_payment"),
        );
      const supportsAssetTrash =
        accessed.type === "asset" &&
        mechanics.some((mechanic: string) =>
          mechanic.includes("node_trash_recurring_credit"),
        );
      if (!supportsUpgradeTrash && !supportsAssetTrash) return sum;
      return (
        sum + (card.counters?.recurring_credit ?? 0) + (card.counters?.bit ?? 0)
      );
    }, 0) ?? 0;
  return Math.min(
    remoteTrashActionTotalCost(action),
    Math.max(payloadCredits, rigCredits),
  );
}

function remoteTrashAccessProtectsAcuteThreat(
  input: AiDecisionInput,
  serverId: string,
): boolean {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) return false;
  if (remoteServerHasVisibleScoreThreat(input, serverId)) return true;
  return server.root.some((card) => {
    if (!card.known || card.type !== "agenda" || !card.definitionId)
      return false;
    return (
      input.playerView.own.agendaPoints +
        (RUNTIME_CARDS[card.definitionId]?.numeric.agendaPoints ??
          DEMO_CARDS_BY_ID[card.definitionId]?.agendaPoints ??
          0) >=
      input.playerView.agendaPointsToWin - 1
    );
  });
}

function accessedCardContributesToVisibleRunTax(
  input: AiDecisionInput,
  accessed: VisibleCard,
): boolean {
  const definitionId = accessed.definitionId;
  if (!definitionId) return false;
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === input.playerView.run?.attackedServerId,
  );
  return (
    server?.ice.some((ice) =>
      ice.effectiveRunQuote?.subroutines.some((subroutine) => {
        const sourceDefinitionIds = [subroutine.sourceDefinitionId];
        return sourceDefinitionIds.includes(definitionId);
      }),
    ) === true ||
    server?.ice.some((ice) =>
      ice.effectiveRunQuote?.breakSubroutineCostSourceDefinitionIds?.includes(
        definitionId,
      ),
    ) === true
  );
}

function runnerInstallPriority(
  input: AiDecisionInput,
  action: LegalAction,
): number {
  const features = extractRunnerFeatures(input);
  const breakerPressure = assessVisibleBreakerPressure(input);
  const roles = rolesForAction(input, action);
  const remainingCredits = features.credits - actionCreditCost(action);
  let priority = 85;
  priority -= runnerDuplicateInstallPriorityPenalty(input, action);
  if (breakerPressure.matchingInstallActionIds.has(action.actionId)) {
    priority += 120;
    priority += runnerStructuredBreakerInstallPriority(
      input,
      action,
      breakerPressure,
    );
  }
  if (
    roles.some(
      (role) => role.startsWith("breaker_") && !features.rigRoles.has(role),
    )
  )
    priority += 45;
  if (roles.includes("memory") || roles.includes("memory_support"))
    priority += features.memoryRemaining <= 1 ? 70 : 20;
  if (roles.some(isRunnerPressureRole)) {
    const definitionId = sourceDefinitionIdForAction(input, action);
    const target =
      definitionId &&
      centralPressureCardSupportsTarget(definitionId, "rd", true)
        ? "rd"
        : definitionId &&
            centralPressureCardSupportsTarget(definitionId, "hq", true)
          ? "hq"
          : bestCentralPressureTargetForVisibleBoard(
              input,
              features,
              reconstructBeliefState(input),
            );
    priority += target ? 42 : 12;
  }
  if (roles.includes("efficient_breaker")) priority += 12;
  if (roles.includes("flex_breaker")) priority += 10;
  if (remainingCredits >= 2) priority += 15;
  if (remainingCredits < 2) priority -= 55;
  if (
    roles.some(
      (role) => role.startsWith("breaker_") && features.rigRoles.has(role),
    )
  )
    priority -= 18;
  return priority;
}

function runnerStructuredBreakerInstallPriority(
  input: AiDecisionInput,
  action: LegalAction,
  pressure: VisibleBreakerPressure,
): number {
  const definitionId = sourceDefinitionIdForAction(input, action);
  if (!definitionId || pressure.missingIceDefinitionIds.size === 0) return 0;
  const matchingEstimates = [...pressure.missingIceDefinitionIds]
    .map((iceDefinitionId) =>
      estimateStructuredBreakerCostForIce(definitionId, {
        definitionId: iceDefinitionId,
      }),
    )
    .filter(
      (estimate): estimate is NonNullable<typeof estimate> =>
        estimate !== undefined,
    );
  if (matchingEstimates.length === 0) return 0;
  const bestCost = Math.min(
    ...matchingEstimates.map((estimate) => estimate.cost),
  );
  const sideEffectPenalty = Math.min(
    ...matchingEstimates.map((estimate) => estimate.sideEffectPenalty),
  );
  const profile = estimateBreakerCostProfileFromOntology(definitionId);
  const riskPenalty =
    (profile?.reserveRiskPenalty ?? 0) + (profile?.opportunityCostPenalty ?? 0);
  return Math.max(0, 42 - bestCost * 6 - sideEffectPenalty - riskPenalty);
}

function runnerDuplicateInstallPriorityPenalty(
  input: AiDecisionInput,
  action: LegalAction,
): number {
  if (!isRunnerDuplicateInstall(input, action)) return 0;
  return isRunnerLowValueDuplicateInstall(input, action) ? 220 : 70;
}

function runnerInstalledEconomyPriority(
  input: AiDecisionInput,
  action: LegalAction,
): number {
  const assessment = classifyInstalledEconomyAction(input, action);
  if (!assessment) return 10;
  if (assessment.kind === "pool_payout")
    return 88 + Math.max(0, assessment.netCredits - 1) * 8;
  if (assessment.kind === "direct_payout")
    return 84 + Math.max(0, assessment.netCredits - 1) * 7;
  if (assessment.kind === "pool_build")
    return brokerPoolBuildHorizon(input, assessment).priority;
  return input.playerView.own.credits < 4 ? 35 : 58;
}

function runnerShellTradersPriority(
  input: AiDecisionInput,
  action: LegalAction,
): number {
  const assessment = classifyShellTradersAction(input, action);
  if (!assessment) return 10;
  if (assessment.kind === "remove_counter") {
    return assessment.immediateInstall
      ? 132
      : 86 + Math.max(0, 4 - assessment.shellCounters) * 5;
  }
  const backlog = shellTradersBacklog(input);
  const hasImmediateRemove = input.legalActions.some(
    (candidate) =>
      classifyShellTradersAction(input, candidate)?.immediateInstall === true,
  );
  const backlogPenalty = shellTradersPrepareBacklogPenalty(
    input,
    backlog,
    hasImmediateRemove
      ? { ...assessment, kind: "remove_counter", immediateInstall: true }
      : undefined,
    assessment,
  );
  return (
    96 +
    Math.min(35, shellTradersTargetValue(assessment) / 5) +
    Math.max(0, 4 - input.playerView.own.credits) * 5 -
    Math.min(90, Math.round(backlogPenalty / 4))
  );
}

function assessVisibleBreakerPressure(
  input: AiDecisionInput,
): VisibleBreakerPressure {
  const rigCards = input.playerView.own.rig ?? [];
  const gripCards = input.playerView.own.gripOrHq.filter(
    (card) => card.known && card.definitionId,
  );
  const heapCards = input.playerView.own.heapOrArchives.filter(
    (card) => card.known && card.definitionId,
  );
  const missingIceDefinitionIds = new Set<string>();
  const blockedServerIds = new Set<string>();
  const knownIceBlockedServerIds = new Set<string>();
  for (const server of input.playerView.servers) {
    if (!isStrategicBreakerTarget(server)) continue;
    const assessment = assessKnownRezzedIcePath(
      server.ice,
      rigCards,
      input.playerView.own.credits,
      server.root,
    );
    const knownUnrezzedMissingDefinitions = server.ice
      .filter(
        (ice) =>
          ice.known &&
          ice.rezzed !== true &&
          ice.definitionId &&
          visibleIceCreatesBreakerCoverageNeed(ice),
      )
      .map((ice) => ice.definitionId!)
      .filter(
        (definitionId) =>
          !rigCards.some(
            (card) =>
              card.definitionId &&
              runnerStaticBreakerCoversIce(
                card.definitionId,
                definitionId,
                true,
              ),
          ),
      );
    const rezzedMissingDefinitions = assessment.blocked
      ? server.ice
          .filter(
            (ice) =>
              ice.known &&
              ice.rezzed === true &&
              ice.definitionId &&
              visibleIceCreatesBreakerCoverageNeed(ice),
          )
          .map((ice) => ice.definitionId!)
          .filter(
            (definitionId) =>
              !rigCards.some(
                (card) =>
                  card.definitionId &&
                  canBreakerDefinitionBreakIce(card.definitionId, definitionId),
              ),
          )
      : [];
    const missingDefinitions = [
      ...rezzedMissingDefinitions,
      ...knownUnrezzedMissingDefinitions,
    ];
    if (missingDefinitions.length === 0) continue;
    if (assessment.blocked) blockedServerIds.add(server.id);
    if (knownUnrezzedMissingDefinitions.length > 0)
      knownIceBlockedServerIds.add(server.id);
    for (const definitionId of missingDefinitions)
      missingIceDefinitionIds.add(definitionId);
  }
  const missingBreakerRoles = new Set(
    [...missingIceDefinitionIds].flatMap(missingBreakerRolesForIce),
  );
  const matchingGripBreakers = gripCards.filter((card) =>
    [...missingIceDefinitionIds].some((iceDefinitionId) =>
      runnerStaticBreakerCoversIce(card.definitionId!, iceDefinitionId, true),
    ),
  );
  const matchingHeapBreakers = heapCards.filter((card) =>
    [...missingIceDefinitionIds].some((iceDefinitionId) =>
      runnerStaticBreakerCoversIce(card.definitionId!, iceDefinitionId, true),
    ),
  );
  const ontologyMatchingGripBreakerCount = matchingGripBreakers.filter((card) =>
    [...missingIceDefinitionIds].some(
      (iceDefinitionId) =>
        card.definitionId &&
        structuredBreakerProfileCoversIce(card.definitionId, iceDefinitionId),
    ),
  ).length;
  const ontologyHeapMatchingBreakerCount = matchingHeapBreakers.filter((card) =>
    [...missingIceDefinitionIds].some(
      (iceDefinitionId) =>
        card.definitionId &&
        structuredBreakerProfileCoversIce(card.definitionId, iceDefinitionId),
    ),
  ).length;
  const matchingGripIds = new Set(
    matchingGripBreakers.map((card) => card.instanceId),
  );
  const matchingInstallActionIds = new Set(
    input.legalActions
      .filter(
        (action) =>
          action.type === "install_card" &&
          typeof action.source === "string" &&
          matchingGripIds.has(action.source),
      )
      .map((action) => action.actionId),
  );
  const searchActionIds = new Set(
    input.legalActions
      .filter((action) => runnerCoverageSearchAction(input, action))
      .filter(
        (action) =>
          !runnerCoverageRecoveryAction(input, action) ||
          matchingHeapBreakers.length > 0,
      )
      .map((action) => action.actionId),
  );
  const recoveryActionIds = new Set(
    input.legalActions
      .filter((action) => runnerCoverageRecoveryAction(input, action))
      .filter(() => matchingHeapBreakers.length > 0)
      .map((action) => action.actionId),
  );
  const deckAnswerCount = [...missingBreakerRoles].filter(
    (role) => (input.ownDeckDoctrine?.roleCounts[role] ?? 0) > 0,
  ).length;
  const cheapestInstallCost =
    matchingInstallActionIds.size > 0
      ? Math.min(
          ...input.legalActions
            .filter((action) => matchingInstallActionIds.has(action.actionId))
            .map(actionCreditCost),
        )
      : 3;
  const searchCost =
    searchActionIds.size > 0 || recoveryActionIds.size > 0
      ? Math.min(
          ...input.legalActions
            .filter(
              (action) =>
                searchActionIds.has(action.actionId) ||
                recoveryActionIds.has(action.actionId),
            )
            .map(actionCreditCost),
        )
      : 0;
  return {
    blockedServerIds,
    knownIceBlockedServerIds,
    missingIceDefinitionIds,
    missingBreakerRoles,
    matchingGripBreakerCount: matchingGripBreakers.length,
    ontologyMatchingGripBreakerCount,
    matchingInstallActionIds,
    searchActionIds,
    recoveryActionIds,
    heapMatchingBreakerCount: matchingHeapBreakers.length,
    ontologyHeapMatchingBreakerCount,
    deckAnswerCount,
    missingAnswerCount:
      matchingGripBreakers.length === 0
        ? Math.max(missingIceDefinitionIds.size, deckAnswerCount)
        : 0,
    requiredCoverageCredits:
      matchingInstallActionIds.size > 0
        ? cheapestInstallCost + 2
        : searchCost + cheapestInstallCost + 2,
  };
}

function isStrategicBreakerTarget(
  server: AiDecisionInput["playerView"]["servers"][number],
): boolean {
  if (server.id === "rd" || server.id === "hq") return true;
  return server.id.startsWith("remote_") && server.root.length > 0;
}

function visibleIceCreatesBreakerCoverageNeed(
  ice: Pick<VisibleCard, "definitionId" | "effectiveRunQuote">,
): boolean {
  if (!ice.definitionId) return false;
  if (iceHasEndTheRun(ice.definitionId)) return true;
  return (
    ice.effectiveRunQuote?.subroutines.some((subroutine) => {
      const effect = subroutine.unbrokenRunEffect;
      return (
        effect?.addsFutureEndTheRunSubroutines !== undefined ||
        effect?.increasesFutureBreakCostPerSubroutine !== undefined ||
        effect?.preventsFutureBreaking === true ||
        effect?.causesDamageOrProgramTrash === true ||
        effect?.createsRunLockOrActionTax !== undefined
      );
    }) === true
  );
}

function missingBreakerRolesForIce(definitionId: string): string[] {
  const definition =
    RUNTIME_CARDS[definitionId] ?? DEMO_CARDS_BY_ID[definitionId];
  const subtypes = definition?.subtypes ?? [];
  const roles = new Set<string>();
  if (
    subtypes.some((subtype) => subtypeKeyForRunnerCoverage(subtype) === "wall")
  )
    roles.add("breaker_fracter");
  if (
    subtypes.some(
      (subtype) => subtypeKeyForRunnerCoverage(subtype) === "code_gate",
    )
  )
    roles.add("breaker_decoder");
  if (
    subtypes.some(
      (subtype) => subtypeKeyForRunnerCoverage(subtype) === "sentry",
    )
  )
    roles.add("breaker_killer");
  if (roles.size === 0) roles.add("breaker_generic");
  return [...roles].sort();
}

function runnerStaticBreakerCoversIce(
  breakerDefinitionId: string,
  iceDefinitionId: string,
  allowStructuredOntology: boolean,
): boolean {
  return (
    canBreakerDefinitionBreakIce(breakerDefinitionId, iceDefinitionId) ||
    (allowStructuredOntology &&
      structuredBreakerProfileCoversIce(breakerDefinitionId, iceDefinitionId))
  );
}

function subtypeKeyForRunnerCoverage(subtype: string): string {
  return subtype
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function runnerCoverageSearchAction(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  if (action.side !== "runner") return false;
  if (
    action.type !== "play_event" &&
    action.type !== "resolve_choice" &&
    action.type !== "trigger_ability" &&
    action.type !== "activated_card_ability"
  )
    return false;
  const roles = rolesForAction(input, action);
  const sourceCard =
    typeof action.source === "string"
      ? findVisibleCard(input, action.source)
      : undefined;
  const sourceDefinition = sourceCard?.definitionId
    ? (RUNTIME_CARDS[sourceCard.definitionId] ??
      DEMO_CARDS_BY_ID[sourceCard.definitionId])
    : undefined;
  const mechanics =
    sourceDefinition &&
    "mechanics" in sourceDefinition &&
    Array.isArray(sourceDefinition.mechanics)
      ? sourceDefinition.mechanics
      : [];
  return (
    roles.some(
      (role) =>
        role.includes("search") ||
        role.includes("tutor") ||
        role === "program_search" ||
        role === "stack_search" ||
        role === "search_stack" ||
        role === "search_trash" ||
        role === "setup_search" ||
        role.includes("recovery") ||
        role.includes("trash_recovery"),
    ) ||
    mechanics.some(
      (mechanic: string) =>
        mechanic.includes("search") ||
        mechanic.includes("tutor") ||
        mechanic.includes("hidden_zone_tool"),
    )
  );
}

function runnerCoverageRecoveryAction(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  const roles = rolesForAction(input, action);
  return roles.some(
    (role) =>
      role.includes("recovery") ||
      role.includes("trash_recovery") ||
      role === "search_trash",
  );
}

function actionCreditCost(action: LegalAction): number {
  return action.costs.reduce(
    (sum, cost) =>
      sum + (Number.isFinite(cost.credits) ? (cost.credits ?? 0) : 0),
    0,
  );
}

function isRunnerDuplicateInstall(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  if (action.type !== "install_card") return false;
  const definitionId = sourceDefinitionIdForAction(input, action);
  if (!definitionId) return false;
  return (
    input.playerView.own.rig?.some(
      (card) => card.known && card.definitionId === definitionId,
    ) === true
  );
}

function isRunnerLowValueDuplicateInstall(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  if (!isRunnerDuplicateInstall(input, action)) return false;
  const definitionId = sourceDefinitionIdForAction(input, action);
  if (!definitionId) return false;
  const roles = rolesForCardId(definitionId);
  if (definitionId === "onr_v1_165_junkyard-bbs") return true;
  if (roles.some((role) => role === "memory" || role === "memory_support"))
    return false;
  if (roles.some(isRunnerPressureRole)) return false;
  if (roles.some((role) => role.startsWith("breaker_"))) return true;
  return roles.some(
    (role) =>
      role === "resource" ||
      role === "setup" ||
      role === "draw" ||
      role === "tag_risk" ||
      isRunnerEconomyRole(role),
  );
}

function sourceDefinitionIdForAction(
  input: AiDecisionInput,
  action: LegalAction,
): string | undefined {
  if (action.source === "basic_action" || action.source === "game_rule")
    return undefined;
  return findVisibleCard(input, action.source)?.definitionId;
}

function isRunnerEconomyRole(role: string): boolean {
  return role === "economy" || role === "tempo" || role.includes("economy");
}

function isRunnerPressureRole(role: string): boolean {
  return (
    role === "run_pressure" ||
    role === "access" ||
    role.includes("pressure") ||
    role.includes("interface") ||
    role.includes("multiaccess")
  );
}

function numberPayload(action: LegalAction, key: string): number {
  const value = action.payload?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function isAiSupportedCard(cardId: string | undefined): boolean {
  return Boolean(
    cardId && RUNTIME_CARDS[cardId]?.statuses.ai_supported === true,
  );
}

function runnerPlanProfile(input: AiDecisionInput): RunnerPlanProfile {
  return (
    RUNNER_PLAN_PROFILES.find(
      (profile) =>
        profile.profileId === input.profileId ||
        profile.legacyProfileIds.includes(input.profileId),
    ) ??
    RUNNER_PLAN_PROFILES.find(
      (profile) => profile.difficulty === input.difficulty,
    ) ??
    RUNNER_PLAN_PROFILES[1]!
  );
}

function targetServerId(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
): string | undefined {
  for (const actionId of candidate.legalActionIds) {
    const action = input.legalActions.find(
      (legalAction) => legalAction.actionId === actionId,
    );
    if (typeof action?.payload?.serverId === "string")
      return action.payload.serverId;
  }
  return undefined;
}

function actionsForRunnerCandidate(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
): LegalAction[] {
  const actionIds = new Set(candidate.legalActionIds);
  return input.legalActions.filter((action) => actionIds.has(action.actionId));
}

function publicServerMentions(
  input: AiDecisionInput,
  serverId: string | undefined,
): number {
  if (!serverId) return 0;
  return input.eventTail.filter(
    (event) => serverIdFromEvent(event) === serverId,
  ).length;
}

function isLowInformationRunTarget(
  features: RunnerFeatures,
  serverId: string,
): boolean {
  const server = features.serverFeatures.get(serverId);
  if (!server) return false;
  return server.iceCount <= 1 && server.rootCount === 0;
}

function fallbackPlanDecision(
  input: AiDecisionInput,
  reason: string,
  timeBudgetMs: number,
  timeoutUsed: boolean,
  beliefState: BeliefState,
): RunnerPlanDecision {
  const fallbackAction = input.legalActions.slice().sort(compareAction)[0];
  return {
    selectedPlanId: "fallback",
    selectedActionId: fallbackAction?.actionId ?? "",
    selectedActionType: fallbackAction?.type ?? "none",
    fallbackUsed: true,
    score: {
      planId: "fallback",
      score: 0,
      confidence: 0.2,
      reasons: [reason],
      evidence: [reason],
      scoreBreakdown: scoreComponents([["fallback", "Fallback", 0, 1, reason]]),
    },
    debug: fallbackDebug(
      input,
      undefined,
      reason,
      timeBudgetMs,
      timeoutUsed,
      beliefState,
    ),
  };
}

function fallbackDebug(
  input: AiDecisionInput,
  fallbackDecision: AiDecision | undefined,
  reason: string,
  timeBudgetMs: number | undefined,
  timeoutUsed = false,
  beliefState: BeliefState = reconstructBeliefState(input),
): RunnerPlanDebug {
  const fallbackAction = fallbackDecision
    ? input.legalActions.find(
        (action) => action.actionId === fallbackDecision.actionId,
      )
    : input.legalActions.slice().sort(compareAction)[0];
  const beliefSummary = beliefDebugSummary(beliefState);
  const opponentModel = toRecord(beliefSummary.runnerOpponentModel);
  return {
    schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
    aiLevel: 2,
    summary: "Der Runner nutzt einen legalen Fallback.",
    planId: "fallback",
    planKind: "fallback",
    selectedActionType: fallbackAction?.type ?? "none",
    score: 0,
    confidence: fallbackDecision?.confidence ?? 0.2,
    visibleReasons: [reason],
    rankedAlternatives: [
      {
        rank: 1,
        planId: "fallback",
        planKind: "fallback",
        selectedActionType: fallbackAction?.type ?? "none",
        summary: "Legal fallback action",
        score: 0,
        confidence: fallbackDecision?.confidence ?? 0.2,
        visibleReasons: [reason],
        scoreBreakdown: scoreComponents([
          ["fallback", "Fallback", 0, 1, reason],
        ]),
        whyNot: [],
        warnings: ["fallback_used"],
      },
    ],
    scoreBreakdown: scoreComponents([["fallback", "Fallback", 0, 1, reason]]),
    whyNot: [reason],
    longTermPlan: longTermPlanForRunner(input, "fallback"),
    warnings: ["fallback_used"],
    detailSections: [{ id: "fallback", title: "Fallback", items: [reason] }],
    uncertainty: ["unknown_corp_cards_remain_unknown"],
    evidence: scrubPlanEvidence([reason]),
    fallbackUsed: true,
    seed: input.seed,
    profileId: runnerPlanProfile(input).profileId,
    timeBudgetMs: timeBudgetMs ?? runnerPlanProfile(input).timeBudgetMs,
    timeoutUsed,
    memoryVersion: String(beliefSummary.memoryVersion ?? ""),
    facts: toStringArray(beliefSummary.facts),
    hypotheses: toStringArray(beliefSummary.hypotheses),
    invalidations: toStringArray(beliefSummary.invalidations),
    beliefUncertainty: toStringArray(beliefSummary.uncertainty),
    ...(opponentModel ? { opponentModel } : {}),
    ...(input.ownDeckDoctrine
      ? {
          ownDeckDoctrine: deckDoctrineDebug(input.ownDeckDoctrine),
          doctrinePlanWeight: 0,
        }
      : {}),
  };
}

type ScoreComponentInput = [
  key: string,
  label: string,
  value: number,
  weight?: number | undefined,
  reason?: string | undefined,
];

function scoreComponents(
  inputs: ScoreComponentInput[],
): AiDecisionScoreComponent[] {
  return inputs
    .filter(([, , value], index) => index === 0 || value !== 0)
    .map(([key, label, value, weight, reason]) => ({
      key,
      label,
      value: roundScore(value),
      ...(weight !== undefined ? { weight: round(weight) } : {}),
      ...(reason ? { reason } : {}),
    }))
    .slice(0, 16);
}

function firstReason(reasons: string[]): string | undefined {
  return reasons.find((reason) => reason.length > 0);
}

function rankedRunnerAlternatives(
  input: AiDecisionInput,
  scored: Array<{ candidate: RunnerPlanCandidate; score: RunnerPlanScore }>,
  selectedPlanId: string,
): AiDecisionRankedAlternative[] {
  const selectedScore =
    scored.find((entry) => entry.candidate.planId === selectedPlanId)?.score
      .score ??
    scored[0]?.score.score ??
    0;
  return scored.slice(0, 5).map((entry, index) => {
    const representativeAction = selectPlanAction(input, entry.candidate);
    return {
      rank: index + 1,
      planId: entry.candidate.planId,
      planKind: entry.candidate.kind,
      selectedActionType:
        representativeAction?.type ??
        entry.candidate.steps[0]?.actionType ??
        "none",
      summary: explanationForPlan(entry.candidate.kind),
      score: entry.score.score,
      confidence: entry.score.confidence,
      visibleReasons: entry.score.reasons.slice(0, 4),
      scoreBreakdown: entry.score.scoreBreakdown.slice(0, 8),
      whyNot: alternativeWhyNot(
        entry.candidate,
        entry.score,
        selectedScore,
        entry.candidate.planId === selectedPlanId,
      ),
      warnings: entry.candidate.visibleRisks.slice(0, 3),
    };
  });
}

function alternativeWhyNot(
  candidate: RunnerPlanCandidate,
  score: RunnerPlanScore,
  selectedScore: number,
  isSelected: boolean,
): string[] {
  if (isSelected) return ["selected_plan"];
  const delta = roundScore(selectedScore - score.score);
  return sortedUnique([
    ...(delta > 0 ? [`lower_score_by:${delta}`] : []),
    ...candidate.visibleRisks.slice(0, 2),
    ...candidate.uncertainty.slice(0, 2),
    ...score.reasons.slice(0, 3),
  ]).slice(0, 6);
}

function longTermPlanForRunner(
  input: AiDecisionInput,
  kind: RunnerPlanKind | "fallback",
): string[] {
  return sortedUnique([
    `active_plan:${kind}`,
    ...(input.ownDeckDoctrine?.side === "runner"
      ? input.ownDeckDoctrine.archetypeTags
          .slice(0, 3)
          .map((tag) => `doctrine:${tag}`)
      : ["doctrine:neutral"]),
    ...(input.ownDeckDoctrine?.side === "runner"
      ? input.ownDeckDoctrine.riskFlags
          .slice(0, 2)
          .map((flag) => `risk_flag:${flag}`)
      : []),
  ]).slice(0, 6);
}

function runnerDetailSections(
  candidate: RunnerPlanCandidate,
  score: RunnerPlanScore,
): NonNullable<RunnerPlanDebug["detailSections"]> {
  return [
    {
      id: "visible_reasons",
      title: "Sichtbare Gründe",
      items: score.reasons.slice(0, 6),
    },
    {
      id: "evidence",
      title: "Evidence",
      items: scrubPlanEvidence(score.evidence).slice(0, 8),
    },
    {
      id: "uncertainty",
      title: "Unsicherheit",
      items: candidate.uncertainty.slice(0, 6),
    },
  ].filter((section) => section.items.length > 0);
}

function baseScoreForPlan(kind: RunnerPlanKind): number {
  switch (kind) {
    case "pressure_rnd":
      return 300;
    case "pressure_hq":
      return 270;
    case "contest_remote":
      return 295;
    case "build_rig":
      return 255;
    case "recover_economy":
      return 230;
    case "draw_for_answers":
      return 215;
    case "trash_asset":
      return 360;
    case "safe_probe_run":
      return 185;
  }
}

function doctrinePlanWeightFor(
  input: AiDecisionInput,
  kind: RunnerPlanKind,
): number {
  const profile = input.ownDeckDoctrine;
  if (!profile || profile.side !== "runner") return 0;
  const raw = profile.planWeights[kind] ?? 0;
  const confidence = Number.isFinite(profile.confidence)
    ? profile.confidence
    : 0.5;
  return Math.round(raw * Math.max(0.25, Math.min(1, confidence)));
}

function deckDoctrineDebug(
  profile: AiDeckDoctrineProfile,
): NonNullable<RunnerPlanDebug["ownDeckDoctrine"]> {
  return {
    schemaVersion: profile.schemaVersion,
    side: profile.side,
    confidence: profile.confidence,
    archetypeTags: profile.archetypeTags.slice(0, 3),
    riskFlags: profile.riskFlags.slice(0, 5),
  };
}

function visibleBenefitsForPlan(kind: RunnerPlanKind): string[] {
  switch (kind) {
    case "pressure_rnd":
      return ["benefit:rd_pressure"];
    case "pressure_hq":
      return ["benefit:hq_pressure"];
    case "contest_remote":
      return ["benefit:remote_contest"];
    case "build_rig":
      return ["benefit:rig_setup"];
    case "recover_economy":
      return ["benefit:credit_reserve"];
    case "draw_for_answers":
      return ["benefit:more_options"];
    case "trash_asset":
      return ["benefit:remove_visible_threat"];
    case "safe_probe_run":
      return ["benefit:low_commitment_information"];
  }
}

function visibleRisksForPlan(kind: RunnerPlanKind, roles: string[]): string[] {
  const risks: string[] = [];
  if (isRunPlan(kind)) risks.push("risk:unknown_server_contents");
  if (kind === "build_rig" && roles.length === 0) risks.push("risk:no_ai_role");
  return risks;
}

function uncertaintyForPlan(kind: RunnerPlanKind): string[] {
  return isRunPlan(kind)
    ? ["unknown_corp_cards_remain_unknown", "unrezzed_ice_identity_not_assumed"]
    : ["hidden_corp_information_not_used"];
}

function isRunPlan(kind: RunnerPlanKind): boolean {
  return (
    kind === "pressure_rnd" ||
    kind === "pressure_hq" ||
    kind === "contest_remote" ||
    kind === "safe_probe_run"
  );
}

function isEarlyRunnerTurn(input: AiDecisionInput): boolean {
  if (
    input.playerView.phase !== "runner_action_phase" ||
    input.playerView.activeSide !== "runner"
  )
    return false;
  const scoredAgendaCount =
    input.playerView.own.scoreArea.length +
    input.playerView.opponent.scoreArea.length;
  return input.actionNumber <= 12 && scoredAgendaCount === 0;
}

function visibleRiskPenalty(
  candidate: RunnerPlanCandidate,
  riskTolerance: number,
): number {
  return candidate.visibleRisks.length * 35 * (1 - riskTolerance);
}

function explanationForPlan(kind: RunnerPlanDebug["planKind"]): string {
  switch (kind) {
    case "pressure_rnd":
      return "Der Runner erzeugt R&D-Druck, ohne verdeckte Kartentitel anzunehmen.";
    case "pressure_hq":
      return "Der Runner erzeugt HQ-Druck auf Basis sichtbarer Lage und Unsicherheit.";
    case "contest_remote":
      return "Der Runner contestet einen sichtbaren Remote-Druckpunkt.";
    case "build_rig":
      return "Der Runner verbessert sein sichtbares Rig.";
    case "recover_economy":
      return "Der Runner schützt seine Credit-Reserve statt eines schlechten Runs.";
    case "draw_for_answers":
      return "Der Runner zieht nach sichtbaren Antworten.";
    case "trash_asset":
      return "Der Runner entfernt ein sichtbar zugreifbares Trash-Ziel.";
    case "safe_probe_run":
      return "Der Runner wählt einen vorsichtigen Probe-Run mit dokumentierter Unsicherheit.";
    case "fallback":
      return "Der Runner nutzt einen legalen Fallback.";
  }
}

function scrubPlanEvidence(evidence: string[]): string[] {
  const forbidden = [
    "cardInstances",
    "privatePayload",
    "sessionToken",
    "reconnectToken",
    "joinToken",
    "tokenHash",
    "fullGameState",
    "FullState",
    "corp_simple_",
  ];
  return evidence
    .filter((entry) => !forbidden.some((needle) => entry.includes(needle)))
    .slice(0, 80);
}

function confidence(score: number, actionCount: number): number {
  return Math.max(
    0.15,
    Math.min(0.98, round(score / 1000 + Math.min(actionCount, 3) * 0.03)),
  );
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

function toRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return undefined;
  return value as Record<string, unknown>;
}

function compareAction(left: LegalAction, right: LegalAction): number {
  return left.actionId.localeCompare(right.actionId);
}
