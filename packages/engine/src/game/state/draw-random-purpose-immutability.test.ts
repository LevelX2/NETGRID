import { describe, expect, it } from "vitest";
import { createGame } from "../create-game";
import {
  nextRandom,
  recordStateRandomMarkers,
  shuffleStateIds,
} from "./draw-random";

describe("recorded random purpose ownership", () => {
  it("snapshots nested damage provenance before returning to the caller", () => {
    const state = createGame({ seed: "random-source-ownership" });
    const source: ["s", number, string, ["p", number, number]] = [
      "s",
      7,
      "c2",
      ["p", 433, 0],
    ];
    const purpose: [11, 0 | 1 | 2, typeof source, number, number] = [
      11,
      0,
      source,
      1,
      0,
    ];
    const expected = structuredClone(purpose);
    nextRandom(state, purpose);
    const history = structuredClone(state.randomDrawRecords);
    purpose[1] = 1;
    source[2] = "c3";
    source[3][1] = 434;
    source[3][2] = 1;
    expect(state.randomDrawRecords).toEqual(history);
    expect(state.randomDrawRecords.at(-1)?.purpose).toEqual(expected);
  });

  it.each(["shuffle", "markers"] as const)(
    "snapshots every %s record independently",
    (operation) => {
      const state = createGame({ seed: "random-batch-ownership" });
      const purpose: [10, number, number] = [10, 7, 0];
      const before = state.randomCounter;
      if (operation === "shuffle")
        shuffleStateIds(state, ["a", "b", "c"], purpose);
      else recordStateRandomMarkers(state, purpose, 2);
      const history = state.randomDrawRecords.slice(before);
      const expected = structuredClone(history);
      purpose[1] = 8;
      purpose[2] = 1;
      expect(history).toEqual(expected);
      expect(history).toHaveLength(2);
      expect(history[0]!.purpose).not.toBe(history[1]!.purpose);
    },
  );
});
