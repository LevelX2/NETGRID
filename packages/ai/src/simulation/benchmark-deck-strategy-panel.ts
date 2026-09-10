import type {
  AiBenchmarkCorpArchetype,
  AiBenchmarkDeckSlotDefinition,
} from "./benchmark-deck-types";

export const CORP_STRATEGY_PANEL_TARGETS = [
  "remote_scoring",
  "fast_advance",
  "tag_punish",
  "net_damage",
  "hybrid_score_punish",
  "virus_damage",
] as const satisfies readonly AiBenchmarkCorpArchetype[];

export function missingCorpStrategyPanelSlots(
  slots: readonly AiBenchmarkDeckSlotDefinition[],
): AiBenchmarkDeckSlotDefinition[] {
  return CORP_STRATEGY_PANEL_TARGETS.filter(
    (target) => !slots.some((slot) => slot.corpArchetype === target),
  ).map((target) => ({
    slotId: `strategy_panel_gap_${target}`,
    label: `Strategy Panel Gap: ${target}`,
    slotType: "strategy_panel_gap",
    status: "pending",
    runner: {
      kind: "pending_real_scene",
      label: `strategy_panel:${target}:runner_pending`,
    },
    corp: {
      kind: "pending_real_scene",
      label: `strategy_panel:${target}:corp_pending`,
    },
    runnerArchetype: "unknown",
    corpArchetype: target,
    tuningUse: "holdout_only",
    pendingReason: `Corp strategy panel target ${target} has no stable runnable benchmark deck yet.`,
  }));
}

export function benchmarkCorpArchetypeFromRole(
  role: string | undefined,
): AiBenchmarkCorpArchetype {
  if (!role) return "unknown";
  const tokens = new Set(
    role
      .toLocaleLowerCase("en-US")
      .split(/[^a-z0-9]+/)
      .filter(Boolean),
  );
  if (tokens.has("virus") && tokens.has("damage")) {
    return "virus_damage";
  }
  if (tokens.has("hybrid") || (tokens.has("score") && tokens.has("punish"))) {
    return "hybrid_score_punish";
  }
  if (tokens.has("fast") && tokens.has("advance")) {
    return "fast_advance";
  }
  if (tokens.has("net") && tokens.has("damage")) {
    return "net_damage";
  }
  if (tokens.has("tag") || tokens.has("punish")) {
    return "tag_punish";
  }
  if (tokens.has("glacier") || tokens.has("scoring")) {
    return "remote_scoring";
  }
  return "unknown";
}
