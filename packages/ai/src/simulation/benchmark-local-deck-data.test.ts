import { describe, expect, it } from "vitest";

import {
  LOCAL_REALISTIC_BENCHMARK_DECKS,
  LOCAL_REALISTIC_FROZEN_DECK_SNAPSHOTS,
  REAL_SCENE_BENCHMARK_DECKS,
  REAL_SCENE_FROZEN_DECK_SNAPSHOTS,
} from "./benchmark-local-deck-data";

describe("local benchmark deck data", () => {
  it("freezes module-global JSON registries recursively", () => {
    expect(Object.isFrozen(LOCAL_REALISTIC_FROZEN_DECK_SNAPSHOTS)).toBe(true);
    expect(Object.isFrozen(LOCAL_REALISTIC_FROZEN_DECK_SNAPSHOTS[0])).toBe(
      true,
    );
    expect(Object.isFrozen(REAL_SCENE_FROZEN_DECK_SNAPSHOTS)).toBe(true);
    expect(Object.isFrozen(REAL_SCENE_FROZEN_DECK_SNAPSHOTS[0])).toBe(true);
    expect(Object.isFrozen(LOCAL_REALISTIC_BENCHMARK_DECKS)).toBe(true);
    expect(Object.isFrozen(REAL_SCENE_BENCHMARK_DECKS)).toBe(true);
  });
});
