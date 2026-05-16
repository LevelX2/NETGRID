import runnerPlanProfilesData from "../../../data/ai/runner-plan-profiles-1.4.1.json";
import { DEMO_CARDS_BY_ID, type AiDeckDoctrineProfile, type AiDecision, type AiDecisionInput, type AiDifficulty, type LegalAction, type PublicGameEvent, type Side, type VisibleCard } from "@netgrid/shared";
import { CARD_ROLES_BY_CARD, RUNTIME_CARDS, createAiHintsByCard } from "./ai-hints";
import { beliefDebugSummary, reconstructBeliefState, type BeliefState, type KnownHqHandMemory, type RndTopFreshnessMemory } from "./belief-state";
import { assessKnownRezzedIcePath, serverIdFromEvent } from "./visible-run-analysis";

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
};

export type RunnerPlanDebug = {
  aiLevel: 2;
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
  weights: Record<"runnerRig" | "runCost" | "serverAccessValue" | "remoteThreat" | "corpScoringThreat", number>;
};

type RunnerFeatures = {
  credits: number;
  clicks: number;
  tags: number;
  memoryRemaining: number;
  handCount: number;
  rigRoles: Set<string>;
  handRoles: Set<string>;
  serverFeatures: Map<string, { iceCount: number; rootCount: number; knownRootCount: number; rezzedIceCount: number; advancedRootCount: number }>;
  blockedRunServers: Set<string>;
  visibleRunBreakCosts: Map<string, number>;
};
type RunnerServerFeatures = RunnerFeatures["serverFeatures"] extends Map<string, infer Server> ? Server : never;

const AI_HINTS = createAiHintsByCard();
const RUNNER_PLAN_PROFILES = runnerPlanProfilesData.profiles as RunnerPlanProfile[];
const PLAN_ACTION_TYPES = new Set<LegalAction["type"]>(["start_run", "jack_out", "continue_run", "install_card", "play_event", "gain_credit", "draw_card", "trash_accessed_card"]);

export function hasRunnerPlanAction(input: AiDecisionInput): boolean {
  return input.side === "runner" && input.legalActions.some((action) => PLAN_ACTION_TYPES.has(action.type));
}

export function chooseRunnerPlanAction(input: AiDecisionInput, fallbackDecision: AiDecision, options: { timeBudgetMs?: number } = {}): AiDecision {
  const planDecision = chooseRunnerPlanDecision(input, options);
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
    reasonCode: `runner.plan.${planDecision.debug.planKind}`,
    explanation: explanationForPlan(planDecision.debug.planKind),
    consideredActionIds: input.legalActions.map((candidate) => candidate.actionId).sort(),
    fallbackUsed: false,
    confidence: planDecision.score.confidence,
    evidence: scrubPlanEvidence(planDecision.score.evidence),
    decisionDebug: planDecision.debug,
    timeoutUsed: planDecision.debug.timeoutUsed,
    profileId: input.profileId,
    difficulty: input.difficulty,
    reason: `runner.plan.${planDecision.debug.planKind}`
  };
}

export function chooseRunnerPlanDecision(input: AiDecisionInput, options: { timeBudgetMs?: number } = {}): RunnerPlanDecision {
  const profile = runnerPlanProfile(input);
  const beliefState = reconstructBeliefState(input);
  const timeBudgetMs = options.timeBudgetMs ?? profile.timeBudgetMs;
  if (timeBudgetMs <= 0) return fallbackPlanDecision(input, "time_budget_exhausted", timeBudgetMs, true, beliefState);
  const candidates = generateRunnerPlanCandidates(input).slice(0, profile.planBreadth);
  if (candidates.length === 0) return fallbackPlanDecision(input, "no_plan_candidate", timeBudgetMs, false, beliefState);
  const scored = candidates
    .map((candidate) => ({ candidate, score: evaluateRunnerPlan(input, candidate, beliefState) }))
    .sort((left, right) => right.score.score - left.score.score || left.candidate.planId.localeCompare(right.candidate.planId));
  const selected = scored[0];
  if (!selected) return fallbackPlanDecision(input, "no_scored_plan", timeBudgetMs, false, beliefState);
  const action = selectPlanAction(input, selected.candidate);
  if (!action) return fallbackPlanDecision(input, "plan_without_legal_action", timeBudgetMs, false, beliefState);
  const beliefSummary = beliefDebugSummary(beliefState);
  const opponentModel = toRecord(beliefSummary.runnerOpponentModel);
  const doctrinePlanWeight = doctrinePlanWeightFor(input, selected.candidate.kind);
  return {
    selectedPlanId: selected.candidate.planId,
    selectedActionId: action.actionId,
    selectedActionType: action.type,
    fallbackUsed: false,
    score: selected.score,
    debug: {
      aiLevel: 2,
      planId: selected.candidate.planId,
      planKind: selected.candidate.kind,
      selectedActionType: action.type,
      score: selected.score.score,
      confidence: selected.score.confidence,
      visibleReasons: selected.score.reasons,
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
      ...(input.ownDeckDoctrine ? { ownDeckDoctrine: deckDoctrineDebug(input.ownDeckDoctrine), doctrinePlanWeight } : {})
    }
  };
}

export function generateRunnerPlanCandidates(input: AiDecisionInput): RunnerPlanCandidate[] {
  if (input.side !== "runner") return [];
  const features = extractRunnerFeatures(input);
  const actions = input.legalActions.slice().sort(compareAction);
  return [
    buildCandidate(input, "pressure_rnd", actions.filter((action) => action.type === "start_run" && action.payload?.serverId === "rd")),
    buildCandidate(input, "pressure_hq", actions.filter((action) => action.type === "start_run" && action.payload?.serverId === "hq")),
    buildCandidate(
      input,
      "contest_remote",
      actions.filter((action) => action.type === "start_run" && typeof action.payload?.serverId === "string" && action.payload.serverId.startsWith("remote_") && (features.serverFeatures.get(action.payload.serverId)?.rootCount ?? 0) > 0)
    ),
    buildCandidate(
      input,
      "build_rig",
      actions.filter((action) => action.type === "install_card" && rolesForAction(input, action).some((role) => role.startsWith("breaker_") || role === "memory" || role === "setup" || role === "build_rig"))
    ),
    buildCandidate(
      input,
      "recover_economy",
      actions.filter((action) => action.type === "gain_credit" || (action.type === "play_event" && rolesForAction(input, action).some((role) => role === "economy" || role === "tempo")))
    ),
    buildCandidate(
      input,
      "draw_for_answers",
      actions.filter((action) => action.type === "draw_card" || (action.type === "play_event" && rolesForAction(input, action).some((role) => role === "draw" || role === "setup")))
    ),
    buildCandidate(input, "trash_asset", actions.filter((action) => action.type === "trash_accessed_card")),
    buildCandidate(
      input,
      "safe_probe_run",
      actions.filter(
        (action) =>
          action.type === "jack_out" ||
          action.type === "continue_run" ||
          (action.type === "start_run" && (action.payload?.serverId === "archives" || isLowInformationRunTarget(features, String(action.payload?.serverId ?? ""))))
      )
    )
  ].filter((candidate): candidate is RunnerPlanCandidate => candidate !== null);
}

export function evaluateRunnerPlan(input: AiDecisionInput, candidate: RunnerPlanCandidate, beliefState: BeliefState = reconstructBeliefState(input)): RunnerPlanScore {
  const profile = runnerPlanProfile(input);
  const rig = evaluateRunnerRig(input, candidate);
  const runCost = estimateRunCost(input, candidate);
  const access = evaluateServerAccessValue(input, candidate, beliefState);
  const remote = evaluateRemoteThreat(input, candidate, beliefState);
  const corpThreat = evaluateCorpScoringThreat(input, candidate, beliefState);
  const earlyTurn = evaluateRunnerEarlyTurnDoctrine(input, candidate);
  const doctrinePlanWeight = doctrinePlanWeightFor(input, candidate.kind);
  const easyRunPenalty = input.difficulty === "easy" && isRunPlan(candidate.kind) ? 260 : 0;
  const score =
    baseScoreForPlan(candidate.kind) +
    doctrinePlanWeight +
    earlyTurn.score +
    rig.score * profile.weights.runnerRig +
    runCost.score * profile.weights.runCost +
    access.score * profile.weights.serverAccessValue +
    remote.score * profile.weights.remoteThreat +
    corpThreat.score * profile.weights.corpScoringThreat -
    visibleRiskPenalty(candidate, profile.riskTolerance) -
    easyRunPenalty;
  return {
    planId: candidate.planId,
    score: roundScore(score),
    confidence: confidence(score, candidate.legalActionIds.length),
    reasons: sortedUnique([...earlyTurn.reasons, ...rig.reasons, ...runCost.reasons, ...access.reasons, ...remote.reasons, ...corpThreat.reasons]).slice(0, 6),
    evidence: scrubPlanEvidence([
      `plan:${candidate.kind}`,
      `difficulty:${input.difficulty}`,
      `doctrine_plan_weight:${doctrinePlanWeight}`,
      ...(input.ownDeckDoctrine ? [`doctrine:${input.ownDeckDoctrine.archetypeTags.slice(0, 3).join(",") || "neutral"}`] : ["doctrine:neutral"]),
      ...candidate.visibleBenefits,
      ...rig.evidence,
      ...runCost.evidence,
      ...access.evidence,
      ...remote.evidence,
      ...corpThreat.evidence,
      ...earlyTurn.evidence,
      `belief_version:${beliefState.version}`,
      ...(beliefState.runnerOpponentModel ? [`belief_credit_reserve:${beliefState.runnerOpponentModel.corpCreditReserveInterpretation}`] : [])
    ])
  };
}

export function evaluateRunnerEarlyTurnDoctrine(input: AiDecisionInput, candidate: RunnerPlanCandidate): RunnerPlanEvaluatorResult {
  const doctrine = input.ownDeckDoctrine;
  if (!doctrine || doctrine.side !== "runner") {
    return { score: 0, reasons: [], evidence: ["early_turn_doctrine:none"] };
  }
  const earlyTurn = isEarlyRunnerTurn(input);
  const features = extractRunnerFeatures(input);
  const rigBreakerCount = [...features.rigRoles].filter((role) => role.startsWith("breaker_")).length;
  const handBreakerCount = [...features.handRoles].filter((role) => role.startsWith("breaker_")).length;
  const handEconomyCount = [...features.handRoles].filter((role) => role === "economy" || role === "tempo" || role === "draw").length;
  const target = targetServerId(input, candidate);
  const visibleIce = target ? (features.serverFeatures.get(target)?.iceCount ?? 0) : 0;
  const tags = doctrine.archetypeTags.slice(0, 3);
  const tagSet = new Set(tags);
  let score = 0;
  const reasons: string[] = [];

  if (earlyTurn && tagSet.has("rig_builder")) {
    if (candidate.kind === "build_rig" && rigBreakerCount === 0 && handBreakerCount > 0) {
      score += 70;
      reasons.push("early_rig_builder_setup");
    }
    if (candidate.kind === "recover_economy" && features.credits < 4) {
      score += 45;
      reasons.push("early_rig_builder_credit_floor");
    }
    if ((candidate.kind === "pressure_rnd" || candidate.kind === "pressure_hq") && rigBreakerCount === 0 && (visibleIce > 0 || features.credits < 4)) {
      score -= 50;
      reasons.push("early_rig_builder_pressure_not_ready");
    }
  }

  if (earlyTurn && tagSet.has("economy_dense")) {
    if (candidate.kind === "recover_economy" && (features.credits < 5 || handEconomyCount > 0)) {
      score += 55;
      reasons.push("early_economy_dense_reserve");
    }
    if (candidate.kind === "draw_for_answers" && handBreakerCount === 0) {
      score += 25;
      reasons.push("early_economy_dense_find_setup");
    }
    if (isRunPlan(candidate.kind) && rigBreakerCount === 0 && features.credits < 4) {
      score -= 35;
      reasons.push("early_economy_dense_run_paced");
    }
  }

  if (earlyTurn && tagSet.has("rnd_pressure") && candidate.kind === "pressure_rnd") {
    const pressureReady = features.credits >= 3 && (rigBreakerCount > 0 || visibleIce === 0);
    score += pressureReady ? 40 : -50;
    reasons.push(pressureReady ? "early_rnd_pressure_ready" : "early_rnd_pressure_not_ready");
  }
  if (earlyTurn && tagSet.has("hq_pressure") && candidate.kind === "pressure_hq") {
    const pressureReady = features.credits >= 3 && (rigBreakerCount > 0 || visibleIce === 0);
    score += pressureReady ? 40 : -50;
    reasons.push(pressureReady ? "early_hq_pressure_ready" : "early_hq_pressure_not_ready");
  }
  if (earlyTurn && tagSet.has("remote_contest") && candidate.kind === "contest_remote") {
    const server = target ? features.serverFeatures.get(target) : undefined;
    const pressureReady = features.credits >= 3 && ((server?.advancedRootCount ?? 0) > 0 || rigBreakerCount > 0 || visibleIce === 0);
    score += pressureReady ? 35 : -45;
    reasons.push(pressureReady ? "early_remote_contest_ready" : "early_remote_contest_not_ready");
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
      `early_visible_ice:${visibleIce}`
    ]
  };
}

export function evaluateRunnerRig(input: AiDecisionInput, candidate: RunnerPlanCandidate): RunnerPlanEvaluatorResult {
  const features = extractRunnerFeatures(input);
  const breakerCount = [...features.rigRoles].filter((role) => role.startsWith("breaker_")).length;
  const handBreakerRoles = [...features.handRoles].filter((role) => role.startsWith("breaker_"));
  const reservePenalty = candidate.kind === "build_rig" ? lowReserveInstallPenalty(input, candidate, features.credits) : 0;
  const centralPressurePenalty = centralPressureWithoutRigPenalty(input, candidate, features, breakerCount);
  const score =
    candidate.kind === "build_rig"
      ? 150 + Math.max(0, 3 - breakerCount) * 45 + (features.memoryRemaining <= 1 ? 35 : 0) - reservePenalty
      : isRunPlan(candidate.kind)
        ? breakerCount * 30 - Math.max(0, 2 - features.credits) * 30 - centralPressurePenalty
        : handBreakerRoles.length * 8;
  return {
    score,
    reasons: sortedUnique([
      breakerCount > 0 ? "visible_rig_has_breaker_roles" : "visible_rig_incomplete",
      ...(reservePenalty > 0 ? ["credit_reserve_after_install_low"] : []),
      ...(centralPressurePenalty > 0 ? ["central_pressure_underprepared"] : [])
    ]),
    evidence: [
      `rig_breakers:${breakerCount}`,
      `hand_breaker_roles:${handBreakerRoles.length}`,
      `memory_remaining:${features.memoryRemaining}`,
      `credits:${features.credits}`,
      `central_pressure_penalty:${centralPressurePenalty}`
    ]
  };
}

function centralPressureWithoutRigPenalty(input: AiDecisionInput, candidate: RunnerPlanCandidate, features: RunnerFeatures, breakerCount: number): number {
  if (candidate.kind !== "pressure_rnd" && candidate.kind !== "pressure_hq") return 0;
  if (input.playerView.opponent.agendaPoints >= input.playerView.agendaPointsToWin - 2) return 0;
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

export function estimateRunCost(input: AiDecisionInput, candidate: RunnerPlanCandidate): RunnerPlanEvaluatorResult {
  const features = extractRunnerFeatures(input);
  const target = targetServerId(input, candidate);
  const server = target ? features.serverFeatures.get(target) : undefined;
  const blocked = target ? features.blockedRunServers.has(target) : false;
  const visibleBreakCost = target ? features.visibleRunBreakCosts.get(target) : undefined;
  const rezzedIce = server?.rezzedIceCount ?? 0;
  const breakCostPressure = visibleBreakCost === undefined ? 0 : visibleBreakCost * 18 + Math.max(0, visibleBreakCost - features.credits) * 55;
  const score = candidate.kind === "recover_economy" ? (features.credits < 4 ? 120 : 40) : blocked ? -520 : Math.max(-180, 90 - rezzedIce * 55 - Math.max(0, 3 - features.credits) * 35 - breakCostPressure);
  return {
    score,
    reasons: blocked ? ["run_blocked_by_visible_rezzed_ice", "visible_ice_unaffordable_to_break"] : ["run_cost_from_visible_ice"],
    evidence: [
      `target:${target ?? "none"}`,
      `rezzed_ice:${rezzedIce}`,
      `blocked:${blocked}`,
      `credit_reserve:${features.credits}`,
      `visible_etr_break_cost:${visibleBreakCost ?? "unavailable"}`
    ]
  };
}

export function evaluateServerAccessValue(input: AiDecisionInput, candidate: RunnerPlanCandidate, beliefState: BeliefState = reconstructBeliefState(input)): RunnerPlanEvaluatorResult {
  const features = extractRunnerFeatures(input);
  const target = targetServerId(input, candidate);
  const server = target ? features.serverFeatures.get(target) : undefined;
  const history = publicServerMentions(input, target);
  const freshness = beliefState.runnerOpponentModel?.rndTopFreshness;
  const hqHandMemory = beliefState.runnerOpponentModel?.hqHandMemory;
  const blocked = target && isRunPlan(candidate.kind) ? features.blockedRunServers.has(target) : false;
  const staleArchivesPenalty = staleArchivesRepeatPenalty(input, target, server);
  const evidence = [
    `target:${target ?? "none"}`,
    `ice_count:${server?.iceCount ?? 0}`,
    `root_count:${server?.rootCount ?? 0}`,
    `known_root_count:${server?.knownRootCount ?? 0}`,
    `server_history:${history}`,
    `rnd_freshness:${freshness?.freshness ?? "unknown"}`,
    `hq_hand_known:${hqHandMemory?.allCardsKnown === true ? "all" : hqHandMemory && hqHandMemory.knownCount > 0 ? "partial" : "unknown"}`,
    `hq_known_count:${hqHandMemory?.knownCount ?? 0}`,
    `hq_hand_count:${hqHandMemory?.handCount ?? input.playerView.opponent.handCount}`
  ];
  if (blocked) {
    return {
      score: -160,
      reasons: ["visible_run_path_blocked"],
      evidence
    };
  }
  const staleRndPenalty = staleKnownRndPlanPenalty(candidate, target, freshness);
  const lowValueKnownHq = isKnownLowValueHqHand(input, target, hqHandMemory);
  const staleHqPenalty =
    target === "hq" && (candidate.kind === "pressure_hq" || candidate.kind === "safe_probe_run") && lowValueKnownHq ? (candidate.kind === "pressure_hq" ? 430 : 230) : 0;
  const recentCentralPenalty = recentCentralPressurePenalty(input, candidate, target);
  evidence.push(`recent_central_penalty:${recentCentralPenalty}`);
  const score =
    candidate.kind === "pressure_rnd"
      ? 135 + history * 10 - staleRndPenalty - recentCentralPenalty
    : candidate.kind === "pressure_hq"
        ? 110 + Math.max(0, 5 - input.playerView.opponent.handCount) * 4 + history * 8 - staleHqPenalty - recentCentralPenalty
      : candidate.kind === "contest_remote"
          ? 90 + (server?.rootCount ?? 0) * 55 + (server?.advancedRootCount ?? 0) * 35
      : candidate.kind === "trash_asset"
        ? 150
      : candidate.kind === "safe_probe_run"
        ? 55 - staleRndPenalty * 0.4 - staleHqPenalty * 0.4 - staleArchivesPenalty
        : 0;
  const reasons = [
    "server_value_from_visible_projection",
    ...(staleRndPenalty > 0 ? ["known_rnd_top_not_fresh"] : []),
    ...(staleHqPenalty > 0 ? ["known_hq_hand_low_value"] : []),
    ...(recentCentralPenalty > 0 ? ["recent_central_pressure_repeated"] : []),
    ...(staleArchivesPenalty > 0 ? ["known_archives_access_not_fresh"] : [])
  ];
  return {
    score,
    reasons,
    evidence
  };
}

function staleKnownRndPlanPenalty(candidate: RunnerPlanCandidate, target: string | undefined, freshness: RndTopFreshnessMemory | undefined): number {
  if (target !== "rd" || (candidate.kind !== "pressure_rnd" && candidate.kind !== "safe_probe_run") || freshness?.freshness !== "stale_known_same_top") return 0;
  // This is a preference penalty, not a legality gate: the Runner has side-safe public evidence that the same R&D top card is still known,
  // so ordinary economy/draw plans should beat another identical access unless another evaluator contributes a concrete advantage.
  return candidate.kind === "pressure_rnd" ? 540 : 260;
}

function recentCentralPressurePenalty(input: AiDecisionInput, candidate: RunnerPlanCandidate, target: string | undefined): number {
  if ((candidate.kind !== "pressure_hq" && candidate.kind !== "pressure_rnd") || (target !== "hq" && target !== "rd")) return 0;
  const history = mergedPublicHistory(input);
  const lastSameCentralRun = findLastIndex(
    history,
    (event) => serverIdFromEvent(event) === target && (event.publicPayload.actionType === "start_run" || event.type === "run_started")
  );
  if (lastSameCentralRun < 0) return 0;
  const last = history[lastSameCentralRun];
  if (!last) return 0;
  const currentVersion = input.playerView.stateVersion;
  const distance = currentVersion - eventVersion(last);
  if (distance > 8) return 0;
  return target === "hq" ? 170 : 140;
}

function staleArchivesRepeatPenalty(input: AiDecisionInput, target: string | undefined, server: RunnerServerFeatures | undefined): number {
  if (target !== "archives" || !server) return 0;
  const history = mergedPublicHistory(input);
  const lastArchivesAccessIndex = findLastIndex(history, (event) => isArchivesAccessEvent(event));
  if (lastArchivesAccessIndex < 0) return 0;
  if (history.slice(lastArchivesAccessIndex + 1).some((event) => eventMayChangeArchives(event))) return 0;
  const lastArchivesAccess = history[lastArchivesAccessIndex];
  if (!lastArchivesAccess) return 0;
  const accessedDefinitionId = stringPayloadValue(lastArchivesAccess, "cardDefinitionId");
  const visibleArchivesCards =
    input.playerView.servers.find((candidate) => candidate.id === "archives")?.root ?? [];
  const visibleArchivesDefinitions = new Set(visibleArchivesCards.map((card) => card.definitionId).filter((definitionId): definitionId is string => Boolean(definitionId)));
  if (accessedDefinitionId && !visibleArchivesDefinitions.has(accessedDefinitionId)) return 0;
  if (visibleArchivesCards.length > 0 && visibleArchivesCards.every((card) => card.known && card.definitionId)) {
    return visibleArchivesCards.every((card) => isLowValueKnownHqAccessCard(card.definitionId!, input.playerView.own.credits)) ? 520 : 420;
  }
  if (!accessedDefinitionId) return 0;
  return isLowValueKnownHqAccessCard(accessedDefinitionId, input.playerView.own.credits) ? 360 : 240;
}

function mergedPublicHistory(input: AiDecisionInput): PublicGameEvent[] {
  const byId = new Map<string, PublicGameEvent>();
  for (const event of [...input.playerView.publicEvents, ...input.eventTail]) {
    byId.set(event.eventId, event);
  }
  return [...byId.values()].sort((left, right) => eventVersion(left) - eventVersion(right));
}

function findLastIndex<T>(values: T[], predicate: (value: T) => boolean): number {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (predicate(values[index]!)) return index;
  }
  return -1;
}

function isArchivesAccessEvent(event: PublicGameEvent): boolean {
  return event.publicPayload.actionType === "access_card" && serverIdFromEvent(event) === "archives";
}

function eventMayChangeArchives(event: PublicGameEvent): boolean {
  const payload = event.publicPayload;
  if (payload.discardZone === "archives" || payload.hiddenZoneAction === "discard_phase") return true;
  const actionType = typeof payload.actionType === "string" ? payload.actionType : event.type;
  return actionType === "trash_accessed_card" || actionType === "trash_card" || actionType === "play_operation";
}

function stringPayloadValue(event: PublicGameEvent, key: string): string | undefined {
  const value = event.publicPayload[key];
  return typeof value === "string" ? value : undefined;
}

function eventVersion(event: PublicGameEvent): number {
  return typeof event.stateVersionAfter === "number" ? event.stateVersionAfter : 0;
}

function isKnownLowValueHqHand(input: AiDecisionInput, target: string | undefined, hqHandMemory: KnownHqHandMemory | undefined): boolean {
  if (target !== "hq" || !hqHandMemory?.allCardsKnown || hqHandMemory.knownDefinitions.length === 0) return false;
  return hqHandMemory.knownDefinitions.every((definitionId) => isLowValueKnownHqAccessCard(definitionId, input.playerView.own.credits));
}

function isLowValueKnownHqAccessCard(definitionId: string, runnerCredits: number): boolean {
  const runtimeDefinition = RUNTIME_CARDS[definitionId];
  const demoDefinition = DEMO_CARDS_BY_ID[definitionId];
  const type = runtimeDefinition?.type ?? demoDefinition?.type;
  if (!type) return false;
  if (type === "agenda") return false;
  const trashCost = runtimeDefinition?.numeric.trashCost ?? demoDefinition?.trashCost ?? 0;
  if ((type === "asset" || type === "upgrade") && runnerCredits >= trashCost) return false;
  return true;
}

export function evaluateRemoteThreat(input: AiDecisionInput, candidate: RunnerPlanCandidate, beliefState: BeliefState = reconstructBeliefState(input)): RunnerPlanEvaluatorResult {
  const features = extractRunnerFeatures(input);
  const target = targetServerId(input, candidate);
  const server = target ? features.serverFeatures.get(target) : undefined;
  const blocked = target ? features.blockedRunServers.has(target) : false;
  const remoteThreat = target?.startsWith("remote_") ? (server?.rootCount ?? 0) * 40 + (server?.advancedRootCount ?? 0) * 55 : 0;
  const lowReserveRemotePenalty = lowReserveRemoteContestPenalty(input, candidate, target, server);
  const recentRemotePenalty = recentRemoteContestPenalty(input, candidate, target);
  const remoteBeliefBoost =
    target?.startsWith("remote_")
      ? Math.round(
          (beliefState.runnerOpponentModel?.remoteCardBelief
            .filter((belief) => belief.serverId === target)
            .reduce((sum, belief) => sum + belief.confidence * 25, 0) ?? 0)
        )
      : 0;
  if (candidate.kind === "contest_remote" && blocked) {
    return {
      score: -90,
      reasons: ["remote_threat_unreachable_by_visible_ice"],
      evidence: [
        `remote_target:${target?.startsWith("remote_") ? target : "none"}`,
        `advanced_roots:${server?.advancedRootCount ?? 0}`,
        `remote_belief_boost:${remoteBeliefBoost}`,
        `low_reserve_remote_penalty:${lowReserveRemotePenalty}`,
        `recent_remote_penalty:${recentRemotePenalty}`
      ]
    };
  }
  return {
    score: candidate.kind === "contest_remote" ? remoteThreat + 80 + remoteBeliefBoost - lowReserveRemotePenalty - recentRemotePenalty : candidate.kind === "safe_probe_run" ? Math.min(30, remoteThreat) : 0,
    reasons: sortedUnique([
      remoteThreat > 0 ? "remote_threat_visible" : "remote_threat_uncertain",
      ...(lowReserveRemotePenalty > 0 ? ["remote_contest_credit_reserve_low"] : []),
      ...(recentRemotePenalty > 0 ? ["recent_remote_contest_repeated"] : [])
    ]),
    evidence: [
      `remote_target:${target?.startsWith("remote_") ? target : "none"}`,
      `advanced_roots:${server?.advancedRootCount ?? 0}`,
      `remote_belief_boost:${remoteBeliefBoost}`,
      `low_reserve_remote_penalty:${lowReserveRemotePenalty}`,
      `recent_remote_penalty:${recentRemotePenalty}`
    ]
  };
}

function lowReserveRemoteContestPenalty(input: AiDecisionInput, candidate: RunnerPlanCandidate, target: string | undefined, server: RunnerServerFeatures | undefined): number {
  if (candidate.kind !== "contest_remote" || !target?.startsWith("remote_")) return 0;
  if (input.playerView.own.credits > 1) return 0;
  if ((server?.advancedRootCount ?? 0) > 0) return 0;
  if (input.playerView.opponent.agendaPoints >= input.playerView.agendaPointsToWin - 2) return 0;
  return 260;
}

function recentRemoteContestPenalty(input: AiDecisionInput, candidate: RunnerPlanCandidate, target: string | undefined): number {
  if (candidate.kind !== "contest_remote" || !target?.startsWith("remote_")) return 0;
  const history = mergedPublicHistory(input);
  const lastSameRemoteRun = findLastIndex(
    history,
    (event) => serverIdFromEvent(event) === target && (event.publicPayload.actionType === "start_run" || event.type === "run_started")
  );
  if (lastSameRemoteRun < 0) return 0;
  const last = history[lastSameRemoteRun];
  if (!last) return 0;
  const distance = input.playerView.stateVersion - eventVersion(last);
  return distance <= 8 ? 180 : 0;
}

export function evaluateCorpScoringThreat(input: AiDecisionInput, candidate: RunnerPlanCandidate, beliefState: BeliefState = reconstructBeliefState(input)): RunnerPlanEvaluatorResult {
  const corpAgenda = input.playerView.opponent.agendaPoints;
  const toWin = input.playerView.agendaPointsToWin;
  const pressureNeeded = toWin - corpAgenda <= 3;
  const scoringTrend = beliefState.runnerOpponentModel?.corpPlanEstimate.scoring ?? 0;
  const score = candidate.kind === "contest_remote" && pressureNeeded ? 80 + scoringTrend * 35 : isRunPlan(candidate.kind) && pressureNeeded ? 35 + scoringTrend * 20 : 0;
  return {
    score,
    reasons: pressureNeeded ? ["corp_near_scoring_threshold"] : ["corp_scoring_threshold_not_immediate"],
    evidence: [`corp_agenda:${corpAgenda}`, `agenda_to_win:${toWin}`, `corp_credits:${input.playerView.opponent.credits}`, `corp_scoring_trend:${round(scoringTrend)}`]
  };
}

export function runnerPlanUsesOnlyAiSupportedCards(input: AiDecisionInput, candidate: RunnerPlanCandidate): boolean {
  return candidate.legalActionIds.every((actionId) => {
    const action = input.legalActions.find((legalAction) => legalAction.actionId === actionId);
    if (!action || action.source === "basic_action" || action.source === "game_rule") return true;
    const card = findVisibleCard(input, action.source);
    return card ? isAiSupportedCard(card.definitionId) : true;
  });
}

function buildCandidate(input: AiDecisionInput, kind: RunnerPlanKind, actions: LegalAction[]): RunnerPlanCandidate | null {
  const legalActions = actions.filter((action) => action.side === "runner" && PLAN_ACTION_TYPES.has(action.type));
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
    visibleBenefits: visibleBenefitsForPlan(kind),
    visibleRisks: visibleRisksForPlan(kind, requiredRoles),
    uncertainty: uncertaintyForPlan(kind),
    requiredRoles
  };
}

function selectPlanAction(input: AiDecisionInput, candidate: RunnerPlanCandidate): LegalAction | undefined {
  return candidate.legalActionIds
    .map((actionId) => input.legalActions.find((action) => action.actionId === actionId))
    .filter((action): action is LegalAction => Boolean(action))
    .sort((left, right) => actionPriority(candidate.kind, right, input) - actionPriority(candidate.kind, left, input) || compareAction(left, right))[0];
}

function actionPriority(kind: RunnerPlanKind, action: LegalAction, input: AiDecisionInput): number {
  if (kind === "trash_asset" && action.type === "trash_accessed_card") return 100;
  if ((kind === "pressure_rnd" || kind === "pressure_hq" || kind === "contest_remote" || kind === "safe_probe_run") && action.type === "start_run") return 90;
  if (kind === "safe_probe_run" && action.type === "jack_out") return 88;
  if (kind === "safe_probe_run" && action.type === "continue_run") return 70;
  if (kind === "build_rig" && action.type === "install_card") return runnerInstallPriority(input, action);
  if (kind === "recover_economy" && action.type === "play_event") return 80;
  if (kind === "recover_economy" && action.type === "gain_credit") return 65;
  if (kind === "draw_for_answers" && action.type === "play_event") return 70;
  if (kind === "draw_for_answers" && action.type === "draw_card") return 60;
  return 10;
}

function extractRunnerFeatures(input: AiDecisionInput): RunnerFeatures {
  const rigCards = input.playerView.own.rig ?? [];
  const rigRoles = new Set(rigCards.flatMap((card) => rolesForCardId(card.definitionId)));
  const handRoles = new Set(input.playerView.own.gripOrHq.flatMap((card) => rolesForCardId(card.definitionId)));
  const serverFeatures = new Map(
    input.playerView.servers.map((server) => [
      server.id,
      {
        iceCount: server.ice.length,
        rootCount: server.root.length,
        knownRootCount: server.root.filter((card) => card.known).length,
        rezzedIceCount: server.ice.filter((card) => card.rezzed === true).length,
        advancedRootCount: server.root.filter((card) => (card.advancementCounters ?? 0) > 0).length
      }
    ])
  );
  const blockedRunServers = new Set<string>();
  const visibleRunBreakCosts = new Map<string, number>();
  for (const server of input.playerView.servers) {
    const assessment = assessKnownRezzedIcePath(server.ice, rigCards, input.playerView.own.credits);
    if (assessment.visibleBreakCost !== undefined) visibleRunBreakCosts.set(server.id, assessment.visibleBreakCost);
    if (assessment.blocked) blockedRunServers.add(server.id);
  }
  return {
    credits: input.playerView.own.credits,
    clicks: input.playerView.own.clicks,
    tags: input.playerView.own.tags,
    memoryRemaining: (input.playerView.own.memoryLimit ?? 0) - (input.playerView.own.memoryUsed ?? 0),
    handCount: input.playerView.own.gripOrHq.length,
    rigRoles,
    handRoles,
    serverFeatures,
    blockedRunServers,
    visibleRunBreakCosts
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

function lowReserveInstallPenalty(input: AiDecisionInput, candidate: RunnerPlanCandidate, credits: number): number {
  const installActions = candidate.legalActionIds
    .map((actionId) => input.legalActions.find((action) => action.actionId === actionId))
    .filter((action): action is LegalAction => action?.type === "install_card");
  if (installActions.length === 0) return 0;
  const bestRemainingCredits = Math.max(...installActions.map((action) => credits - actionCreditCost(action)));
  return bestRemainingCredits < 2 ? 460 : 0;
}

function runnerInstallPriority(input: AiDecisionInput, action: LegalAction): number {
  const features = extractRunnerFeatures(input);
  const roles = rolesForAction(input, action);
  const remainingCredits = features.credits - actionCreditCost(action);
  let priority = 85;
  if (roles.some((role) => role.startsWith("breaker_") && !features.rigRoles.has(role))) priority += 45;
  if (roles.includes("memory") || roles.includes("memory_support")) priority += features.memoryRemaining <= 1 ? 70 : 20;
  if (roles.includes("efficient_breaker")) priority += 12;
  if (roles.includes("flex_breaker")) priority += 10;
  if (remainingCredits >= 2) priority += 15;
  if (remainingCredits < 2) priority -= 55;
  if (roles.some((role) => role.startsWith("breaker_") && features.rigRoles.has(role))) priority -= 18;
  return priority;
}

function actionCreditCost(action: LegalAction): number {
  return action.costs.reduce((sum, cost) => sum + (Number.isFinite(cost.credits) ? cost.credits ?? 0 : 0), 0);
}

function isAiSupportedCard(cardId: string | undefined): boolean {
  return Boolean(cardId && RUNTIME_CARDS[cardId]?.statuses.ai_supported === true);
}

function runnerPlanProfile(input: AiDecisionInput): RunnerPlanProfile {
  return (
    RUNNER_PLAN_PROFILES.find((profile) => profile.profileId === input.profileId || profile.legacyProfileIds.includes(input.profileId)) ??
    RUNNER_PLAN_PROFILES.find((profile) => profile.difficulty === input.difficulty) ??
    RUNNER_PLAN_PROFILES[1]!
  );
}

function targetServerId(input: AiDecisionInput, candidate: RunnerPlanCandidate): string | undefined {
  for (const actionId of candidate.legalActionIds) {
    const action = input.legalActions.find((legalAction) => legalAction.actionId === actionId);
    if (typeof action?.payload?.serverId === "string") return action.payload.serverId;
  }
  return undefined;
}

function publicServerMentions(input: AiDecisionInput, serverId: string | undefined): number {
  if (!serverId) return 0;
  return input.eventTail.filter((event) => serverIdFromEvent(event) === serverId).length;
}

function isLowInformationRunTarget(features: RunnerFeatures, serverId: string): boolean {
  const server = features.serverFeatures.get(serverId);
  if (!server) return false;
  return server.iceCount <= 1 && server.rootCount === 0;
}

function fallbackPlanDecision(input: AiDecisionInput, reason: string, timeBudgetMs: number, timeoutUsed: boolean, beliefState: BeliefState): RunnerPlanDecision {
  const fallbackAction = input.legalActions.slice().sort(compareAction)[0];
  return {
    selectedPlanId: "fallback",
    selectedActionId: fallbackAction?.actionId ?? "",
    selectedActionType: fallbackAction?.type ?? "none",
    fallbackUsed: true,
    score: { planId: "fallback", score: 0, confidence: 0.2, reasons: [reason], evidence: [reason] },
    debug: fallbackDebug(input, undefined, reason, timeBudgetMs, timeoutUsed, beliefState)
  };
}

function fallbackDebug(
  input: AiDecisionInput,
  fallbackDecision: AiDecision | undefined,
  reason: string,
  timeBudgetMs: number | undefined,
  timeoutUsed = false,
  beliefState: BeliefState = reconstructBeliefState(input)
): RunnerPlanDebug {
  const fallbackAction = fallbackDecision ? input.legalActions.find((action) => action.actionId === fallbackDecision.actionId) : input.legalActions.slice().sort(compareAction)[0];
  const beliefSummary = beliefDebugSummary(beliefState);
  const opponentModel = toRecord(beliefSummary.runnerOpponentModel);
  return {
    aiLevel: 2,
    planId: "fallback",
    planKind: "fallback",
    selectedActionType: fallbackAction?.type ?? "none",
    score: 0,
    confidence: fallbackDecision?.confidence ?? 0.2,
    visibleReasons: [reason],
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
    ...(input.ownDeckDoctrine ? { ownDeckDoctrine: deckDoctrineDebug(input.ownDeckDoctrine), doctrinePlanWeight: 0 } : {})
  };
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

function doctrinePlanWeightFor(input: AiDecisionInput, kind: RunnerPlanKind): number {
  const profile = input.ownDeckDoctrine;
  if (!profile || profile.side !== "runner") return 0;
  const raw = profile.planWeights[kind] ?? 0;
  const confidence = Number.isFinite(profile.confidence) ? profile.confidence : 0.5;
  return Math.round(raw * Math.max(0.25, Math.min(1, confidence)));
}

function deckDoctrineDebug(profile: AiDeckDoctrineProfile): NonNullable<RunnerPlanDebug["ownDeckDoctrine"]> {
  return {
    schemaVersion: profile.schemaVersion,
    side: profile.side,
    confidence: profile.confidence,
    archetypeTags: profile.archetypeTags.slice(0, 3),
    riskFlags: profile.riskFlags.slice(0, 5)
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
  return isRunPlan(kind) ? ["unknown_corp_cards_remain_unknown", "unrezzed_ice_identity_not_assumed"] : ["hidden_corp_information_not_used"];
}

function isRunPlan(kind: RunnerPlanKind): boolean {
  return kind === "pressure_rnd" || kind === "pressure_hq" || kind === "contest_remote" || kind === "safe_probe_run";
}

function isEarlyRunnerTurn(input: AiDecisionInput): boolean {
  if (input.playerView.phase !== "runner_action_phase" || input.playerView.activeSide !== "runner") return false;
  const scoredAgendaCount = input.playerView.own.scoreArea.length + input.playerView.opponent.scoreArea.length;
  return input.actionNumber <= 12 && scoredAgendaCount === 0;
}

function visibleRiskPenalty(candidate: RunnerPlanCandidate, riskTolerance: number): number {
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
  const forbidden = ["cardInstances", "privatePayload", "sessionToken", "reconnectToken", "joinToken", "tokenHash", "fullGameState", "FullState", "corp_simple_"];
  return evidence.filter((entry) => !forbidden.some((needle) => entry.includes(needle))).slice(0, 18);
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
