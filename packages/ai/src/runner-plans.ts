import { createRuntimeCardsById } from "@netgrid/catalog";
import cardRoleManifestData from "../../../data/ai/card-role-manifest-0.9.json";
import aiCardHintsData from "../../../data/ai/ai-card-hints-1.3.1.json";
import kingOfTheRoadAiHintsData from "../../../data/ai/ai-card-hints-king-of-the-road-ai-approval.json";
import deckLegalBatchAAiHintsData from "../../../data/ai/ai-card-hints-deck-legal-batch-a.json";
import deckLegalV161V170AiHintsData from "../../../data/ai/ai-card-hints-deck-legal-v161-v170.json";
import deckLegalV171V181Open64AiHintsData from "../../../data/ai/ai-card-hints-deck-legal-v171-v181-open64.json";
import deckLegalLegacyOpen64AiHintsData from "../../../data/ai/ai-card-hints-deck-legal-legacy-open64.json";
import deckLegalV190AiHintsData from "../../../data/ai/ai-card-hints-deck-legal-v190.json";
import deckLegalV191V194AiHintsData from "../../../data/ai/ai-card-hints-deck-legal-v191-v194.json";
import deckLegalV195V198AiHintsData from "../../../data/ai/ai-card-hints-deck-legal-v195-v198.json";
import deckLegalV199AiHintsData from "../../../data/ai/ai-card-hints-deck-legal-v199.json";
import runtimeSupplementAiHintsData from "../../../data/ai/ai-card-hints-runtime-supplement.json";
import runnerPlanProfilesData from "../../../data/ai/runner-plan-profiles-1.4.1.json";
import { DEMO_CARDS_BY_ID, type AiDecision, type AiDecisionInput, type AiDifficulty, type LegalAction, type PublicGameEvent, type Side, type VisibleCard } from "@netgrid/shared";
import { beliefDebugSummary, reconstructBeliefState, type BeliefState, type KnownHqHandMemory } from "./belief-state";

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

type CardRole = {
  cardId: string;
  side: Side;
  roles: string[];
};

type AiCardHint = {
  cardId: string;
  side: Side;
  roles: string[];
  planRoles: string[];
  aiSupportStatus: "none" | "hinted_only" | "scenario_ready" | "ai_supported";
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

const CARD_ROLES = new Map((cardRoleManifestData.cards as CardRole[]).map((card) => [card.cardId, card]));
const AI_HINTS = new Map(
  [
    ...(aiCardHintsData.cards as AiCardHint[]),
    ...(kingOfTheRoadAiHintsData.cards as AiCardHint[]),
    ...(runtimeSupplementAiHintsData.cards as AiCardHint[]),
    ...(deckLegalBatchAAiHintsData.cards as AiCardHint[]),
    ...(deckLegalV161V170AiHintsData.cards as AiCardHint[]),
    ...(deckLegalV171V181Open64AiHintsData.cards as AiCardHint[]),
    ...(deckLegalLegacyOpen64AiHintsData.cards as AiCardHint[]),
    ...(deckLegalV190AiHintsData.cards as AiCardHint[]),
    ...(deckLegalV191V194AiHintsData.cards as AiCardHint[]),
    ...(deckLegalV195V198AiHintsData.cards as AiCardHint[]),
    ...(deckLegalV199AiHintsData.cards as AiCardHint[])
  ].map((hint) => [hint.cardId, hint])
);
const RUNNER_PLAN_PROFILES = runnerPlanProfilesData.profiles as RunnerPlanProfile[];
const RUNTIME_CARDS = createRuntimeCardsById();
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
      ...(opponentModel ? { opponentModel } : {})
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
  const easyRunPenalty = input.difficulty === "easy" && isRunPlan(candidate.kind) ? 260 : 0;
  const score =
    baseScoreForPlan(candidate.kind) +
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
    reasons: sortedUnique([...rig.reasons, ...runCost.reasons, ...access.reasons, ...remote.reasons, ...corpThreat.reasons]).slice(0, 6),
    evidence: scrubPlanEvidence([
      `plan:${candidate.kind}`,
      `difficulty:${input.difficulty}`,
      ...candidate.visibleBenefits,
      ...rig.evidence,
      ...runCost.evidence,
      ...access.evidence,
      ...remote.evidence,
      ...corpThreat.evidence,
      `belief_version:${beliefState.version}`,
      ...(beliefState.runnerOpponentModel ? [`belief_credit_reserve:${beliefState.runnerOpponentModel.corpCreditReserveInterpretation}`] : [])
    ])
  };
}

export function evaluateRunnerRig(input: AiDecisionInput, candidate: RunnerPlanCandidate): RunnerPlanEvaluatorResult {
  const features = extractRunnerFeatures(input);
  const breakerCount = [...features.rigRoles].filter((role) => role.startsWith("breaker_")).length;
  const handBreakerRoles = [...features.handRoles].filter((role) => role.startsWith("breaker_"));
  const reservePenalty = candidate.kind === "build_rig" ? lowReserveInstallPenalty(input, candidate, features.credits) : 0;
  const score =
    candidate.kind === "build_rig"
      ? 150 + Math.max(0, 3 - breakerCount) * 45 + (features.memoryRemaining <= 1 ? 35 : 0) - reservePenalty
      : isRunPlan(candidate.kind)
        ? breakerCount * 30 - Math.max(0, 2 - features.credits) * 30
        : handBreakerRoles.length * 8;
  return {
    score,
    reasons: sortedUnique([breakerCount > 0 ? "visible_rig_has_breaker_roles" : "visible_rig_incomplete", ...(reservePenalty > 0 ? ["credit_reserve_after_install_low"] : [])]),
    evidence: [`rig_breakers:${breakerCount}`, `hand_breaker_roles:${handBreakerRoles.length}`, `memory_remaining:${features.memoryRemaining}`, `credits:${features.credits}`]
  };
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
  const staleRndPenalty =
    target === "rd" && (candidate.kind === "pressure_rnd" || candidate.kind === "safe_probe_run") && freshness?.freshness === "stale_known_same_top"
      ? candidate.kind === "pressure_rnd"
        ? 420
        : 220
      : 0;
  const lowValueKnownHq = isKnownLowValueHqHand(input, target, hqHandMemory);
  const staleHqPenalty =
    target === "hq" && (candidate.kind === "pressure_hq" || candidate.kind === "safe_probe_run") && lowValueKnownHq ? (candidate.kind === "pressure_hq" ? 430 : 230) : 0;
  const score =
    candidate.kind === "pressure_rnd"
      ? 135 + history * 10 - staleRndPenalty
    : candidate.kind === "pressure_hq"
        ? 110 + Math.max(0, 5 - input.playerView.opponent.handCount) * 4 + history * 8 - staleHqPenalty
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
    ...(staleArchivesPenalty > 0 ? ["known_archives_access_not_fresh"] : [])
  ];
  return {
    score,
    reasons,
    evidence
  };
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
  if (!accessedDefinitionId) return 0;
  const visibleArchivesDefinitions = new Set(
    input.playerView.servers
      .find((candidate) => candidate.id === "archives")
      ?.root.map((card) => card.definitionId)
      .filter((definitionId): definitionId is string => Boolean(definitionId)) ?? []
  );
  if (!visibleArchivesDefinitions.has(accessedDefinitionId)) return 0;
  return isLowValueKnownHqAccessCard(accessedDefinitionId, input.playerView.own.credits) ? 280 : 180;
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
      evidence: [`remote_target:${target?.startsWith("remote_") ? target : "none"}`, `advanced_roots:${server?.advancedRootCount ?? 0}`, `remote_belief_boost:${remoteBeliefBoost}`]
    };
  }
  return {
    score: candidate.kind === "contest_remote" ? remoteThreat + 80 + remoteBeliefBoost : candidate.kind === "safe_probe_run" ? Math.min(30, remoteThreat) : 0,
    reasons: remoteThreat > 0 ? ["remote_threat_visible"] : ["remote_threat_uncertain"],
    evidence: [`remote_target:${target?.startsWith("remote_") ? target : "none"}`, `advanced_roots:${server?.advancedRootCount ?? 0}`, `remote_belief_boost:${remoteBeliefBoost}`]
  };
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
  const roleRecord = CARD_ROLES.get(cardId);
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

function serverIdFromEvent(event: PublicGameEvent): string | undefined {
  const candidate = event.publicPayload.serverId ?? event.publicPayload.attackedServerId ?? event.publicPayload.server ?? event.publicPayload.targetServerId;
  if (typeof candidate === "string") return candidate;
  const label = typeof event.publicPayload.serverLabel === "string" ? event.publicPayload.serverLabel : undefined;
  if (!label) return undefined;
  if (label === "HQ") return "hq";
  if (label === "R&D" || label === "F&E (R&D)" || label === "F&E") return "rd";
  if (label === "Archives" || label === "Archive") return "archives";
  const remoteMatch = /^Remote\s+(\d+)$/i.exec(label);
  if (!remoteMatch) return undefined;
  return `remote_${remoteMatch[1]}`;
}

function isLowInformationRunTarget(features: RunnerFeatures, serverId: string): boolean {
  const server = features.serverFeatures.get(serverId);
  if (!server) return false;
  return server.iceCount <= 1 && server.rootCount === 0;
}

function assessKnownRezzedIcePath(
  iceCards: Array<{ definitionId?: string; rezzed?: boolean; known: boolean; subtypes?: string[]; strength?: number }>,
  rigCards: VisibleCard[],
  runnerCredits: number
): { blocked: boolean; visibleBreakCost?: number } {
  let visibleBreakCost = 0;
  const breakerStrengths = new Map(rigCards.map((card) => [card.instanceId, card.strength ?? 0]));
  for (const ice of iceCards) {
    if (!ice.definitionId || !ice.known || ice.rezzed !== true) continue;
    const endTheRunCount = endTheRunSubroutineCount(ice.definitionId);
    if (endTheRunCount === 0) continue;
    const breakAssessment = minimumCreditsToBreakEndTheRunSubroutines(ice, rigCards, endTheRunCount, breakerStrengths);
    if (!breakAssessment) return { blocked: true, ...(visibleBreakCost > 0 ? { visibleBreakCost } : {}) };
    visibleBreakCost += breakAssessment.cost;
    breakerStrengths.set(breakAssessment.breakerInstanceId, breakAssessment.endingStrength);
  }
  return visibleBreakCost > 0 ? { blocked: visibleBreakCost > runnerCredits, visibleBreakCost } : { blocked: false };
}

function minimumCreditsToBreakEndTheRunSubroutines(
  ice: { definitionId?: string; subtypes?: string[]; strength?: number },
  rigCards: VisibleCard[],
  endTheRunCount: number,
  breakerStrengths: Map<string, number>
): { cost: number; breakerInstanceId: string; endingStrength: number } | undefined {
  const costs = rigCards
    .map((card) => creditsToBreakEndTheRunSubroutinesWithBreaker(card, ice, endTheRunCount, breakerStrengths.get(card.instanceId)))
    .filter((cost): cost is { cost: number; breakerInstanceId: string; endingStrength: number } => cost !== undefined)
    .sort((left, right) => left.cost - right.cost || left.breakerInstanceId.localeCompare(right.breakerInstanceId));
  if (costs.length === 0) return undefined;
  return costs[0];
}

function creditsToBreakEndTheRunSubroutinesWithBreaker(
  breakerCard: VisibleCard,
  ice: { definitionId?: string; subtypes?: string[]; strength?: number },
  endTheRunCount: number,
  currentBreakerStrength = breakerCard.strength ?? 0
): { cost: number; breakerInstanceId: string; endingStrength: number } | undefined {
  if (!breakerCard.known || !breakerCard.definitionId || !ice.definitionId) return undefined;
  const breakerDefinitionId = breakerCard.definitionId;
  const iceDefinitionId = ice.definitionId;
  const breakerDefinition = DEMO_CARDS_BY_ID[breakerDefinitionId];
  const iceDefinition = DEMO_CARDS_BY_ID[iceDefinitionId];
  if (!breakerDefinition || !iceDefinition) return undefined;
  const breakAbility = breakerDefinition.abilities?.find(
    (ability) => ability.type === "break_subroutine" && (!ability.iceSubtype || (ice.subtypes ?? iceDefinition.subtypes).includes(ability.iceSubtype))
  );
  if (!breakAbility) return undefined;
  const breakerStrength = currentBreakerStrength;
  const iceStrength = ice.strength ?? iceDefinition.strength ?? 0;
  const pumpAbility = breakerDefinition.abilities?.find((ability) => ability.type === "pump_strength");
  let pumpCost = 0;
  let endingStrength = breakerStrength;
  if (breakerStrength < iceStrength) {
    if (!pumpAbility || (pumpAbility.amount ?? 0) <= 0) return undefined;
    const requiredPumps = Math.ceil((iceStrength - breakerStrength) / Math.max(1, pumpAbility.amount ?? 1));
    pumpCost = requiredPumps * (pumpAbility.cost.credits ?? 0);
    endingStrength += requiredPumps * Math.max(1, pumpAbility.amount ?? 1);
  }
  const breakCount = Math.max(1, breakAbility.count ?? 1);
  const breakUses = Math.ceil(endTheRunCount / breakCount);
  return {
    cost: pumpCost + breakUses * (breakAbility.cost.credits ?? 0),
    breakerInstanceId: breakerCard.instanceId,
    endingStrength
  };
}

function endTheRunSubroutineCount(iceDefinitionId: string): number {
  return DEMO_CARDS_BY_ID[iceDefinitionId]?.subroutines?.filter((subroutine) => subroutine.type === "end_the_run").length ?? 0;
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
    ...(opponentModel ? { opponentModel } : {})
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
