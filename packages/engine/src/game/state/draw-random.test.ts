import {
  RandomPurposeCode,
  type CardInstanceId,
  type GameState,
} from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  drawCorpCards,
  nextRandom,
  randomHqAccess,
  recordStateRandomMarkers,
  rollDeterministicDie,
  shuffleStateIds,
  withActionRandomHistory,
} from "./draw-random";

const HQ_A = "hq_a" as CardInstanceId;
const HQ_B = "hq_b" as CardInstanceId;

function state(): GameState {
  return {
    seed: "draw-random-test",
    randomCounter: 0,
    randomDrawRecords: [],
    corp: { hq: [HQ_A, HQ_B] },
  } as unknown as GameState;
}

describe("draw-random", () => {
  it("does not import index or define public payload/pending choice logic", () => {
    const source = readFileSync(
      new URL("./draw-random.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain("../index");
    expect(source).not.toContain("../../index");
    expect(source).not.toContain("PublicPayload");
    expect(source).not.toContain("publicContext");
    expect(source).not.toContain("pendingChoice");
    expect(source).not.toContain("hiddenZoneAction");
  });

  it("records deterministic random values with typed purpose codes", () => {
    const current = state();
    const value = nextRandom(current, [RandomPurposeCode.HqAccess]);

    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThan(1);
    expect(current.randomCounter).toBe(1);
    expect(current.randomDrawRecords).toEqual([
      { counter: 0, purpose: [RandomPurposeCode.HqAccess], value },
    ]);

    const die = rollDeterministicDie(current, [
      RandomPurposeCode.ProgramProbe,
      1,
    ]);
    expect(die).toBeGreaterThanOrEqual(1);
    expect(die).toBeLessThanOrEqual(6);
    expect(current.randomDrawRecords[1]?.purpose).toEqual([
      RandomPurposeCode.ProgramProbe,
      1,
    ]);
  });

  it("draws corp cards and preserves deck-empty game-over behavior", () => {
    const current = state();
    current.cardInstances = {
      [HQ_A]: {
        instanceId: HQ_A,
        definitionId: 3324707508,
        owner: "corp",
        controller: "corp",
        zone: { side: "corp", zone: "rd" },
        faceup: false,
        rezzed: false,
        advancementCounters: 0,
        strengthModifier: 0,
      },
    };
    current.corp.rd = [HQ_A];
    current.corp.hq = [];

    drawCorpCards(current, 1);
    expect(current.corp.rd).toEqual([]);
    expect(current.corp.hq).toEqual([HQ_A]);
    expect(current.cardInstances[HQ_A]?.zone).toEqual({
      side: "corp",
      zone: "hq",
    });

    drawCorpCards(current, 1);
    expect(current.winner).toBe("runner");
    expect(current.gameEndReason).toBe("corp_deck_empty");
    expect(current.phase).toBe("game_over");
    expect(current.timingPoint).toBe("game.checkpoint");
  });

  it("shuffles and records markers through state random counters", () => {
    const current = state();
    const ids = ["a", "b", "c"] as CardInstanceId[];

    const shuffled = shuffleStateIds(current, ids, [
      RandomPurposeCode.SetupRunnerShuffle,
    ]);
    expect(shuffled).toHaveLength(3);
    expect([...shuffled].sort()).toEqual([...ids].sort());
    expect(ids).toEqual(["a", "b", "c"]);
    expect(current.randomCounter).toBe(2);
    expect(current.randomDrawRecords.map((record) => record.purpose)).toEqual([
      [RandomPurposeCode.SetupRunnerShuffle],
      [RandomPurposeCode.SetupRunnerShuffle],
    ]);

    recordStateRandomMarkers(current, [RandomPurposeCode.SetupRunnerDraw], 2);
    expect(current.randomCounter).toBe(4);
    expect(
      current.randomDrawRecords.slice(2).map((record) => record.purpose),
    ).toEqual([
      [RandomPurposeCode.SetupRunnerDraw],
      [RandomPurposeCode.SetupRunnerDraw],
    ]);
  });

  it("keeps HQ random access purpose stable", () => {
    const current = state();
    const accessed = randomHqAccess(current);

    expect([HQ_A, HQ_B]).toContain(accessed);
    expect(current.randomDrawRecords[0]?.purpose).toEqual([
      RandomPurposeCode.HqAccess,
    ]);
  });

  it("validates the current history once for multiple draws in an action", () => {
    const current = state();
    const purpose = [RandomPurposeCode.HqAccess] as const;
    nextRandom(current, purpose);
    const first = current.randomDrawRecords[0]!;
    let reads = 0;
    Object.defineProperty(current.randomDrawRecords, 0, {
      configurable: true,
      get: () => {
        reads++;
        return first;
      },
    });
    withActionRandomHistory(current, () => {
      nextRandom(current, purpose);
      nextRandom(current, purpose);
      recordStateRandomMarkers(current, [RandomPurposeCode.SetupRunnerDraw], 2);
    });
    expect(reads).toBe(1);
    expect(
      current.randomDrawRecords.slice(1).map((record) => record.counter),
    ).toEqual([1, 2, 3, 4]);

    delete current.randomDrawRecords[0];
    expect(() => nextRandom(current, purpose)).toThrow(
      "nicht replay-konsistent",
    );
    expect(current.randomCounter).toBe(5);
  });

  it("rejects malformed random cursors before recording or shuffling", () => {
    const malformed = state();
    malformed.randomCounter = 2;
    const before = structuredClone(malformed);

    expect(() => nextRandom(malformed, [RandomPurposeCode.HqAccess])).toThrow(
      "nicht replay-konsistent",
    );
    expect(malformed).toEqual(before);
    expect(() =>
      shuffleStateIds(
        malformed,
        [HQ_A],
        [RandomPurposeCode.SetupRunnerShuffle],
      ),
    ).toThrow("nicht replay-konsistent");
    expect(malformed).toEqual(before);
  });
  it.each(["draw", "shuffle", "markers"] as const)(
    "rejects a missing history record before %s mutates the state",
    (operation) => {
      const current = state();
      nextRandom(current, [RandomPurposeCode.HqAccess]);
      delete current.randomDrawRecords[0];
      const before = structuredClone(current);
      const apply = () => {
        if (operation === "draw")
          nextRandom(current, [RandomPurposeCode.HqAccess]);
        else if (operation === "shuffle")
          shuffleStateIds(
            current,
            [HQ_A, HQ_B],
            [RandomPurposeCode.SetupRunnerShuffle],
          );
        else
          recordStateRandomMarkers(
            current,
            [RandomPurposeCode.SetupRunnerDraw],
            1,
          );
      };

      expect(apply).toThrow("nicht replay-konsistent");
      expect(current).toEqual(before);
    },
  );
});
