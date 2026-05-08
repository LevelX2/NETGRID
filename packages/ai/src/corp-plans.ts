import { createRuntimeCardsById } from "@netgrid/catalog";
import cardRoleManifestData from "../../../data/ai/card-role-manifest-0.9.json";
import aiCardHintsData from "../../../data/ai/ai-card-hints-1.3.1.json";
import runtimeSupplementAiHintsData from "../../../data/ai/ai-card-hints-runtime-supplement.json";
import corpPlanProfilesData from "../../../data/ai/corp-plan-profiles-1.4.0.json";
import type { AiDecision, AiDecisionInput, AiDifficulty, LegalAction, PublicGameEvent, Side, VisibleCard } from "@netgrid/shared";

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

export type CorpPlanDebug = {
  aiLevel: 2;
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

type CardRole = {
  cardId: string;
  side: Side;
  roles: string[];
  riskTags?: string[];
};

type AiCardHint = {
  cardId: string;
  side: Side;
  roles: string[];
  planRoles: string[];
  aiSupportStatus: "none" | "hinted_only" | "scenario_ready" | "ai_supported";
  valueHints?: Record<string, number>;
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

const CARD_ROLES = new Map((cardRoleManifestData.cards as CardRole[]).map((card) => [card.cardId, card]));
const AI_HINTS = new Map([...(aiCardHintsData.cards as AiCardHint[]), ...(runtimeSupplementAiHintsData.cards as AiCardHint[])].map((hint) => [hint.cardId, hint]));
const CORP_PLAN_PROFILES = corpPlanProfilesData.profiles as CorpPlanProfile[];
const RUNTIME_CARDS = createRuntimeCardsById();
const PLAN_ACTION_TYPES = new Set<LegalAction["type"]>(["score_agenda", "advance_card", "install_card", "play_operation", "gain_credit", "draw_card", "end_turn"]);

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
  const timeBudgetMs = options.timeBudgetMs ?? profile.timeBudgetMs;
  if (timeBudgetMs <= 0) {
    return fallbackPlanDecision(input, "time_budget_exhausted", timeBudgetMs, true);
  }
  const candidates = generateCorpPlanCandidates(input).slice(0, profile.planBreadth);
  if (candidates.length === 0) {
    return fallbackPlanDecision(input, "no_plan_candidate", timeBudgetMs, false);
  }
  const scored = candidates
    .map((candidate) => ({ candidate, score: evaluateCorpPlan(input, candidate) }))
    .sort((left, right) => right.score.score - left.score.score || left.candidate.planId.localeCompare(right.candidate.planId));
  const selected = scored[0];
  if (!selected) return fallbackPlanDecision(input, "no_scored_plan", timeBudgetMs, false);
  const action = selectPlanAction(input, selected.candidate);
  if (!action) return fallbackPlanDecision(input, "plan_without_legal_action", timeBudgetMs, false);
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
      evidence: scrubPlanEvidence(selected.score.evidence),
      fallbackUsed: false,
      seed: input.seed,
      profileId: profile.profileId,
      timeBudgetMs,
      timeoutUsed: false
    }
  };
}

export function generateCorpPlanCandidates(input: AiDecisionInput): CorpPlanCandidate[] {
  if (input.side !== "corp") return [];
  const actions = input.legalActions.slice().sort(compareAction);
  return [
    buildCandidate(input, "score_now", actions.filter((action) => action.type === "score_agenda")),
    buildCandidate(
      input,
      "score_next_turn",
      actions.filter((action) => action.type === "advance_card" || (action.type === "install_card" && action.payload?.placement !== "ice" && rolesForAction(input, action).some((role) => role.startsWith("agenda_"))))
    ),
    buildCandidate(
      input,
      "build_scoring_remote",
      actions.filter((action) => action.type === "install_card" && action.payload?.placement !== "ice" && isRemoteServerId(action.payload?.serverId))
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

export function evaluateCorpPlan(input: AiDecisionInput, candidate: CorpPlanCandidate): CorpPlanScore {
  const profile = corpPlanProfile(input);
  const agendaRisk = evaluateAgendaRisk(input, candidate);
  const serverThreat = evaluateServerThreat(input, candidate);
  const economyReserve = evaluateEconomyReserve(input, candidate);
  const iceRez = evaluateIceRez(input, candidate);
  const scoringWindow = evaluateScoringWindow(input, candidate);
  const remoteIntent = evaluateRemoteIntentMemory(input);
  const base = baseScoreForPlan(candidate.kind);
  const score =
    base +
    agendaRisk.score * profile.weights.agendaRisk +
    serverThreat.score * profile.weights.serverThreat +
    economyReserve.score * profile.weights.economyReserve +
    iceRez.score * profile.weights.iceRez +
    scoringWindow.score * profile.weights.scoringWindow +
    remoteIntent.remoteInstallSignals * 8 * profile.weights.remoteIntent +
    remoteIntent.remoteAdvanceSignals * 12 * profile.weights.remoteIntent -
    visibleRiskPenalty(candidate, profile.riskTolerance);
  const evidence = [
    `plan:${candidate.kind}`,
    `difficulty:${input.difficulty}`,
    ...candidate.expectedBenefits,
    ...agendaRisk.evidence,
    ...serverThreat.evidence,
    ...economyReserve.evidence,
    ...iceRez.evidence,
    ...scoringWindow.evidence,
    ...remoteIntent.evidence
  ];
  return {
    planId: candidate.planId,
    score: roundScore(score),
    confidence: confidence(score, candidate.legalActionIds.length),
    reasons: sortedUnique([...agendaRisk.reasons, ...serverThreat.reasons, ...economyReserve.reasons, ...iceRez.reasons, ...scoringWindow.reasons]).slice(0, 6),
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

export function evaluateServerThreat(input: AiDecisionInput, candidate: CorpPlanCandidate): CorpPlanEvaluatorResult {
  const features = extractCorpPlanFeatures(input);
  const memory = evaluateRemoteIntentMemory(input);
  const hq = features.serverFeatures.get("hq");
  const rd = features.serverFeatures.get("rd");
  const hqThreat = memory.centralRunSignals.hq * 45 - (hq?.iceCount ?? 0) * 25;
  const rdThreat = memory.centralRunSignals.rd * 45 - (rd?.iceCount ?? 0) * 25;
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
    evidence: [`hq_ice:${hq?.iceCount ?? 0}`, `rd_ice:${rd?.iceCount ?? 0}`, `hq_runs:${memory.centralRunSignals.hq}`, `rd_runs:${memory.centralRunSignals.rd}`]
  };
}

export function evaluateEconomyReserve(input: AiDecisionInput, candidate: CorpPlanCandidate): CorpPlanEvaluatorResult {
  const features = extractCorpPlanFeatures(input);
  const hasEconomyRole = candidate.requiredRoles.some((role) => role.includes("economy") || role.includes("draw"));
  const lowCredits = features.credits < 5;
  const score = candidate.kind === "recover_economy" ? (lowCredits ? 170 : 80) + (hasEconomyRole ? 45 : 0) : lowCredits ? -40 : 20;
  return {
    score,
    reasons: lowCredits ? ["credit_reserve_low"] : ["credit_reserve_stable"],
    evidence: [`credits:${features.credits}`, `clicks:${features.clicks}`, `economy_role:${hasEconomyRole}`]
  };
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

export function evaluateRemoteIntentMemory(input: AiDecisionInput): RemoteIntentMemory {
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
    evidence: [`remote_installs:${remoteInstallSignals}`, `remote_advances:${remoteAdvanceSignals}`, `remote_scores:${remoteScoreSignals}`]
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

function selectPlanAction(input: AiDecisionInput, candidate: CorpPlanCandidate): LegalAction | undefined {
  const actions = candidate.legalActionIds
    .map((actionId) => input.legalActions.find((action) => action.actionId === actionId))
    .filter((action): action is LegalAction => Boolean(action))
    .sort((left, right) => actionPriority(candidate.kind, right) - actionPriority(candidate.kind, left) || compareAction(left, right));
  return actions[0];
}

function actionPriority(kind: CorpPlanKind, action: LegalAction): number {
  if (kind === "score_now" && action.type === "score_agenda") return 100;
  if (kind === "score_next_turn" && action.type === "advance_card") return 90;
  if ((kind === "protect_hq" || kind === "protect_rnd") && action.type === "install_card" && action.payload?.placement === "ice") return 85;
  if (kind === "recover_economy" && action.type === "play_operation") return 80;
  if (kind === "recover_economy" && action.type === "gain_credit") return 65;
  if ((kind === "build_scoring_remote" || kind === "bait_runner") && action.type === "install_card") return 75;
  if (action.type === "draw_card") return 45;
  if (action.type === "end_turn") return 5;
  return 20;
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
  const roleRecord = CARD_ROLES.get(cardId);
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

function fallbackPlanDecision(input: AiDecisionInput, reason: string, timeBudgetMs: number, timeoutUsed: boolean): CorpPlanDecision {
  const fallbackAction = input.legalActions.slice().sort(compareAction)[0];
  const debug = fallbackDebug(input, undefined, reason, timeBudgetMs, timeoutUsed);
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

function fallbackDebug(input: AiDecisionInput, fallbackDecision: AiDecision | undefined, reason: string, timeBudgetMs: number | undefined, timeoutUsed = false): CorpPlanDebug {
  const fallbackAction = fallbackDecision ? input.legalActions.find((action) => action.actionId === fallbackDecision.actionId) : input.legalActions.slice().sort(compareAction)[0];
  return {
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
    timeoutUsed
  };
}

function serverIdFromEvent(event: PublicGameEvent): string | undefined {
  const payload = event.publicPayload;
  const candidate = payload.serverId ?? payload.attackedServerId ?? payload.server ?? payload.targetServerId;
  return typeof candidate === "string" ? candidate : undefined;
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
  return evidence.filter((entry) => !forbidden.some((needle) => entry.includes(needle)) && !entry.includes("runner_simple_")).slice(0, 18);
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

function compareAction(left: LegalAction, right: LegalAction): number {
  return left.actionId.localeCompare(right.actionId);
}
