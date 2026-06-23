import { describe, expect, it } from "vitest";
import { buildDeckDoctrineProfile } from "./deck-doctrine";

describe("legacy deck doctrine profile", () => {
  it("keeps anchorless decks neutral instead of inventing fallback archetypes", () => {
    const corp = buildDeckDoctrineProfile({
      deckSnapshotId: "anchorless-corp",
      side: "corp",
      cards: [{ cardId: "unknown_corp_support_only", quantity: 3 }],
    });
    const runner = buildDeckDoctrineProfile({
      deckSnapshotId: "anchorless-runner",
      side: "runner",
      cards: [{ cardId: "unknown_runner_support_only", quantity: 3 }],
    });

    expect(corp.archetypeTags).toEqual([]);
    expect(corp.planWeights).toEqual({});
    expect(runner.archetypeTags).toEqual([]);
    expect(runner.planWeights).toEqual({});
    expect(JSON.stringify({ corp, runner })).not.toContain("glacier");
    expect(JSON.stringify({ corp, runner })).not.toContain("rig_builder");
  });
});
