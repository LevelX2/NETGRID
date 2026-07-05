import { describe, expect, it } from "vitest";
import { buildDeckDoctrineProfile } from "./deck-doctrine";
import { buildDeckDoctrineRuntimeContext } from "./deck-doctrine-runtime-context";

describe("buildDeckDoctrineRuntimeContext", () => {
  it("models missing deck snapshots as explicit neutral doctrine", () => {
    const context = buildDeckDoctrineRuntimeContext({
      side: "runner",
      neutralDeckId: "runner:missing-deck-snapshot",
    });

    expect(context.strategyProfile.deckId).toBe("runner:missing-deck-snapshot");
    expect(context.strategyProfile.primaryStrategies).toEqual([]);
    expect(context.strategyProfile.secondaryStrategies).toEqual([]);
    expect(context.strategyProfile.warnings).toContain(
      "strategy_profile:neutral_missing_snapshot",
    );
    expect(context.v2Diagnostic.noEffectFlags).toEqual({
      actionSelection: false,
      plannerWeights: false,
      scoring: false,
      legalActionGeneration: false,
      engineMutation: false,
      hiddenInfoProjection: false,
    });
    expect(context.neutralDoctrine).toBe(true);
    expect(context.completenessStatus).toBe("unknown_snapshot");
    expect(context.rolesStatus).toBe("unknown_snapshot");
  });

  it("preserves explicit v1 doctrine profiles for compatibility callers", () => {
    const snapshot = {
      deckSnapshotId: "runner-fixture",
      side: "runner" as const,
      cards: [{ cardId: "unknown_runner_support_only", quantity: 1 }],
    };
    const v1Profile = buildDeckDoctrineProfile(snapshot);
    const context = buildDeckDoctrineRuntimeContext({
      side: "runner",
      deckSnapshot: snapshot,
      v1Profile,
      neutralDeckId: "runner-fixture",
    });

    expect(context.v1Profile).toBe(v1Profile);
  });
});
