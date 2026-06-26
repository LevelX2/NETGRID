import type { AiDeckDoctrineProfile, AiDecisionInput, DeckPublicMetadata, Side } from "@netgrid/shared";
import { CARD_ROLES_BY_CARD, RUNTIME_CARDS, createAiHintsByCard } from "./ai-hints";

export type AiDeckDoctrineDeckSnapshot = {
  deckSnapshotId: string;
  side: Side;
  formatProfileId?: string;
  publicMetadata?: DeckPublicMetadata;
  cards: Array<{ cardId: string; quantity: number }>;
};

export type OpeningHandEvaluation = {
  decision: "keep" | "mulligan";
  score: number;
  reasons: string[];
  evidence: string[];
};

export type CorpOpeningHandEvaluation = OpeningHandEvaluation;
export type RunnerOpeningHandEvaluation = OpeningHandEvaluation;

const AI_HINTS = createAiHintsByCard();

// Legacy Doctrine v1 feeds old baseline/plan scorers and opening-hand heuristics.
// New semantic decisions must use DeckDoctrine v2 diagnostics, capabilities and
// TacticalGoals; support-only or anchorless decks stay neutral here.
// Legacy fallback weights for the old baseline/plan scorers. The newer
// Semantic Runtime/TacticalGoal layer uses DeckCapability-derived facts instead.
const CORP_DOCTRINE_PLAN_WEIGHTS: Record<string, Record<string, number>> = {
  rush: { score_now: 18, score_next_turn: 22, build_scoring_remote: 10, protect_hq: 4, protect_rnd: 4, recover_economy: 6, bait_runner: -4 },
  glacier: { score_now: 4, score_next_turn: 12, build_scoring_remote: 24, protect_hq: 10, protect_rnd: 10, recover_economy: 12, bait_runner: 2 },
  tag_pressure: { score_now: 6, score_next_turn: 8, build_scoring_remote: 8, protect_hq: 8, protect_rnd: 6, recover_economy: 8, bait_runner: 10 },
  asset_remote: { score_now: -2, score_next_turn: 2, build_scoring_remote: 10, protect_hq: 4, protect_rnd: 4, recover_economy: 10, bait_runner: 22 },
  operation_economy: { score_now: 2, score_next_turn: 4, build_scoring_remote: 4, protect_hq: 4, protect_rnd: 4, recover_economy: 22, bait_runner: 2 },
  central_defense: { score_now: 0, score_next_turn: 4, build_scoring_remote: 4, protect_hq: 18, protect_rnd: 18, recover_economy: 8, bait_runner: 0 }
};

const RUNNER_DOCTRINE_PLAN_WEIGHTS: Record<string, Record<string, number>> = {
  rig_builder: { pressure_rnd: -4, pressure_hq: -4, contest_remote: -2, build_rig: 24, recover_economy: 10, draw_for_answers: 14, trash_asset: 0, safe_probe_run: 8 },
  rnd_pressure: { pressure_rnd: 24, pressure_hq: 4, contest_remote: 4, build_rig: 6, recover_economy: 6, draw_for_answers: 8, trash_asset: 0, safe_probe_run: 8 },
  hq_pressure: { pressure_rnd: 4, pressure_hq: 24, contest_remote: 4, build_rig: 6, recover_economy: 6, draw_for_answers: 8, trash_asset: 0, safe_probe_run: 8 },
  remote_contest: { pressure_rnd: 4, pressure_hq: 4, contest_remote: 24, build_rig: 8, recover_economy: 10, draw_for_answers: 4, trash_asset: 8, safe_probe_run: 4 },
  tag_resilient: { pressure_rnd: 6, pressure_hq: 6, contest_remote: 8, build_rig: 8, recover_economy: 8, draw_for_answers: 6, trash_asset: 4, safe_probe_run: 4 },
  economy_dense: { pressure_rnd: 4, pressure_hq: 4, contest_remote: 6, build_rig: 8, recover_economy: 22, draw_for_answers: 10, trash_asset: 4, safe_probe_run: 4 }
};

const CORP_MULLIGAN_WEIGHTS: Record<string, number> = {
  iceStart: 25,
  economy: 20,
  agendaLoad: 20,
  remotePlan: 15,
  operationTempo: 10,
  doctrineFit: 10
};

const RUNNER_MULLIGAN_WEIGHTS: Record<string, number> = {
  breakerAccess: 24,
  economy: 22,
  setup: 16,
  pressure: 12,
  handBalance: 14,
  doctrineFit: 12
};

export function buildDeckDoctrineProfile(snapshot: AiDeckDoctrineDeckSnapshot): AiDeckDoctrineProfile {
  const totalCards = snapshot.cards.reduce((sum, entry) => sum + Math.max(0, entry.quantity), 0) || 1;
  const roleCounts: Record<string, number> = {};
  const unsupported: string[] = [];
  const missingRoles: string[] = [];

  for (const entry of snapshot.cards.slice().sort((left, right) => left.cardId.localeCompare(right.cardId))) {
    const quantity = Math.max(0, entry.quantity);
    const runtimeCard = RUNTIME_CARDS[entry.cardId];
    if (!runtimeCard?.statuses.ai_supported) unsupported.push(entry.cardId);
    const roles = rolesForCard(entry.cardId);
    if (roles.length === 0) missingRoles.push(entry.cardId);
    for (const role of roles) roleCounts[role] = (roleCounts[role] ?? 0) + quantity;
  }

  const roleDensity = Object.fromEntries(Object.entries(roleCounts).map(([role, count]) => [role, round(count / totalCards)]));
  const archetypeTags = snapshot.side === "corp" ? corpArchetypes(roleCounts, totalCards) : runnerArchetypes(roleCounts, totalCards);
  const planWeights = planWeightsFor(snapshot.side, archetypeTags);
  const formatProfileId = snapshot.formatProfileId ?? snapshot.publicMetadata?.formatProfileId;
  const riskFlags = sortedUnique([
    ...(unsupported.length > 0 ? ["contains_non_ai_supported_cards"] : []),
    ...(missingRoles.length > 0 ? ["missing_role_hints"] : [])
  ]);
  const confidence = Math.max(0.35, Math.min(0.98, round(0.95 - unsupported.length * 0.03 - missingRoles.length * 0.015)));

  return {
    schemaVersion: "ai-deck-doctrine-v1",
    deckSnapshotId: snapshot.deckSnapshotId,
    deckHash: snapshot.publicMetadata?.deckHash ?? `unknown:${snapshot.deckSnapshotId}`,
    side: snapshot.side,
    ...(formatProfileId ? { formatProfileId } : {}),
    confidence,
    archetypeTags,
    roleCounts: Object.fromEntries(Object.entries(roleCounts).sort(([left], [right]) => left.localeCompare(right))),
    roleDensity: Object.fromEntries(Object.entries(roleDensity).sort(([left], [right]) => left.localeCompare(right))),
    planWeights,
    mulliganWeights: snapshot.side === "corp" ? { ...CORP_MULLIGAN_WEIGHTS } : { ...RUNNER_MULLIGAN_WEIGHTS },
    riskFlags,
    evidence: doctrineEvidence(snapshot.side, roleCounts, totalCards, missingRoles.length)
  };
}

export function evaluateCorpOpeningHand(input: AiDecisionInput): CorpOpeningHandEvaluation {
  const handRoles = input.playerView.own.gripOrHq.flatMap((card) => rolesForCard(card.definitionId ?? ""));
  const agendaCount = handRoles.filter(isAgendaRole).length;
  const iceCount = handRoles.filter(isIceRole).length;
  const economyCount = handRoles.filter((role) => role.includes("economy") || role.includes("draw")).length;
  const remoteRootCount = handRoles.filter((role) => role.includes("asset") || role.includes("upgrade") || role.includes("remote_support")).length;
  const semanticContext = openingSemanticContext(input);
  const hasScorelineStrategy = semanticContext.strategies.some((strategy) =>
    strategy === "corp.remote_scoring" ||
    strategy === "corp.rush_score" ||
    strategy === "corp.fast_advance",
  );
  const hasRemoteProtectionSupport =
    semanticContext.corpRemoteProtectionTools > 0 ||
    semanticContext.strategies.includes("corp.ice_tax_glacier");
  let score = 0;
  const reasons: string[] = [];
  const evidence = [
    `opening_agendas:${agendaCount}`,
    `opening_ice:${iceCount}`,
    `opening_economy:${economyCount}`,
    ...semanticOpeningEvidence(semanticContext)
  ];

  score += iceCount >= 2 ? 25 : iceCount === 1 ? 16 : 0;
  if (iceCount === 0) reasons.push("no_opening_ice");
  score += economyCount >= 1 ? 20 : input.playerView.own.credits >= 5 ? 10 : 0;
  if (economyCount === 0) reasons.push("no_opening_economy");
  score += agendaCount === 0 ? 20 : agendaCount === 1 ? 17 : agendaCount === 2 && iceCount >= 2 ? 9 : 0;
  if (agendaCount >= 3) reasons.push("agenda_flood");
  score += iceCount > 0 && agendaCount <= 2 ? 15 : remoteRootCount > 0 && hasRemoteProtectionSupport ? 10 : 0;
  score += economyCount > 0 || input.playerView.own.gripOrHq.length >= 4 ? 10 : 0;
  score += hasScorelineStrategy && iceCount > 0 && agendaCount <= 2 ? 10 : hasRemoteProtectionSupport && iceCount >= 2 ? 10 : 5;

  if (agendaCount >= 3 && iceCount === 0) score = Math.min(score, 28);
  if (agendaCount >= 3 && economyCount === 0) score = Math.min(score, 38);
  if (iceCount >= 1 && economyCount >= 1 && agendaCount <= 1) reasons.push("opening_plan_supported");
  const threshold = input.difficulty === "hard" ? 50 : input.difficulty === "easy" ? 58 : 54;
  return {
    decision: score >= threshold ? "keep" : "mulligan",
    score,
    reasons: reasons.length > 0 ? reasons : ["opening_hand_acceptable"],
    evidence
  };
}

export function evaluateRunnerOpeningHand(input: AiDecisionInput): RunnerOpeningHandEvaluation {
  const handRoles = input.playerView.own.gripOrHq.flatMap((card) => rolesForCard(card.definitionId ?? ""));
  const breakerCount = handRoles.filter(isBreakerRole).length;
  const economyCount = handRoles.filter((role) => role.includes("economy") || role.includes("draw")).length;
  const setupCount = handRoles.filter((role) => role === "runner_program" || role === "setup_runner" || role === "setup_hardware" || role === "runner_resource" || role === "memory").length;
  const pressureCount = handRoles.filter((role) => role === "run_pressure" || role === "pressure_rnd" || role === "pressure_hq" || role === "remote_contest" || role === "multiaccess").length;
  const handSize = input.playerView.own.gripOrHq.length;
  const semanticContext = openingSemanticContext(input);
  let score = 0;
  const reasons: string[] = [];
  const evidence = [
    `opening_breakers:${breakerCount}`,
    `opening_economy:${economyCount}`,
    `opening_setup:${setupCount}`,
    `opening_pressure:${pressureCount}`,
    ...semanticOpeningEvidence(semanticContext)
  ];

  score += breakerCount >= 2 ? 24 : breakerCount === 1 ? 18 : 0;
  if (breakerCount === 0) reasons.push("no_opening_breaker");
  score += economyCount >= 2 ? 22 : economyCount === 1 ? 18 : input.playerView.own.credits >= 5 ? 8 : 0;
  if (economyCount === 0) reasons.push("no_opening_economy");
  score += setupCount >= 3 ? 16 : setupCount >= 1 ? 10 : 0;
  score += pressureCount > 0 && (breakerCount > 0 || economyCount > 0) ? 12 : pressureCount > 0 ? 4 : 0;
  score += handSize >= 4 && handSize <= 6 ? 14 : handSize >= 3 ? 8 : 0;

  if (semanticContext.strategies.some((strategy) => strategy === "runner.rig_first" || strategy === "runner.search.breaker")) score += breakerCount > 0 && setupCount > 0 ? 12 : setupCount > 0 ? 6 : 0;
  else if (semanticContext.runnerEconomyTools > 0 && semanticContext.strategies.includes("runner.economy_first")) score += economyCount > 0 ? 12 : 4;
  else if (semanticContext.strategies.some((strategy) => strategy === "runner.rnd_pressure" || strategy === "runner.hq_pressure" || strategy === "runner.remote_contest")) score += pressureCount > 0 && (breakerCount > 0 || economyCount > 0) ? 12 : 4;
  else score += 6;

  if (breakerCount === 0 && economyCount === 0) score = Math.min(score, 30);
  if (pressureCount >= 3 && breakerCount === 0) score = Math.min(score, economyCount > 0 ? 44 : 32);
  if (breakerCount >= 1 && economyCount >= 1) reasons.push("opening_runner_plan_supported");
  const threshold = input.difficulty === "hard" ? 50 : input.difficulty === "easy" ? 58 : 54;
  return {
    decision: score >= threshold ? "keep" : "mulligan",
    score,
    reasons: reasons.length > 0 ? reasons : ["opening_hand_acceptable"],
    evidence
  };
}

function rolesForCard(cardId: string): string[] {
  if (!cardId) return [];
  const runtimeCard = RUNTIME_CARDS[cardId];
  const roleRecord = CARD_ROLES_BY_CARD.get(cardId);
  const hint = AI_HINTS.get(cardId);
  const inferred = inferredRoles(runtimeCard);
  return sortedUnique([...(roleRecord?.roles ?? []), ...(hint?.roles ?? []), ...(hint?.planRoles ?? []), ...inferred]);
}

function inferredRoles(card: { side?: Side; type?: string; subtypes?: string[]; subroutines?: Array<{ type?: string }> } | undefined): string[] {
  if (!card) return [];
  const roles: string[] = [];
  if (card.side === "corp") {
    if (card.type === "agenda") roles.push("agenda", "corp_score_agenda");
    if (card.type === "ice") roles.push("corp_install_ice", "corp_rez_ice");
    if (card.type === "asset") roles.push("economy_asset", "asset_trash_target");
    if (card.type === "upgrade") roles.push("upgrade", "remote_support");
    if (card.type === "operation") roles.push("economy_operation");
    for (const subtype of card.subtypes ?? []) {
      if (subtype === "barrier") roles.push("barrier_ice");
      if (subtype === "code gate") roles.push("code_gate_ice");
      if (subtype === "sentry") roles.push("sentry_ice");
      if (subtype === "ambush") roles.push("ambush");
    }
    if (card.subroutines?.some((subroutine) => subroutine.type === "end_the_run")) roles.push("etr_ice");
  } else if (card.side === "runner") {
    if (card.type === "program") roles.push("runner_program", "setup_runner");
    if (card.type === "hardware") roles.push("setup_hardware");
    if (card.type === "resource") roles.push("runner_resource");
    if (card.type === "event") roles.push("run_pressure");
  }
  return roles;
}

function isBreakerRole(role: string): boolean {
  return role.startsWith("breaker_");
}

function corpArchetypes(roleCounts: Record<string, number>, totalCards: number): string[] {
  const scores: Record<string, number> = {
    rush: density(roleCounts, totalCards, ["agenda", "corp_score_agenda", "score_agenda", "agenda_2pt", "agenda_3pt"]) * 34 + density(roleCounts, totalCards, ["corp_install_ice", "barrier_ice", "etr_ice"]) * 18,
    glacier: density(roleCounts, totalCards, ["corp_install_ice", "corp_rez_ice", "taxing_ice", "etr_ice"]) * 42 + density(roleCounts, totalCards, ["economy_operation", "economy_asset"]) * 14,
    tag_pressure: density(roleCounts, totalCards, ["tag_ice", "tag_punishment", "trace", "trace_ice"]) * 75,
    asset_remote: density(roleCounts, totalCards, ["economy_asset", "asset_trash_target", "upgrade", "remote_support", "ambush"]) * 58,
    operation_economy: density(roleCounts, totalCards, ["economy_operation", "draw_operation"]) * 70,
    central_defense: density(roleCounts, totalCards, ["central_defense", "barrier_ice", "code_gate_ice", "sentry_ice", "etr_ice"]) * 32
  };
  return topArchetypes(scores);
}

function runnerArchetypes(roleCounts: Record<string, number>, totalCards: number): string[] {
  const scores: Record<string, number> = {
    rig_builder: density(roleCounts, totalCards, ["setup_runner", "setup_hardware", "runner_program", "memory", "breaker_fracter", "breaker_decoder", "breaker_killer"]) * 44,
    rnd_pressure: density(roleCounts, totalCards, ["run_pressure", "pressure_rnd", "multiaccess"]) * 48,
    hq_pressure: density(roleCounts, totalCards, ["pressure_hq", "run_pressure"]) * 40,
    remote_contest: density(roleCounts, totalCards, ["remote_contest", "run_pressure", "trash_support"]) * 42,
    tag_resilient: density(roleCounts, totalCards, ["tag_clear", "link", "tag_resilient"]) * 64,
    economy_dense: density(roleCounts, totalCards, ["economy", "draw"]) * 45
  };
  return topArchetypes(scores);
}

function planWeightsFor(side: Side, archetypeTags: string[]): Record<string, number> {
  const weights: Record<string, number> = {};
  const source = side === "corp" ? CORP_DOCTRINE_PLAN_WEIGHTS : RUNNER_DOCTRINE_PLAN_WEIGHTS;
  for (const tag of archetypeTags) {
    const contribution = source[tag];
    if (!contribution) continue;
    for (const [plan, value] of Object.entries(contribution)) weights[plan] = (weights[plan] ?? 0) + value;
  }
  return Object.fromEntries(Object.entries(weights).map(([key, value]) => [key, Math.round(value / Math.max(1, archetypeTags.length))]));
}

function doctrineEvidence(side: Side, roleCounts: Record<string, number>, totalCards: number, missingRoleCount: number): AiDeckDoctrineProfile["evidence"] {
  if (side === "corp") {
    return [
      { kind: "agenda_density", label: "agenda_density", value: round(density(roleCounts, totalCards, ["agenda", "corp_score_agenda", "score_agenda", "agenda_2pt", "agenda_3pt"])) },
      { kind: "ice_mix", label: "ice_density", value: round(density(roleCounts, totalCards, ["corp_install_ice", "corp_rez_ice", "barrier_ice", "code_gate_ice", "sentry_ice"])) },
      { kind: "economy_mix", label: "economy_density", value: round(density(roleCounts, totalCards, ["economy_operation", "economy_asset", "draw_operation"])) },
      { kind: "missing_role", label: "missing_role_cards", value: missingRoleCount }
    ];
  }
  return [
    { kind: "density", label: "rig_density", value: round(density(roleCounts, totalCards, ["setup_runner", "runner_program", "setup_hardware"])) },
    { kind: "density", label: "pressure_density", value: round(density(roleCounts, totalCards, ["run_pressure", "pressure_rnd", "pressure_hq"])) },
    { kind: "missing_role", label: "missing_role_cards", value: missingRoleCount }
  ];
}

function density(roleCounts: Record<string, number>, totalCards: number, roles: string[]): number {
  const count = roles.reduce((sum, role) => sum + (roleCounts[role] ?? 0), 0);
  return count / Math.max(1, totalCards);
}

function topArchetypes(scores: Record<string, number>): string[] {
  const selected = Object.entries(scores)
    .filter(([, score]) => score >= 8)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 3)
    .map(([tag]) => tag);
  return selected;
}

function isAgendaRole(role: string): boolean {
  return role === "agenda" || role === "corp_score_agenda" || role === "score_agenda" || role.startsWith("agenda_");
}

function isIceRole(role: string): boolean {
  return role === "corp_install_ice" || role === "corp_rez_ice" || role.endsWith("_ice") || role === "etr_ice" || role === "taxing_ice";
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

type OpeningSemanticContext = {
  strategies: string[];
  strategyProfileStatus: "present" | "neutral" | "missing";
  runnerEconomyTools: number;
  corpRemoteProtectionTools: number;
  capabilityConfidence?: string;
};

function openingSemanticContext(input: AiDecisionInput): OpeningSemanticContext {
  const semanticInput = input as AiDecisionInput & {
    ownDeckStrategyProfile?: {
      primaryStrategies: string[];
      secondaryStrategies: string[];
      warnings: string[];
    };
    ownDeckCapabilities?: {
      confidence?: string;
      runner?: {
        economyBankTools?: readonly unknown[];
      };
      corp?: {
        remotePlanProfile?: {
          remoteProtectionToolsKnown?: number;
        };
      };
    };
  };
  const strategyProfile = semanticInput.ownDeckStrategyProfile;
  const strategies = sortedUnique([
    ...(strategyProfile?.primaryStrategies ?? []),
    ...(strategyProfile?.secondaryStrategies ?? []),
  ]);
  const neutral =
    strategyProfile?.warnings.includes("strategy_profile:neutral_missing_snapshot") ===
      true || strategies.length === 0;
  return {
    strategies,
    strategyProfileStatus: strategyProfile
      ? neutral
        ? "neutral"
        : "present"
      : "missing",
    runnerEconomyTools:
      semanticInput.ownDeckCapabilities?.runner?.economyBankTools?.length ?? 0,
    corpRemoteProtectionTools:
      semanticInput.ownDeckCapabilities?.corp?.remotePlanProfile
        ?.remoteProtectionToolsKnown ?? 0,
    ...(semanticInput.ownDeckCapabilities?.confidence
      ? { capabilityConfidence: semanticInput.ownDeckCapabilities.confidence }
      : {}),
  };
}

function semanticOpeningEvidence(context: OpeningSemanticContext): string[] {
  return [
    `strategy_profile:${context.strategyProfileStatus}`,
    `strategy_lines:${context.strategies.slice(0, 3).join(",") || "none"}`,
    `runner_economy_tools:${context.runnerEconomyTools}`,
    `corp_remote_protection_tools:${context.corpRemoteProtectionTools}`,
    ...(context.capabilityConfidence
      ? [`deck_capability_confidence:${context.capabilityConfidence}`]
      : []),
  ];
}

function doctrineOpeningEvidence(
  doctrine: AiDeckDoctrineProfile | undefined,
): string[] {
  if (!doctrine || doctrine.archetypeTags.length === 0) {
    return ["doctrine:neutral"];
  }
  return [
    `doctrine:${doctrine.archetypeTags.slice(0, 3).join(",")}`,
    `doctrine_confidence:${doctrine.confidence}`,
  ];
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
