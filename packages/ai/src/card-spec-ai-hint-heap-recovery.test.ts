import { cardSpecPlanningCards } from "@netgrid/cards/planning";
import { describe, expect, it } from "vitest";
import { AI_HINTS_BY_CARD } from "./ai-hints";
import { deriveCardSpecAiHint } from "./card-spec-ai-hint-compiler";
import { buildDeckStrategyProfile } from "./deck-doctrine-strategy";
import { runnerEffectsProvideHeapRecovery, runnerEffectsProvideTopTrashRecovery } from "./runner-canonical-hint-semantics";

function entry(id: string) {
  const found = cardSpecPlanningCards().find((card) => card.definition.id === id);
  if (!found) throw new Error("heap_recovery_test_card_missing:" + id);
  return found;
}

describe("canonical Heap search and recovery facts", () => {
  it.each([
    ["onr_v1_089_gideons-pawnshop", "any_card"],
    ["onr_v1_087_forgotten-backup-chip", "program"],
  ])("projects %s without turning an arbitrary Heap choice into top-card recovery", (id, filter) => {
    for (const hint of [deriveCardSpecAiHint(entry(id)), AI_HINTS_BY_CARD.get(id)!]) {
      expect(hint.effects).toEqual(expect.arrayContaining([
        expect.objectContaining({ kind: "card_recovery", scope: "heap", target: "search_trash_to_grip", amount: 1, finite: true }),
        expect.objectContaining({ kind: "search", scope: "heap", target: filter, amount: 1, finite: true }),
      ]));
      expect(hint.functionSignals).toEqual(expect.arrayContaining(["setup.recovery", "setup.search"]));
      expect(runnerEffectsProvideHeapRecovery(hint.effects)).toBe(true);
      expect(runnerEffectsProvideTopTrashRecovery(hint.effects)).toBe(false);
      expect(hint.functionSignals).not.toContain("setup.top_trash_recovery");
    }
  });

  it("counts actual copies once in recovery and search without inventing permanent coverage", () => {
    const profile = buildDeckStrategyProfile({
      deckSnapshotId: "heap-recovery-profile", side: "runner",
      cards: [
        { cardId: "onr_v1_089_gideons-pawnshop", quantity: 2 },
        { cardId: "onr_v1_087_forgotten-backup-chip", quantity: 3 },
        { cardId: "onr_v1_114_temple-microcode-outlet", quantity: 4 },
      ],
    });
    expect(profile.runnerProfile?.setupProfile).toMatchObject({ recovery: 5, search: 9 });
    for (const family of ["wall", "code_gate", "sentry"] as const)
      expect(profile.runnerProfile?.coverageProfile[family].count).toBe(0);
    expect(runnerEffectsProvideHeapRecovery(AI_HINTS_BY_CARD.get("onr_v1_114_temple-microcode-outlet")?.effects)).toBe(false);
    const top = [{ kind: "card_recovery" as const, scope: "heap" as const, timing: "action" as const, target: "move_top_trash_to_grip" }];
    expect(runnerEffectsProvideHeapRecovery(top)).toBe(true);
    expect(runnerEffectsProvideTopTrashRecovery(top)).toBe(true);
  });

  it.each([
    { filter: "ice", visibility: "hidden_info_barrier" },
    { filter: "any_card", visibility: "public" },
  ])("rejects unsupported Heap shapes instead of dropping their semantics", (effect) => {
    const source = entry("onr_v1_089_gideons-pawnshop");
    const changed = {
      ...source,
      planning: {
        ...source.planning,
        engine: {
          ...source.planning.engine,
          abilities: source.planning.engine.abilities!.map((ability, index) =>
            index === 0
              ? { ...ability, effects: [{ kind: "search_trash_to_grip", ...effect }] }
              : ability,
          ),
        },
      },
    };
    expect(() => deriveCardSpecAiHint(changed as never)).toThrow("card_spec_unknown_heap_search_to_grip_shape");
  });
});
