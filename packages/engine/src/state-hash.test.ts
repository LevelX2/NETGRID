import { CURRENT_RULES_BASELINE, type GameState } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  cardPoolSnapshotIdentityForState,
  hashStateSnapshot,
  hashStateSnapshotWithRulesContext,
} from "./state-hash";

describe("mechanical StateHash baseline", () => {
  it("ignores text provenance but retains mechanical schema versions", () => {
    const state = {
      baseline: { ...CURRENT_RULES_BASELINE },
      eventLog: [],
      stateVersion: 1,
    } as unknown as GameState;
    const textOnly = {
      ...state,
      baseline: {
        ...state.baseline,
        cardTextSource: "manual" as const,
        cardTextSnapshotId:
          "text-only-change" as typeof state.baseline.cardTextSnapshotId,
      },
    };
    expect(hashStateSnapshot(textOnly)).toBe(hashStateSnapshot(state));
    const engineChange = {
      ...state,
      baseline: {
        ...state.baseline,
        engineSchemaVersion: "mechanical-change",
      },
    } as unknown as GameState;
    expect(hashStateSnapshot(engineChange)).not.toBe(hashStateSnapshot(state));
    expect(hashStateSnapshotWithRulesContext(state, "primitives-v1")).not.toBe(
      hashStateSnapshotWithRulesContext(state, "primitives-v2"),
    );
  });

  it("keeps adversarial Corp and Runner snapshot IDs unambiguous", () => {
    const state = (corp: string, runner: string) =>
      ({
        baseline: CURRENT_RULES_BASELINE,
        eventLog: [],
        deckMetadata: {
          corp: { cardPoolSnapshotId: corp },
          runner: { cardPoolSnapshotId: runner },
        },
      }) as unknown as GameState;
    expect(cardPoolSnapshotIdentityForState(state("a|runner:b", "c"))).not.toBe(
      cardPoolSnapshotIdentityForState(state("a", "b|runner:c")),
    );
  });
});
