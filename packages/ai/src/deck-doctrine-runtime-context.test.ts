import { describe, expect, it } from "vitest";
import { buildDeckDoctrineRuntimeContext } from "./deck-doctrine-runtime-context";

describe("buildDeckDoctrineRuntimeContext", () => {
  it("rejects missing deck snapshots instead of building neutral doctrine", () => {
    expect(() =>
      buildDeckDoctrineRuntimeContext({
        side: "runner",
        deckSnapshot: undefined as never,
      }),
    ).toThrow(/ai_deck_snapshot_missing/);
  });

  it("builds productive strategy context without a v1 doctrine profile", () => {
    const context = buildDeckDoctrineRuntimeContext({
      side: "runner",
      deckSnapshot: {
        deckSnapshotId: "runner-fixture",
        side: "runner",
        cards: [{ cardId: "simple_fracter", quantity: 1 }],
      },
    });

    expect(context.strategyProfile.deckId).toBe("runner-fixture");
    expect(context).not.toHaveProperty("v1Profile");
    expect(context.v2Diagnostic.source.mode).toBe("report_only");
  });
});
