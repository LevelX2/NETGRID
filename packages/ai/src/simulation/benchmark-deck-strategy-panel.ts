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
  const normalized = role.toLocaleLowerCase("en-US");
  if (normalized.includes("virus") && normalized.includes("damage")) {
    return "virus_damage";
  }
  if (normalized.includes("hybrid") || normalized.includes("score_punish")) {
    return "hybrid_score_punish";
  }
  if (normalized.includes("fast_advance")) return "fast_advance";
  if (normalized.includes("fast") && normalized.includes("advance")) {
    return "fast_advance";
  }
  if (normalized.includes("net_damage")) return "net_damage";
  if (normalized.includes("net") && normalized.includes("damage")) {
    return "net_damage";
  }
  if (normalized.includes("tag") || normalized.includes("punish")) {
    return "tag_punish";
  }
  if (
    normalized.includes("glacier") ||
    normalized.includes("remote_scoring") ||
    normalized.includes("scoring")
  ) {
    return "remote_scoring";
  }
  return "unknown";
}
