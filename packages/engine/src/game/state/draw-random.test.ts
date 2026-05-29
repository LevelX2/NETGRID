import { type CardInstanceId, type GameState } from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  drawCorpCards,
  nextRandom,
  randomHqAccess,
  recordStateRandomMarkers,
  rollDeterministicDie,
  shuffleStateIds,
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

  it("records deterministic random values without changing purpose names", () => {
    const current = state();
    const value = nextRandom(current, "test_purpose");

    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThan(1);
    expect(current.randomCounter).toBe(1);
    expect(current.randomDrawRecords).toEqual([
      { counter: 0, purpose: "test_purpose", value },
    ]);

    const die = rollDeterministicDie(current, "probe");
    expect(die).toBeGreaterThanOrEqual(1);
    expect(die).toBeLessThanOrEqual(6);
    expect(current.randomDrawRecords[1]?.purpose).toBe("v190.die.probe");
  });

  it("draws corp cards and preserves deck-empty game-over behavior", () => {
    const current = state();
    current.cardInstances = {
      [HQ_A]: {
        instanceId: HQ_A,
        definitionId: "corp_card",
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

    const shuffled = shuffleStateIds(current, ids, "shuffle_purpose");
    expect(shuffled).toHaveLength(3);
    expect([...shuffled].sort()).toEqual([...ids].sort());
    expect(ids).toEqual(["a", "b", "c"]);
    expect(current.randomCounter).toBe(2);
    expect(current.randomDrawRecords.map((record) => record.purpose)).toEqual([
      "shuffle_purpose",
      "shuffle_purpose",
    ]);

    recordStateRandomMarkers(current, "marker_purpose", 2);
    expect(current.randomCounter).toBe(4);
    expect(current.randomDrawRecords.slice(2).map((record) => record.purpose))
      .toEqual(["marker_purpose", "marker_purpose"]);
  });

  it("keeps HQ random access purpose stable", () => {
    const current = state();
    const accessed = randomHqAccess(current);

    expect([HQ_A, HQ_B]).toContain(accessed);
    expect(current.randomDrawRecords[0]?.purpose).toBe("hq_random_access");
  });
});
