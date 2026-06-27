import type { AiDeckDoctrineProfile, DeckPublicMetadata, Side } from "@netgrid/shared";
import {
  deckDoctrineCardIsAiSupported,
  rolesForDeckDoctrineCard,
} from "./deck-doctrine-card-roles";
import {
  legacyDeckDoctrineMulliganWeightsFor,
  legacyDeckDoctrinePlanWeightsFor,
} from "./legacy/deck-doctrine-legacy-weights";

export type AiDeckDoctrineDeckSnapshot = {
  deckSnapshotId: string;
  side: Side;
  formatProfileId?: string;
  publicMetadata?: DeckPublicMetadata;
  cards: Array<{ cardId: string; quantity: number }>;
};

// @legacyDoctrineV1
// Retained for legacy public contracts, benchmark fixtures and old baseline
// heuristics only. Normal Semantic Runtime strategy selection must use
// DeckDoctrine v2 diagnostics, capabilities and TacticalGoals instead of these
// v1 archetype tags, planWeights or mulliganWeights.
export function buildDeckDoctrineProfile(snapshot: AiDeckDoctrineDeckSnapshot): AiDeckDoctrineProfile {
  const totalCards = snapshot.cards.reduce((sum, entry) => sum + Math.max(0, entry.quantity), 0) || 1;
  const roleCounts: Record<string, number> = {};
  const unsupported: string[] = [];
  const missingRoles: string[] = [];

  for (const entry of snapshot.cards.slice().sort((left, right) => left.cardId.localeCompare(right.cardId))) {
    const quantity = Math.max(0, entry.quantity);
    if (!deckDoctrineCardIsAiSupported(entry.cardId)) {
      unsupported.push(entry.cardId);
    }
    const roles = rolesForDeckDoctrineCard(entry.cardId);
    if (roles.length === 0) missingRoles.push(entry.cardId);
    for (const role of roles) roleCounts[role] = (roleCounts[role] ?? 0) + quantity;
  }

  const roleDensity = Object.fromEntries(Object.entries(roleCounts).map(([role, count]) => [role, round(count / totalCards)]));
  const archetypeTags = snapshot.side === "corp" ? corpArchetypes(roleCounts, totalCards) : runnerArchetypes(roleCounts, totalCards);
  const planWeights = legacyDeckDoctrinePlanWeightsFor(snapshot.side, archetypeTags);
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
    mulliganWeights: legacyDeckDoctrineMulliganWeightsFor(snapshot.side),
    riskFlags,
    evidence: doctrineEvidence(snapshot.side, roleCounts, totalCards, missingRoles.length)
  };
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

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
