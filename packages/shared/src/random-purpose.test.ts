import { describe, expect, it } from "vitest";
import {
  isRandomDrawRecord,
  isRandomHistory,
  isRandomPurpose,
  randomContextFingerprint,
  serializeRandomPurpose,
  type RandomPurpose,
} from "./random-purpose";

describe("compact random purposes", () => {
  const validPurposes: RandomPurpose[] = [
    [1],
    [10, 7, 0],
    [11, 0, ["s", 7, "c2", ["p", 433, 0]], 2, 0],
    [11, 1, ["c", 433, "c2"], 1, 0],
    [11, 2, ["g", 1], 1, 0],
    [28, 0, 433, 9, "c2"],
    [41, 9],
    [51, 433, 0],
    [60, 1, 9, 0xffffffff],
    [61, 9, 0],
    [62, 0, 0, 8, 9, 0],
    [62, 0, 1, 0, 9, 0],
  ];
  it.each(validPurposes.map((purpose) => ({ purpose })))(
    "validates and serializes $purpose",
    ({ purpose }) => {
      expect(isRandomPurpose(purpose)).toBe(true);
      expect(JSON.parse(serializeRandomPurpose(purpose))).toEqual(purpose);
    },
  );

  it.each(
    [
      "setup.shuffle.runner.start_stack",
      1,
      [],
      [0],
      [1, "extra"],
      [10, 0, 0],
      [10, 7, -1],
      [10, 7, 0.5],
      [10, 7, Number.MAX_SAFE_INTEGER + 1],
      [11, 3, ["g", 1], 1, 0],
      [11, 0, "subroutine:433:legacy", 1, 0],
      [11, 0, ["s", 7, "c2", ["p", 433, -1]], 1, 0],
      [11, 0, ["c", 0], 1, 0],
      [14, 433, 9, "", 0],
      [23, 433, 0],
      [23, 433, 4],
      [28, 2, 433, 9, "c2"],
      [60, 0, 9, 0x100000000],
      [61, 9, NaN],
      [62, 0, 0, 0, 9, 0],
      [62, 0, 1, 8, 9, 0],
    ].map((value) => ({ value })),
  )("rejects an invalid tuple $value", ({ value }) => {
    expect(isRandomPurpose(value)).toBe(false);
  });

  it("keeps the Engine and AI cursor domains distinct", () => {
    const draw = {
      counter: 0,
      purpose: [60, 0, 9, 42],
      value: 0.5,
      domain: "ai_turn_plan_selection",
    };
    expect(isRandomDrawRecord(draw, "ai_turn_plan_selection")).toBe(true);
    expect(isRandomDrawRecord(draw, "engine")).toBe(false);
    expect(isRandomHistory(1, [draw], "ai_turn_plan_selection")).toBe(true);
    expect(isRandomHistory(1, [draw], "engine")).toBe(false);
    expect(
      isRandomHistory(1, [{ ...draw, counter: 1 }], "ai_turn_plan_selection"),
    ).toBe(false);
    expect(isRandomHistory(2, [draw], "ai_turn_plan_selection")).toBe(false);
    expect(isRandomHistory(0, undefined, "ai_turn_plan_selection")).toBe(false);
    expect(isRandomHistory(0, [], "engine")).toBe(true);
    for (const value of [-1, 1, Infinity, NaN])
      expect(
        isRandomDrawRecord({ ...draw, value }, "ai_turn_plan_selection"),
      ).toBe(false);
  });

  it("binds private quote contexts with an unambiguous fixed-width fingerprint", () => {
    expect(randomContextFingerprint(["a:b", "c"])).not.toBe(
      randomContextFingerprint(["a", "b:c"]),
    );
    expect(randomContextFingerprint(["a", 1])).not.toBe(
      randomContextFingerprint(["a", "1"]),
    );
    expect(randomContextFingerprint(["a", 1])).toBe(
      randomContextFingerprint(["a", 1]),
    );
    expect(randomContextFingerprint(["a", 1])).toBeGreaterThanOrEqual(0);
    expect(randomContextFingerprint(["a", 1])).toBeLessThanOrEqual(0xffffffff);
  });
});
