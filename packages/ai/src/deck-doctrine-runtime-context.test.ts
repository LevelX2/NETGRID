import { describe, expect, it } from "vitest";
import { buildDeckDoctrineRuntimeContext } from "./deck-doctrine-runtime-context";

describe("buildDeckDoctrineRuntimeContext", () => {
  it("models missing deck snapshots as explicit neutral doctrine", () => {
    const context = buildDeckDoctrineRuntimeContext({
      side: "runner",
      neutralDeckId: "runner:missing-deck-snapshot",
    });

    expect(context.strategyProfile.deckId).toBe(
      "runner:missing-deck-snapshot",
    );
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
});
