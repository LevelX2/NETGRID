import corpPlanProfilesData from "../../../data/ai/corp-plan-profiles-1.4.0.json";
import { AI_DECISION_DEBUG_SCHEMA_VERSION, DEMO_CARDS_BY_ID, type AiDeckDoctrineProfile, type AiDecision, type AiDecisionDebug, type AiDecisionInput, type AiDifficulty, type LegalAction, type Side, type VisibleCard } from "@netgrid/shared";
import { CARD_ROLES_BY_CARD, RUNTIME_CARDS, createAiHintsByCard } from "./ai-hints";
import { beliefDebugSummary, reconstructBeliefState, type BeliefState } from "./belief-state";
import { cardDefinitionStrength, endTheRunSubroutineCount, minimumCreditsToBreakEndTheRunSubroutines, serverIdFromEvent } from "./visible-run-analysis";

export type CorpPlanKind =
  | "score_now"
  | "score_next_turn"
  | "build_scoring_remote"
  | "protect_hq"
  | "protect_rnd"
  | "recover_economy"
  | "bait_runner";

export type CorpPlanStep = {
  stepId: string;
  actionId: string;
  actionType: LegalAction["type"];
  targetServerId?: string;
  roleTags: string[];
};

export type CorpPlanCandidate = {
  planId: string;
  kind: CorpPlanKind;
  legalActionIds: string[];
  steps: CorpPlanStep[];
  expectedBenefits: string[];
  visibleRisks: string[];
  requiredRoles: string[];
};

export type CorpPlanScore = {
  planId: string;
  score: number;
  confidence: number;
  reasons: string[];
  evidence: string[];
};

export type CorpPlanDebug = AiDecisionDebug & {
  aiLevel: 2;
  schemaVersion: typeof AI_DECISION_DEBUG_SCHEMA_VERSION;
  planId: string;
  planKind: CorpPlanKind | "fallback";
  selectedActionType: LegalAction["type"] | "none";
  score: number;
  confidence: number;
  visibleReasons: string[];
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
    deckSnapshotId: string;
    side: Side;
    confidence: number;
    archetypeTags: string[];
    riskFlags: string[];
  };
  doctrinePlanWeight?: number;
};

export type CorpPlanDecision = {
  selectedPlanId: string;
  selectedActionId: string;
  selectedActionType: LegalAction["type"] | "none";
  fallbackUsed: boolean;
  score: CorpPlanScore;
  debug: CorpPlanDebug;
};

export type CorpPlanEvaluatorResult = {
  score: number;
  reasons: string[];
  evidence: string[];
};

type CorpPlanProfile = {
  profileId: string;
  legacyProfileIds: string[];
  side: "corp";
  difficulty: AiDifficulty;
  timeBudgetMs: number;
  planBreadth: number;
  riskTolerance: number;
  weights: Record<"agendaRisk" | "serverThreat" | "economyReserve" | "iceRez" | "scoringWindow" | "remoteIntent", number>;
};

type CorpPlanFeatures = {
  credits: number;
  clicks: number;
  handCount: number;
  agendaPoints: number;
  opponentAgendaPoints: number;
  agendaPointsToWin: number;
  runnerCredits: number;
  runnerTags: number;
  serverFeatures: Map<string, { iceCount: number; rootCount: number; knownRootCount: number; rezzedIceCount: number; unrezzedIceCount: number }>;
};

type RemoteIntentMemory = {
  remoteInstallSignals: number;
  remoteAdvanceSignals: number;
  remoteScoreSignals: number;
  centralRunSignals: Record<"hq" | "rd", number>;
  evidence: string[];
};

export type RunnerContestCapacity = {
  serverId: string;
  capacity: "low" | "medium" | "high";
  scoreModifier: number;
  runnerCredits: number;
  installedBreakers: number;
  visibleBreakCost?: number;
  reasons: string[];
  evidence: string[];
};

export type RemoteScoreHorizon = {
  actionId: string;
  serverId?: string;
  actionType: LegalAction["type"];
  scoreModifier: number;
  advancementRequirement?: number;
  advancementCountersAfterAction?: number;
  advancesRemainingAfterAction?: number;
  estimatedTurnsToScore?: number;
  contestCapacity?: RunnerContestCapacity["capacity"];
  reasons: string[];
  evidence: string[];
};

export type CorpEvaluationContext = {
  beliefState: BeliefState;
  remoteRootSecurityByActionId: Map<string, number>;
  runnerContestByServerId: Map<string, RunnerContestCapacity>;
  scoreHorizonByActionId: Map<string, RemoteScoreHorizon | undefined>;
};

const AI_HINTS = createAiHintsByCard();
const CORP_PLAN_PROFILES = corpPlanProfilesData.profiles as CorpPlanProfile[];
const PLAN_ACTION_TYPES = new Set<LegalAction["type"]>(["score_agenda", "advance_card", "install_card", "play_operation", "gain_credit", "draw_card", "end_turn"]);

function createCorpEvaluationContext(input: AiDecisionInput, beliefState: BeliefState = reconstructBeliefState(input)): CorpEvaluationContext {
  return {
    beliefState,
    remoteRootSecurityByActionId: new Map(),
    runnerContestByServerId: new Map(),
    scoreHorizonByActionId: new Map()
  };
}

function corpEvaluationContext(input: AiDecisionInput, contextOrBelief: BeliefState | CorpEvaluationContext = reconstructBeliefState(input)): CorpEvaluationContext {
  return "remoteRootSecurityByActionId" in contextOrBelief ? contextOrBelief : createCorpEvaluationContext(input, contextOrBelief);
}

export function hasCorpPlanAction(input: AiDecisionInput): boolean {
  return input.side === "corp" && input.legalActions.some((action) => PLAN_ACTION_TYPES.has(action.type));
}

export function chooseCorpPlanAction(input: AiDecisionInput, fallbackDecision: AiDecision, options: { timeBudgetMs?: number } = {}): AiDecision {
  const planDecision = chooseCorpPlanDecision(input, options);
  if (planDecision.fallbackUsed || !planDecision.selectedActionId) {
    return {
      ...fallbackDecision,
      decisionDebug: planDecision.debug,
      timeoutUsed: planDecision.debug.timeoutUsed || Boolean(fallbackDecision.timeoutUsed)
    };
  }
  const action = input.legalActions.find((candidate) => candidate.actionId === planDecision.selectedActionId);
  if (!action) {
    return {
      ...fallbackDecision,
      decisionDebug: fallbackDebug(input, fallbackDecision, "no_legal_selected_action", options.timeBudgetMs),
      timeoutUsed: Boolean(fallbackDecision.timeoutUsed)
    };
  }
  return {
    actionId: action.actionId,
    reasonCode: `corp.plan.${planDecision.score.planId.split(":")[0]}`,
    explanation: explanationForPlan(planDecision.debug.planKind),
    consideredActionIds: input.legalActions.map((candidate) => candidate.actionId).sort(),
    fallbackUsed: false,
    confidence: planDecision.score.confidence,
    evidence: scrubPlanEvidence(planDecision.score.evidence),
    decisionDebug: planDecision.debug,
    timeoutUsed: planDecision.debug.timeoutUsed,
    profileId: input.profileId,
    difficulty: input.difficulty,
    reason: `corp.plan.${planDecision.debug.planKind}`
  };
}

export function chooseCorpPlanDecision(input: AiDecisionInput, options: { timeBudgetMs?: number } = {}): CorpPlanDecision {
  const profile = corpPlanProfile(input);
  const context = createCorpEvaluationContext(input);
  const beliefState = context.beliefState;
  const timeBudgetMs = options.timeBudgetMs ?? profile.timeBudgetMs;
  if (timeBudgetMs <= 0) {
    return fallbackPlanDecision(input, "time_budget_exhausted", timeBudgetMs, true, beliefState);
  }
  const candidates = generateCorpPlanCandidates(input, context).slice(0, profile.planBreadth);
  if (candidates.length === 0) {
    return fallbackPlanDecision(input, "no_plan_candidate", timeBudgetMs, false, beliefState);
  }
  const scored = candidates
    .map((candidate) => ({ candidate, score: evaluateCorpPlan(input, candidate, context) }))
    .sort((left, right) => right.score.score - left.score.score || left.candidate.planId.localeCompare(right.candidate.planId));
  const selected = scored[0];
  if (!selected) return fallbackPlanDecision(input, "no_scored_plan", timeBudgetMs, false, beliefState);
  const action = selectPlanAction(input, selected.candidate, context);
  if (!action) return fallbackPlanDecision(input, "plan_without_legal_action", timeBudgetMs, false, beliefState);
  const beliefSummary = beliefDebugSummary(beliefState);
  const opponentModel = toRecord(beliefSummary.corpOpponentModel);
  const doctrinePlanWeight = doctrinePlanWeightFor(input, selected.candidate.kind);
  return {
    selectedPlanId: selected.candidate.planId,
    selectedActionId: action.actionId,
    selectedActionType: action.type,
    fallbackUsed: false,
    score: selected.score,
    debug: {
      schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
      aiLevel: 2,
      planId: selected.candidate.planId,
      planKind: selected.candidate.kind,
      selectedActionType: action.type,
      score: selected.score.score,
      confidence: selected.score.confidence,
      visibleReasons: selected.score.reasons,
      evidence: scrubPlanEvidence(selected.score.evidence),
      fallbackUsed: false,
      seed: input.seed,
      profileId: profile.profileId,
      timeBudgetMs,
      timeoutUsed: false,
      ...(input.ownDeckDoctrine ? { ownDeckDoctrine: deckDoctrineDebug(input.ownDeckDoctrine), doctrinePlanWeight } : {}),
      memoryVersion: String(beliefSummary.memoryVersion ?? ""),
      facts: toStringArray(beliefSummary.facts),
      hypotheses: toStringArray(beliefSummary.hypotheses),
      invalidations: toStringArray(beliefSummary.invalidations),
      beliefUncertainty: toStringArray(beliefSummary.uncertainty),
      ...(opponentModel ? { opponentModel } : {})
    }
  };
}

export function generateCorpPlanCandidates(input: AiDecisionInput, context: CorpEvaluationContext = createCorpEvaluationContext(input)): CorpPlanCandidate[] {
  if (input.side !== "corp") return [];
  const actions = input.legalActions.slice().sort(compareAction);
  return [
    buildCandidate(input, "score_now", actions.filter((action) => action.type === "score_agenda")),
    buildCandidate(
      input,
      "score_next_turn",
      actions.filter((action) => action.type === "advance_card" || (action.type === "install_card" && action.payload?.placement !== "ice" && isSafeScoringRootAction(input, action, context)))
    ),
    buildCandidate(
      input,
      "build_scoring_remote",
      actions.filter((action) => action.type === "install_card" && action.payload?.placement !== "ice" && isRemoteServerId(action.payload?.serverId) && (!rolesForAction(input, action).some(isAgendaRole) || isSafeScoringRootAction(input, action, context)))
    ),
    buildCandidate(input, "protect_hq", actions.filter((action) => action.type === "install_card" && action.payload?.placement === "ice" && action.payload?.serverId === "hq")),
    buildCandidate(input, "protect_rnd", actions.filter((action) => action.type === "install_card" && action.payload?.placement === "ice" && action.payload?.serverId === "rd")),
    buildCandidate(
      input,
      "recover_economy",
      actions.filter((action) => action.type === "gain_credit" || action.type === "draw_card" || (action.type === "play_operation" && rolesForAction(input, action).some((role) => role.includes("economy") || role.includes("draw"))))
    ),
    buildCandidate(
      input,
      "bait_runner",
      actions.filter((action) => action.type === "install_card" && action.payload?.placement !== "ice" && rolesForAction(input, action).some((role) => role === "economy_asset" || role === "asset_trash_target" || role === "upgrade" || role === "remote_support"))
    )
  ].filter((candidate): candidate is CorpPlanCandidate => candidate !== null);
}

export function evaluateCorpPlan(input: AiDecisionInput, candidate: CorpPlanCandidate, contextOrBelief: BeliefState | CorpEvaluationContext = reconstructBeliefState(input)): CorpPlanScore {
  const context = corpEvaluationContext(input, contextOrBelief);
  const beliefState = context.beliefState;
  const profile = corpPlanProfile(input);
  const agendaRisk = evaluateAgendaRisk(input, candidate);
  const serverThreat = evaluateServerThreat(input, candidate, beliefState);
  const economyReserve = evaluateEconomyReserve(input, candidate);
  const iceRez = evaluateIceRez(input, candidate);
  const scoringWindow = evaluateScoringWindow(input, candidate);
  const scoringProgress = evaluateCorpScoringProgress(input, candidate, context);
  const runnerContest = evaluateRemoteScoringContest(input, candidate, context);
  const scoringHorizon = evaluateRemoteScoreHorizon(input, candidate, context);
  const remoteIntent = evaluateRemoteIntentMemory(input, beliefState);
  const base = baseScoreForPlan(candidate.kind);
  const doctrinePlanWeight = doctrinePlanWeightFor(input, candidate.kind);
  const score =
    base +
    doctrinePlanWeight +
    agendaRisk.score * profile.weights.agendaRisk +
    serverThreat.score * profile.weights.serverThreat +
    economyReserve.score * profile.weights.economyReserve +
    iceRez.score * profile.weights.iceRez +
    scoringWindow.score * profile.weights.scoringWindow +
    scoringProgress.score +
    runnerContest.score +
    scoringHorizon.score +
    remoteIntent.remoteInstallSignals * 8 * profile.weights.remoteIntent +
    remoteIntent.remoteAdvanceSignals * 12 * profile.weights.remoteIntent -
    remoteRootExposurePenalty(input, candidate, profile.riskTolerance, context) -
    visibleRiskPenalty(candidate, profile.riskTolerance);
  const evidence = [
    `plan:${candidate.kind}`,
    `difficulty:${input.difficulty}`,
    `doctrine_plan_weight:${doctrinePlanWeight}`,
    ...runnerContest.evidence,
    ...scoringHorizon.evidence,
    ...(input.ownDeckDoctrine ? [`doctrine:${input.ownDeckDoctrine.archetypeTags.slice(0, 3).join(",") || "neutral"}`] : ["doctrine:neutral"]),
    ...candidate.expectedBenefits,
    ...agendaRisk.evidence,
    ...serverThreat.evidence,
    ...economyReserve.evidence,
    ...iceRez.evidence,
    ...scoringWindow.evidence,
    ...scoringProgress.evidence,
    ...remoteRootExposureEvidence(input, candidate, context),
    ...remoteIntent.evidence,
    `belief_version:${beliefState.version}`,
    ...(beliefState.corpOpponentModel ? [`runner_contest_probability:${round(beliefState.corpOpponentModel.remoteContestProbability)}`] : [])
  ];
  return {
    planId: candidate.planId,
    score: roundScore(score),
    confidence: confidence(score, candidate.legalActionIds.length),
    reasons: sortedUnique([...agendaRisk.reasons, ...serverThreat.reasons, ...economyReserve.reasons, ...iceRez.reasons, ...scoringWindow.reasons, ...scoringProgress.reasons, ...runnerContest.reasons, ...scoringHorizon.reasons]).slice(0, 6),
    evidence: scrubPlanEvidence(evidence)
  };
}

export function evaluateAgendaRisk(input: AiDecisionInput, candidate: CorpPlanCandidate): CorpPlanEvaluatorResult {
  const features = extractCorpPlanFeatures(input);
  const scorePressure = Math.max(0, features.opponentAgendaPoints - features.agendaPoints) * 20;
  const closeToWin = Math.max(0, features.agendaPointsToWin - features.agendaPoints <= 2 ? 40 : 0);
  const score = candidate.kind === "score_now" ? 180 + closeToWin : candidate.kind === "score_next_turn" || candidate.kind === "build_scoring_remote" ? 70 - scorePressure : -10;
  return {
    score,
    reasons: candidate.kind === "score_now" ? ["score_window_visible"] : ["agenda_risk_from_public_score"],
    evidence: [`agenda_own:${features.agendaPoints}`, `agenda_runner:${features.opponentAgendaPoints}`, `agenda_to_win:${features.agendaPointsToWin}`]
  };
}

export function evaluateServerThreat(input: AiDecisionInput, candidate: CorpPlanCandidate, beliefState: BeliefState = reconstructBeliefState(input)): CorpPlanEvaluatorResult {
  const features = extractCorpPlanFeatures(input);
  const memory = evaluateRemoteIntentMemory(input, beliefState);
  const threatModel = beliefState.corpOpponentModel?.runnerThreatModel;
  const hq = features.serverFeatures.get("hq");
  const rd = features.serverFeatures.get("rd");
  const hqThreat = memory.centralRunSignals.hq * 45 - (hq?.iceCount ?? 0) * 25 + (threatModel?.hqPressure ?? 0) * 40;
  const rdThreat = memory.centralRunSignals.rd * 45 - (rd?.iceCount ?? 0) * 25 + (threatModel?.rndPressure ?? 0) * 40;
  const score =
    candidate.kind === "protect_hq"
      ? 120 + hqThreat
      : candidate.kind === "protect_rnd"
        ? 120 + rdThreat
        : candidate.kind === "build_scoring_remote"
          ? Math.max(0, 35 - Math.max(hqThreat, rdThreat))
          : -5;
  return {
    score,
    reasons: ["server_threat_from_visible_board"],
    evidence: [`hq_ice:${hq?.iceCount ?? 0}`, `rd_ice:${rd?.iceCount ?? 0}`, `hq_runs:${memory.centralRunSignals.hq}`, `rd_runs:${memory.centralRunSignals.rd}`, `runner_remote_pressure:${round(threatModel?.remotePressure ?? 0)}`]
  };
}

export function evaluateEconomyReserve(input: AiDecisionInput, candidate: CorpPlanCandidate): CorpPlanEvaluatorResult {
  const features = extractCorpPlanFeatures(input);
  const hasEconomyRole = candidate.requiredRoles.some((role) => role.includes("economy") || role.includes("draw"));
  const lowCredits = features.credits < 5;
  const centralProtectPenalty = lowReserveCentralProtectPenalty(input, candidate, features);
  const score = candidate.kind === "recover_economy" ? (lowCredits ? 170 : 80) + (hasEconomyRole ? 45 : 0) : lowCredits ? -40 - centralProtectPenalty : 20;
  return {
    score,
    reasons: sortedUnique([lowCredits ? "credit_reserve_low" : "credit_reserve_stable", ...(centralProtectPenalty > 0 ? ["central_protect_credit_reserve_low"] : [])]),
    evidence: [`credits:${features.credits}`, `clicks:${features.clicks}`, `economy_role:${hasEconomyRole}`, `central_protect_penalty:${centralProtectPenalty}`]
  };
}

function lowReserveCentralProtectPenalty(input: AiDecisionInput, candidate: CorpPlanCandidate, features: CorpPlanFeatures): number {
  if (candidate.kind !== "protect_hq" && candidate.kind !== "protect_rnd") return 0;
  if (features.credits > 1) return 0;
  const serverId = candidate.kind === "protect_hq" ? "hq" : "rd";
  const server = features.serverFeatures.get(serverId);
  const recentPressure = input.eventTail.filter((event) => serverIdFromEvent(event) === serverId && (event.type.includes("run") || event.type.includes("access") || event.type.includes("breach"))).length;
  if (recentPressure >= 2 && (server?.iceCount ?? 0) === 0) return 0;
  return 180;
}

export function evaluateIceRez(input: AiDecisionInput, candidate: CorpPlanCandidate): CorpPlanEvaluatorResult {
  const features = extractCorpPlanFeatures(input);
  const iceRoles = candidate.requiredRoles.filter((role) => role.endsWith("_ice") || role === "etr_ice" || role === "taxing_ice" || role === "tag_ice");
  const score = candidate.kind === "protect_hq" || candidate.kind === "protect_rnd" ? 60 + iceRoles.length * 20 + Math.min(features.credits, 8) * 4 : iceRoles.length * 12;
  return {
    score,
    reasons: iceRoles.length > 0 ? ["ice_roles_available"] : ["no_ice_role_needed"],
    evidence: [`ice_roles:${iceRoles.length}`, `runner_credits_visible:${features.runnerCredits}`]
  };
}

export function evaluateScoringWindow(input: AiDecisionInput, candidate: CorpPlanCandidate): CorpPlanEvaluatorResult {
  const features = extractCorpPlanFeatures(input);
  const hasScoreAction = candidate.legalActionIds.some((actionId) => input.legalActions.find((action) => action.actionId === actionId)?.type === "score_agenda");
  const hasAdvanceAction = candidate.legalActionIds.some((actionId) => input.legalActions.find((action) => action.actionId === actionId)?.type === "advance_card");
  const score = hasScoreAction ? 220 : hasAdvanceAction && features.clicks >= 2 ? 140 : candidate.kind === "score_next_turn" ? 45 : 0;
  return {
    score,
    reasons: hasScoreAction ? ["legal_score_action"] : hasAdvanceAction ? ["legal_advance_action"] : ["no_current_score_window"],
    evidence: [`score_action:${hasScoreAction}`, `advance_action:${hasAdvanceAction}`, `clicks:${features.clicks}`]
  };
}

export function evaluateCorpScoringProgress(input: AiDecisionInput, candidate: CorpPlanCandidate, context: CorpEvaluationContext = createCorpEvaluationContext(input)): CorpPlanEvaluatorResult {
  const features = extractCorpPlanFeatures(input);
  const hqIce = features.serverFeatures.get("hq")?.iceCount ?? 0;
  const rdIce = features.serverFeatures.get("rd")?.iceCount ?? 0;
  const centralIce = hqIce + rdIce;
  const stalledWithoutPoints = features.agendaPoints === 0 && input.actionNumber >= 24;
  const lateWithoutPoints = features.agendaPoints === 0 && input.actionNumber >= 48;
  const scoreActions = actionsForCandidate(input, candidate);
  const hasScoreAction = scoreActions.some((action) => action.type === "score_agenda");
  const hasProtectedAgendaInstall = scoreActions.some((action) => action.type === "install_card" && action.payload?.placement !== "ice" && rolesForAction(input, action).some(isAgendaRole) && remoteRootActionSecurityScore(input, action, context) > 0);
  let score = 0;
  const reasons: string[] = [];

  if (candidate.kind === "score_now" && hasScoreAction) {
    score += 180;
    reasons.push("corp_score_window_close_now");
  }
  if ((candidate.kind === "score_next_turn" || candidate.kind === "build_scoring_remote") && hasProtectedAgendaInstall) {
    score += stalledWithoutPoints ? 120 : 55;
    if (lateWithoutPoints) score += 55;
    reasons.push("protected_agenda_scoring_progress");
  }
  if ((candidate.kind === "protect_hq" || candidate.kind === "protect_rnd") && stalledWithoutPoints && hqIce > 0 && rdIce > 0) {
    score -= lateWithoutPoints ? 105 : 65;
    reasons.push("central_defense_saturated_before_scoring");
  }

  return {
    score,
    reasons,
    evidence: [
      `scoring_progress_score:${score}`,
      `corp_points:${features.agendaPoints}`,
      `scoring_progress_action:${input.actionNumber}`,
      `central_ice:${centralIce}`,
      `protected_agenda_install:${hasProtectedAgendaInstall}`,
      `score_now_action:${hasScoreAction}`
    ]
  };
}

function evaluateRemoteScoringContest(input: AiDecisionInput, candidate: CorpPlanCandidate, context: CorpEvaluationContext): CorpPlanEvaluatorResult {
  if (candidate.kind !== "build_scoring_remote" && candidate.kind !== "score_next_turn") {
    return { score: 0, reasons: [], evidence: [] };
  }
  const serverIds = sortedUnique(actionsForCandidate(input, candidate).map((action) => remoteServerIdForAction(input, action)).filter((serverId): serverId is string => Boolean(serverId?.startsWith("remote_"))));
  if (serverIds.length === 0) return { score: 0, reasons: [], evidence: ["runner_contest_capacity:none"] };
  const assessments = serverIds.map((serverId) => evaluateRunnerContestCapacity(input, serverId, context)).sort((left, right) => right.scoreModifier - left.scoreModifier || left.serverId.localeCompare(right.serverId));
  const assessment = assessments[0]!;
  return {
    score: assessment.scoreModifier,
    reasons: assessment.reasons,
    evidence: assessment.evidence
  };
}

export function evaluateRunnerContestCapacity(input: AiDecisionInput, serverId: string, contextOrBelief: BeliefState | CorpEvaluationContext = reconstructBeliefState(input)): RunnerContestCapacity {
  const context = corpEvaluationContext(input, contextOrBelief);
  const cached = context.runnerContestByServerId.get(serverId);
  if (cached) return cached;
  const result = computeRunnerContestCapacity(input, serverId, context.beliefState);
  context.runnerContestByServerId.set(serverId, result);
  return result;
}

function computeRunnerContestCapacity(input: AiDecisionInput, serverId: string, beliefState: BeliefState): RunnerContestCapacity {
  const runnerCredits = input.playerView.opponent.credits;
  const rigCards = input.playerView.opponent.rig ?? [];
  const installedBreakers = rigCards.filter((card) => card.known && card.definitionId && RUNTIME_CARDS[card.definitionId]?.subtypes.includes("icebreaker")).length;
  const server = input.playerView.servers.find((candidate) => candidate.id === serverId);
  const remotePressure = beliefState.corpOpponentModel?.runnerThreatModel.remotePressure ?? 0;
  if (!server || !serverId.startsWith("remote_")) {
    return runnerContestCapacityResult(serverId, "high", runnerCredits, installedBreakers, undefined, ["runner_remote_contest_invalid_server"], [`runner_contest_capacity:high`, `runner_credits_visible:${runnerCredits}`, `runner_breakers_visible:${installedBreakers}`, "remote_ice:0"]);
  }
  if (server.ice.length <= 0) {
    return runnerContestCapacityResult(serverId, "high", runnerCredits, installedBreakers, 0, ["runner_remote_contest_unprotected"], [`runner_contest_capacity:high`, `runner_credits_visible:${runnerCredits}`, `runner_breakers_visible:${installedBreakers}`, "remote_ice:0"]);
  }

  const knownPath = assessKnownIcePathForRunnerContest(server.ice, rigCards, runnerCredits);
  const evidence = [
    `runner_contest_capacity:${knownPath.capacity}`,
    `runner_credits_visible:${runnerCredits}`,
    `runner_breakers_visible:${installedBreakers}`,
    `remote_ice:${server.ice.length}`,
    `remote_rezzed_ice:${server.ice.filter((ice) => ice.rezzed === true).length}`,
    `remote_unrezzed_ice:${server.ice.filter((ice) => ice.rezzed !== true).length}`,
    `visible_break_cost:${knownPath.visibleBreakCost ?? "unknown"}`,
    `runner_remote_pressure:${round(remotePressure)}`
  ];
  return runnerContestCapacityResult(serverId, knownPath.capacity, runnerCredits, installedBreakers, knownPath.visibleBreakCost, knownPath.reasons, evidence);
}

export function evaluateRemoteScoreHorizon(input: AiDecisionInput, candidate: CorpPlanCandidate, contextOrBelief: BeliefState | CorpEvaluationContext = reconstructBeliefState(input)): CorpPlanEvaluatorResult {
  const context = corpEvaluationContext(input, contextOrBelief);
  if (candidate.kind !== "score_now" && candidate.kind !== "score_next_turn" && candidate.kind !== "build_scoring_remote") {
    return { score: 0, reasons: [], evidence: [] };
  }
  const horizons = actionsForCandidate(input, candidate)
    .map((action) => remoteScoreHorizonForAction(input, action, context))
    .filter((horizon): horizon is RemoteScoreHorizon => Boolean(horizon))
    .sort((left, right) => right.scoreModifier - left.scoreModifier || left.actionId.localeCompare(right.actionId));
  const best = horizons[0];
  if (!best) return { score: 0, reasons: [], evidence: ["score_horizon:none"] };
  return {
    score: best.scoreModifier,
    reasons: best.reasons,
    evidence: best.evidence
  };
}

function remoteScoreHorizonForAction(input: AiDecisionInput, action: LegalAction, context: CorpEvaluationContext): RemoteScoreHorizon | undefined {
  if (context.scoreHorizonByActionId.has(action.actionId)) return context.scoreHorizonByActionId.get(action.actionId);
  if (action.type !== "score_agenda" && action.type !== "advance_card" && action.type !== "install_card") {
    context.scoreHorizonByActionId.set(action.actionId, undefined);
    return undefined;
  }
  const card = findVisibleCard(input, action.source);
  if (!card?.definitionId || !isAgendaDefinition(card.definitionId)) {
    context.scoreHorizonByActionId.set(action.actionId, undefined);
    return undefined;
  }
  const requirement = card.advancementRequirement ?? DEMO_CARDS_BY_ID[card.definitionId]?.advancementRequirement ?? 0;
  const countersBefore = card.advancementCounters ?? 0;
  const countersAfter = action.type === "advance_card" ? countersBefore + 1 : action.type === "install_card" ? 0 : countersBefore;
  const advancesRemaining = Math.max(0, requirement - countersAfter);
  const serverId = remoteServerIdForAction(input, action);
  const contest = serverId?.startsWith("remote_") ? evaluateRunnerContestCapacity(input, serverId, context) : undefined;
  const estimatedTurnsToScore = action.type === "score_agenda" ? 0 : estimateTurnsToScore(advancesRemaining);
  const scoreModifier = scoreHorizonModifier(action.type, advancesRemaining, contest?.capacity);
  const reasons = scoreHorizonReasons(action.type, advancesRemaining, contest?.capacity);
  const evidence = [
    `score_horizon_action:${action.type}`,
    `score_horizon_advancement_requirement:${requirement}`,
    `score_horizon_counters_after_action:${countersAfter}`,
    `score_horizon_advances_remaining_after_action:${advancesRemaining}`,
    `score_horizon_turns_to_score:${estimatedTurnsToScore}`,
    ...(contest ? [`score_horizon_contest_capacity:${contest.capacity}`] : [])
  ];
  const horizon = {
    actionId: action.actionId,
    ...(serverId ? { serverId } : {}),
    actionType: action.type,
    scoreModifier,
    advancementRequirement: requirement,
    advancementCountersAfterAction: countersAfter,
    advancesRemainingAfterAction: advancesRemaining,
    estimatedTurnsToScore,
    ...(contest ? { contestCapacity: contest.capacity } : {}),
    reasons,
    evidence
  };
  context.scoreHorizonByActionId.set(action.actionId, horizon);
  return horizon;
}

function scoreHorizonModifier(actionType: LegalAction["type"], advancesRemaining: number, contestCapacity: RunnerContestCapacity["capacity"] | undefined): number {
  if (actionType === "score_agenda") return 130;
  const proximity = advancesRemaining <= 0 ? 120 : advancesRemaining === 1 ? 80 : advancesRemaining === 2 ? 45 : advancesRemaining <= 4 ? 15 : -10;
  const contest = contestCapacity === "low" ? 35 : contestCapacity === "high" ? -45 : 0;
  const longHighRiskPenalty = advancesRemaining >= 3 && contestCapacity === "high" ? 30 : 0;
  return proximity + contest - longHighRiskPenalty;
}

function scoreHorizonReasons(actionType: LegalAction["type"], advancesRemaining: number, contestCapacity: RunnerContestCapacity["capacity"] | undefined): string[] {
  const reasons: string[] = [];
  if (actionType === "score_agenda") reasons.push("score_horizon_score_now");
  else if (advancesRemaining <= 0) reasons.push("score_horizon_opens_score_window");
  else if (advancesRemaining <= 2) reasons.push("score_horizon_near_term_score");
  else reasons.push("score_horizon_long_score_plan");
  if (contestCapacity === "low") reasons.push("score_horizon_runner_contest_low");
  if (contestCapacity === "high") reasons.push("score_horizon_runner_contest_high");
  return reasons;
}

function estimateTurnsToScore(advancesRemaining: number): number {
  if (advancesRemaining <= 0) return 0;
  return Math.ceil(advancesRemaining / 3);
}

function runnerContestCapacityResult(
  serverId: string,
  capacity: RunnerContestCapacity["capacity"],
  runnerCredits: number,
  installedBreakers: number,
  visibleBreakCost: number | undefined,
  reasons: string[],
  evidence: string[]
): RunnerContestCapacity {
  const scoreModifier = capacity === "low" ? 90 : capacity === "medium" ? 20 : -85;
  return {
    serverId,
    capacity,
    scoreModifier,
    runnerCredits,
    installedBreakers,
    ...(visibleBreakCost !== undefined ? { visibleBreakCost } : {}),
    reasons,
    evidence
  };
}

function assessKnownIcePathForRunnerContest(
  iceCards: Array<{ definitionId?: string; rezzed?: boolean; known: boolean; subtypes?: string[]; strength?: number }>,
  rigCards: VisibleCard[],
  runnerCredits: number
): { capacity: RunnerContestCapacity["capacity"]; visibleBreakCost?: number; reasons: string[] } {
  const installedBreakers = rigCards.filter((card) => card.known && card.definitionId && RUNTIME_CARDS[card.definitionId]?.subtypes.includes("icebreaker")).length;
  if (installedBreakers === 0 && runnerCredits <= 2) return { capacity: "low", reasons: ["runner_remote_contest_low_no_breaker_low_credits"] };

  let visibleBreakCost = 0;
  let relevantKnownIce = 0;
  const breakerStrengths = new Map(rigCards.map((card) => [card.instanceId, card.strength ?? cardDefinitionStrength(card.definitionId)]));
  for (const ice of iceCards.slice().reverse()) {
    if (!ice.definitionId || !ice.known) continue;
    const endTheRunCount = endTheRunSubroutineCount(ice.definitionId);
    if (endTheRunCount === 0) continue;
    relevantKnownIce += 1;
    const breakAssessment = minimumCreditsToBreakEndTheRunSubroutines(ice, rigCards, endTheRunCount, breakerStrengths);
    if (!breakAssessment) return { capacity: "low", ...(visibleBreakCost > 0 ? { visibleBreakCost } : {}), reasons: ["runner_remote_contest_low_missing_breaker"] };
    visibleBreakCost += breakAssessment.cost;
    breakerStrengths.set(breakAssessment.breakerInstanceId, breakAssessment.endingStrength);
  }

  if (relevantKnownIce > 0 && visibleBreakCost > runnerCredits) return { capacity: "low", visibleBreakCost, reasons: ["runner_remote_contest_low_break_cost"] };
  if (relevantKnownIce > 0 && runnerCredits >= visibleBreakCost + 3 && installedBreakers > 0) return { capacity: "high", visibleBreakCost, reasons: ["runner_remote_contest_high_visible_breaker"] };
  if (installedBreakers === 0 || runnerCredits <= 3) return { capacity: "low", ...(visibleBreakCost > 0 ? { visibleBreakCost } : {}), reasons: ["runner_remote_contest_low_rig_or_credits"] };
  return { capacity: "medium", ...(visibleBreakCost > 0 ? { visibleBreakCost } : {}), reasons: ["runner_remote_contest_medium_uncertain"] };
}

function remoteServerIdForAction(input: AiDecisionInput, action: LegalAction): string | undefined {
  if (typeof action.payload?.serverId === "string") return action.payload.serverId;
  for (const server of input.playerView.servers) {
    if (!server.id.startsWith("remote_")) continue;
    if (server.root.some((card) => card.instanceId === action.source)) return server.id;
    if (server.ice.some((card) => card.instanceId === action.source)) return server.id;
  }
  return undefined;
}

function actionsForCandidate(input: AiDecisionInput, candidate: CorpPlanCandidate): LegalAction[] {
  return candidate.legalActionIds.map((actionId) => input.legalActions.find((action) => action.actionId === actionId)).filter((action): action is LegalAction => Boolean(action));
}

export function evaluateRemoteIntentMemory(input: AiDecisionInput, beliefState: BeliefState = reconstructBeliefState(input)): RemoteIntentMemory {
  let remoteInstallSignals = 0;
  let remoteAdvanceSignals = 0;
  let remoteScoreSignals = 0;
  const centralRunSignals = { hq: 0, rd: 0 };
  for (const event of input.eventTail) {
    const serverId = serverIdFromEvent(event);
    if (typeof serverId === "string" && serverId.startsWith("remote_")) {
      if (event.type.includes("install")) remoteInstallSignals += 1;
      if (event.type.includes("advance")) remoteAdvanceSignals += 1;
      if (event.type.includes("score")) remoteScoreSignals += 1;
    }
    if (serverId === "hq") centralRunSignals.hq += event.type.includes("run") || event.type.includes("breach") || event.type.includes("access") ? 1 : 0;
    if (serverId === "rd") centralRunSignals.rd += event.type.includes("run") || event.type.includes("breach") || event.type.includes("access") ? 1 : 0;
  }
  return {
    remoteInstallSignals,
    remoteAdvanceSignals,
    remoteScoreSignals,
    centralRunSignals,
    evidence: [
      `remote_installs:${remoteInstallSignals}`,
      `remote_advances:${remoteAdvanceSignals}`,
      `remote_scores:${remoteScoreSignals}`,
      `runner_remote_contest_probability:${round(beliefState.corpOpponentModel?.remoteContestProbability ?? 0)}`
    ]
  };
}

export function corpPlanUsesOnlyAiSupportedCards(input: AiDecisionInput, candidate: CorpPlanCandidate): boolean {
  return candidate.legalActionIds.every((actionId) => {
    const action = input.legalActions.find((legalAction) => legalAction.actionId === actionId);
    if (!action || action.source === "basic_action" || action.source === "game_rule") return true;
    const card = findVisibleCard(input, action.source);
    return card ? isAiSupportedCard(card.definitionId) : true;
  });
}

function buildCandidate(input: AiDecisionInput, kind: CorpPlanKind, actions: LegalAction[]): CorpPlanCandidate | null {
  const legalActions = actions.filter((action) => action.side === "corp" && PLAN_ACTION_TYPES.has(action.type));
  if (legalActions.length === 0) return null;
  const steps = legalActions.map((action, index) => ({
    stepId: `${kind}:step:${index + 1}`,
    actionId: action.actionId,
    actionType: action.type,
    ...(typeof action.payload?.serverId === "string" ? { targetServerId: action.payload.serverId } : {}),
    roleTags: rolesForAction(input, action)
  }));
  const requiredRoles = sortedUnique(steps.flatMap((step) => step.roleTags));
  return {
    planId: `${kind}:${legalActions.map((action) => action.actionId).sort().join("|")}`,
    kind,
    legalActionIds: legalActions.map((action) => action.actionId).sort(),
    steps,
    expectedBenefits: expectedBenefitsForPlan(kind),
    visibleRisks: visibleRisksForPlan(kind, requiredRoles),
    requiredRoles
  };
}

function selectPlanAction(input: AiDecisionInput, candidate: CorpPlanCandidate, context: CorpEvaluationContext): LegalAction | undefined {
  const actions = candidate.legalActionIds
    .map((actionId) => input.legalActions.find((action) => action.actionId === actionId))
    .filter((action): action is LegalAction => Boolean(action))
    .sort((left, right) => actionPriority(input, candidate.kind, right, context) - actionPriority(input, candidate.kind, left, context) || compareAction(left, right));
  return actions[0];
}

function actionPriority(input: AiDecisionInput, kind: CorpPlanKind, action: LegalAction, context: CorpEvaluationContext): number {
  if (kind === "score_now" && action.type === "score_agenda") return 100;
  if (kind === "score_next_turn" && action.type === "advance_card") return 90 + boundedScoreHorizonActionBonus(input, action, context);
  if ((kind === "protect_hq" || kind === "protect_rnd") && action.type === "install_card" && action.payload?.placement === "ice") return 85;
  if (kind === "recover_economy" && action.type === "play_operation") return 80;
  if (kind === "recover_economy" && action.type === "draw_card" && shouldCorpDrawForScoring(input)) return 78;
  if (kind === "recover_economy" && action.type === "gain_credit") return 65;
  if (kind === "score_next_turn" && action.type === "install_card" && action.payload?.placement !== "ice") return 65 + boundedRemotePriorityBonus(input, action, context) + boundedScoreHorizonActionBonus(input, action, context);
  if ((kind === "build_scoring_remote" || kind === "bait_runner") && action.type === "install_card" && action.payload?.placement !== "ice") return 75 + boundedRemotePriorityBonus(input, action, context) + boundedScoreHorizonActionBonus(input, action, context);
  if (action.type === "draw_card") return 45;
  if (action.type === "end_turn") return 5;
  return 20;
}

function shouldCorpDrawForScoring(input: AiDecisionInput): boolean {
  if (input.side !== "corp" || input.playerView.activeSide !== "corp" || input.playerView.phase !== "corp_action_phase") return false;
  if (input.playerView.own.credits < 4 || input.playerView.own.clicks < 2) return false;
  if (input.playerView.own.stackOrRdCount <= 0) return false;
  const hqIce = input.playerView.servers.find((server) => server.id === "hq")?.ice.length ?? 0;
  const rdIce = input.playerView.servers.find((server) => server.id === "rd")?.ice.length ?? 0;
  if (hqIce <= 0 || rdIce <= 0) return false;
  const agendaInHand = input.playerView.own.gripOrHq.some((card) => card.definitionId && RUNTIME_CARDS[card.definitionId]?.type === "agenda");
  if (agendaInHand) return false;
  return !input.legalActions.some((action) => action.type === "score_agenda" || action.type === "advance_card" || (action.type === "install_card" && action.payload?.placement !== "ice" && rolesForAction(input, action).some(isAgendaRole)));
}

function extractCorpPlanFeatures(input: AiDecisionInput): CorpPlanFeatures {
  return {
    credits: input.playerView.own.credits,
    clicks: input.playerView.own.clicks,
    handCount: input.playerView.own.gripOrHq.length,
    agendaPoints: input.playerView.own.agendaPoints,
    opponentAgendaPoints: input.playerView.opponent.agendaPoints,
    agendaPointsToWin: input.playerView.agendaPointsToWin,
    runnerCredits: input.playerView.opponent.credits,
    runnerTags: input.playerView.opponent.tags,
    serverFeatures: new Map(
      input.playerView.servers.map((server) => [
        server.id,
        {
          iceCount: server.ice.length,
          rootCount: server.root.length,
          knownRootCount: server.root.filter((card) => card.known).length,
          rezzedIceCount: server.ice.filter((card) => card.rezzed === true).length,
          unrezzedIceCount: server.ice.filter((card) => card.rezzed !== true).length
        }
      ])
    )
  };
}

function rolesForAction(input: AiDecisionInput, action: LegalAction): string[] {
  if (action.source === "basic_action" || action.source === "game_rule") return [];
  const visible = findVisibleCard(input, action.source);
  return rolesForCardId(visible?.definitionId);
}

function findVisibleCard(input: AiDecisionInput, instanceId: string): VisibleCard | undefined {
  const zones = [
    input.playerView.own.gripOrHq,
    input.playerView.own.heapOrArchives,
    input.playerView.own.scoreArea,
    ...(input.playerView.own.rig ?? []),
    ...input.playerView.servers.flatMap((server) => [server.ice, server.root])
  ];
  return zones.flat().find((card) => card.instanceId === instanceId && card.known);
}

function rolesForCardId(cardId: string | undefined): string[] {
  if (!cardId || !isAiSupportedCard(cardId)) return [];
  const roleRecord = CARD_ROLES_BY_CARD.get(cardId);
  const hint = AI_HINTS.get(cardId);
  return sortedUnique([...(roleRecord?.roles ?? []), ...(hint?.roles ?? []), ...(hint?.planRoles ?? [])]);
}

function isAiSupportedCard(cardId: string | undefined): boolean {
  return Boolean(cardId && RUNTIME_CARDS[cardId]?.statuses.ai_supported === true);
}

function corpPlanProfile(input: AiDecisionInput): CorpPlanProfile {
  return (
    CORP_PLAN_PROFILES.find((profile) => profile.profileId === input.profileId || profile.legacyProfileIds.includes(input.profileId)) ??
    CORP_PLAN_PROFILES.find((profile) => profile.difficulty === input.difficulty) ??
    CORP_PLAN_PROFILES[1]!
  );
}

function fallbackPlanDecision(input: AiDecisionInput, reason: string, timeBudgetMs: number, timeoutUsed: boolean, beliefState: BeliefState): CorpPlanDecision {
  const fallbackAction = input.legalActions.slice().sort(compareAction)[0];
  const debug = fallbackDebug(input, undefined, reason, timeBudgetMs, timeoutUsed, beliefState);
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
      evidence: [reason]
    },
    debug
  };
}

function fallbackDebug(
  input: AiDecisionInput,
  fallbackDecision: AiDecision | undefined,
  reason: string,
  timeBudgetMs: number | undefined,
  timeoutUsed = false,
  beliefState: BeliefState = reconstructBeliefState(input)
): CorpPlanDebug {
  const fallbackAction = fallbackDecision ? input.legalActions.find((action) => action.actionId === fallbackDecision.actionId) : input.legalActions.slice().sort(compareAction)[0];
  const beliefSummary = beliefDebugSummary(beliefState);
  const opponentModel = toRecord(beliefSummary.corpOpponentModel);
  return {
    schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
    aiLevel: 2,
    planId: "fallback",
    planKind: "fallback",
    selectedActionType: fallbackAction?.type ?? "none",
    score: 0,
    confidence: fallbackDecision?.confidence ?? 0.2,
    visibleReasons: [reason],
    evidence: scrubPlanEvidence([reason]),
    fallbackUsed: true,
    seed: input.seed,
    profileId: corpPlanProfile(input).profileId,
    timeBudgetMs: timeBudgetMs ?? corpPlanProfile(input).timeBudgetMs,
    timeoutUsed,
    ...(input.ownDeckDoctrine ? { ownDeckDoctrine: deckDoctrineDebug(input.ownDeckDoctrine), doctrinePlanWeight: 0 } : {}),
    memoryVersion: String(beliefSummary.memoryVersion ?? ""),
    facts: toStringArray(beliefSummary.facts),
    hypotheses: toStringArray(beliefSummary.hypotheses),
    invalidations: toStringArray(beliefSummary.invalidations),
    beliefUncertainty: toStringArray(beliefSummary.uncertainty),
    ...(opponentModel ? { opponentModel } : {})
  };
}

function baseScoreForPlan(kind: CorpPlanKind): number {
  switch (kind) {
    case "score_now":
      return 500;
    case "score_next_turn":
      return 340;
    case "build_scoring_remote":
      return 260;
    case "protect_hq":
    case "protect_rnd":
      return 190;
    case "recover_economy":
      return 230;
    case "bait_runner":
      return 210;
  }
}

function doctrinePlanWeightFor(input: AiDecisionInput, kind: CorpPlanKind): number {
  const profile = input.ownDeckDoctrine;
  if (!profile || profile.side !== "corp") return 0;
  const raw = profile.planWeights[kind] ?? 0;
  const confidence = Number.isFinite(profile.confidence) ? profile.confidence : 0.5;
  return Math.round(raw * Math.max(0.25, Math.min(1, confidence)));
}

function deckDoctrineDebug(profile: AiDeckDoctrineProfile): NonNullable<CorpPlanDebug["ownDeckDoctrine"]> {
  return {
    deckSnapshotId: profile.deckSnapshotId,
    side: profile.side,
    confidence: profile.confidence,
    archetypeTags: profile.archetypeTags.slice(0, 4),
    riskFlags: profile.riskFlags.slice(0, 6)
  };
}

function visibleRiskPenalty(candidate: CorpPlanCandidate, riskTolerance: number): number {
  return candidate.visibleRisks.length * 20 * (1 - riskTolerance);
}

function expectedBenefitsForPlan(kind: CorpPlanKind): string[] {
  switch (kind) {
    case "score_now":
      return ["benefit:agenda_points_now"];
    case "score_next_turn":
      return ["benefit:near_term_score"];
    case "build_scoring_remote":
      return ["benefit:remote_development"];
    case "protect_hq":
      return ["benefit:hq_defense"];
    case "protect_rnd":
      return ["benefit:rd_defense"];
    case "recover_economy":
      return ["benefit:credit_reserve"];
    case "bait_runner":
      return ["benefit:remote_pressure_signal"];
  }
}

function visibleRisksForPlan(kind: CorpPlanKind, roles: string[]): string[] {
  const risks: string[] = [];
  if (kind === "build_scoring_remote" || kind === "score_next_turn") risks.push("risk:remote_access");
  if (kind === "bait_runner") risks.push("risk:asset_access");
  if (roles.length === 0 && kind !== "recover_economy" && kind !== "score_now") risks.push("risk:no_ai_role");
  return risks;
}

function remoteRootExposurePenalty(input: AiDecisionInput, candidate: CorpPlanCandidate, riskTolerance: number, context: CorpEvaluationContext): number {
  if (candidate.kind !== "score_next_turn" && candidate.kind !== "build_scoring_remote") return 0;
  const rootActions = candidate.legalActionIds
    .map((actionId) => input.legalActions.find((action) => action.actionId === actionId))
    .filter((action): action is LegalAction => Boolean(action && action.type === "install_card" && action.payload?.placement !== "ice"));
  if (rootActions.length === 0) return 0;
  const worstAgendaExposure = Math.min(
    0,
    ...rootActions
      .filter((action) => rolesForAction(input, action).some(isAgendaRole))
      .map((action) => remoteRootActionSecurityScore(input, action, context))
  );
  if (worstAgendaExposure >= 0) return 0;
  const hasProtectedAgendaInstall = rootActions.some((action) => rolesForAction(input, action).some(isAgendaRole) && remoteRootActionSecurityScore(input, action, context) > 0);
  const hasCentralOrRemoteIceInstall = input.legalActions.some((action) => action.side === "corp" && action.type === "install_card" && action.payload?.placement === "ice");
  const cautionMultiplier = 1.25 - riskTolerance;
  const avoidableExposure = hasProtectedAgendaInstall || hasCentralOrRemoteIceInstall ? 1.4 : 1;
  return Math.round(Math.abs(worstAgendaExposure) * cautionMultiplier * avoidableExposure);
}

function remoteRootExposureEvidence(input: AiDecisionInput, candidate: CorpPlanCandidate, context: CorpEvaluationContext): string[] {
  const scores = candidate.legalActionIds
    .map((actionId) => input.legalActions.find((action) => action.actionId === actionId))
    .filter((action): action is LegalAction => Boolean(action && action.type === "install_card" && action.payload?.placement !== "ice"))
    .map((action) => `remote_root_security:${String(action.payload?.serverId ?? "unknown")}:${remoteRootActionSecurityScore(input, action, context)}`);
  return scores.slice(0, 4);
}

function remoteRootActionSecurityScore(input: AiDecisionInput, action: LegalAction, context: CorpEvaluationContext): number {
  const cached = context.remoteRootSecurityByActionId.get(action.actionId);
  if (cached !== undefined) return cached;
  if (action.type !== "install_card" || action.payload?.placement === "ice") {
    context.remoteRootSecurityByActionId.set(action.actionId, 0);
    return 0;
  }
  const roles = rolesForAction(input, action);
  const isAgenda = roles.some(isAgendaRole);
  const serverId = action.payload?.serverId;
  if (!isAgenda) return cacheRemoteRootSecurity(context, action, serverId === "new_remote" ? 5 : 20);
  if (serverId === "new_remote") return cacheRemoteRootSecurity(context, action, -120);
  if (typeof serverId !== "string") return cacheRemoteRootSecurity(context, action, -90);
  const server = input.playerView.servers.find((candidate) => candidate.id === serverId);
  if (!server || !serverId.startsWith("remote_")) return cacheRemoteRootSecurity(context, action, -90);
  if (server.ice.length <= 0) return cacheRemoteRootSecurity(context, action, -95);
  const rezzedIceBonus = server.ice.some((ice) => ice.rezzed === true) ? 35 : 0;
  const contestCapacity = evaluateRunnerContestCapacity(input, serverId, context);
  const contestSecurity = contestCapacity.capacity === "low" ? 55 : contestCapacity.capacity === "medium" ? 0 : -120;
  return cacheRemoteRootSecurity(context, action, 90 + Math.min(server.ice.length, 3) * 20 + rezzedIceBonus + contestSecurity);
}

function cacheRemoteRootSecurity(context: CorpEvaluationContext, action: LegalAction, score: number): number {
  context.remoteRootSecurityByActionId.set(action.actionId, score);
  return score;
}

function boundedRemotePriorityBonus(input: AiDecisionInput, action: LegalAction, context: CorpEvaluationContext): number {
  const score = remoteRootActionSecurityScore(input, action, context);
  return Math.max(-45, Math.min(20, Math.round(score / 6)));
}

function boundedScoreHorizonActionBonus(input: AiDecisionInput, action: LegalAction, context: CorpEvaluationContext): number {
  const horizon = remoteScoreHorizonForAction(input, action, context);
  if (!horizon) return 0;
  return Math.max(-25, Math.min(25, Math.round(horizon.scoreModifier / 6)));
}

function isSafeScoringRootAction(input: AiDecisionInput, action: LegalAction, context: CorpEvaluationContext): boolean {
  return rolesForAction(input, action).some(isAgendaRole) && remoteRootActionSecurityScore(input, action, context) > 0;
}

function isAgendaRole(role: string): boolean {
  return role === "agenda" || role === "corp_score_agenda" || role === "score_agenda" || role.startsWith("agenda_");
}

function isAgendaDefinition(definitionId: string): boolean {
  return DEMO_CARDS_BY_ID[definitionId]?.type === "agenda" || RUNTIME_CARDS[definitionId]?.type === "agenda";
}

function explanationForPlan(kind: CorpPlanDebug["planKind"]): string {
  switch (kind) {
    case "score_now":
      return "Die Corp nutzt ein sichtbares legales Scoring-Fenster.";
    case "score_next_turn":
      return "Die Corp bereitet aus legalen Aktionen ein naheliegendes Scoring-Fenster vor.";
    case "build_scoring_remote":
      return "Die Corp baut anhand sichtbarer Lage einen Scoring-Remote auf.";
    case "protect_hq":
      return "Die Corp schützt HQ gegen sichtbaren Zentralserverdruck.";
    case "protect_rnd":
      return "Die Corp schützt R&D gegen sichtbaren Zentralserverdruck.";
    case "recover_economy":
      return "Die Corp priorisiert ihre sichtbare Credit-Reserve.";
    case "bait_runner":
      return "Die Corp setzt einen legalen Remote-Impuls, ohne verdeckte Runnerdaten zu verwenden.";
    case "fallback":
      return "Die Corp nutzt einen legalen Fallback.";
  }
}

function isRemoteServerId(value: unknown): boolean {
  return value === "new_remote" || (typeof value === "string" && value.startsWith("remote_"));
}

function scrubPlanEvidence(evidence: string[]): string[] {
  const forbidden = ["cardInstances", "privatePayload", "sessionToken", "reconnectToken", "joinToken", "tokenHash", "fullGameState", "FullState"];
  return evidence.filter((entry) => !forbidden.some((needle) => entry.includes(needle)) && !entry.includes("runner_simple_")).slice(0, 32);
}

function confidence(score: number, actionCount: number): number {
  return Math.max(0.15, Math.min(0.98, round(score / 1000 + Math.min(actionCount, 3) * 0.03)));
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
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function compareAction(left: LegalAction, right: LegalAction): number {
  return left.actionId.localeCompare(right.actionId);
}
