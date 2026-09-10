import { describe, expect, it } from "vitest";

import { damageImpactMeterUnits } from "../features/actions/damage-impact-meter";

const kinds = (input: Parameters<typeof damageImpactMeterUnits>[0]): string[] =>
  damageImpactMeterUnits(input).map((unit) => unit.kind);

describe("damageImpactMeterUnits", () => {
  it("fills two of three grip segments from the left", () => {
    expect(
      kinds({
        amount: 2,
        flatline: false,
        runnerGripBefore: 3,
        runnerGripAfter: 1,
      }),
    ).toEqual(["lost", "lost", "remaining", "flatline"]);
  });

  it("keeps all surviving cards next to the right-hand flatline boundary", () => {
    expect(
      kinds({
        amount: 2,
        flatline: false,
        runnerGripBefore: 6,
        runnerGripAfter: 4,
      }),
    ).toEqual([
      "lost",
      "lost",
      "remaining",
      "remaining",
      "remaining",
      "remaining",
      "flatline",
    ]);
  });

  it("places exact lethal damage before the flatline boundary", () => {
    expect(
      kinds({
        amount: 3,
        flatline: true,
        runnerGripBefore: 3,
        runnerGripAfter: 0,
      }),
    ).toEqual(["lost", "lost", "lost", "flatline"]);
  });

  it("places overkill damage beyond the flatline boundary", () => {
    expect(
      kinds({
        amount: 5,
        flatline: true,
        runnerGripBefore: 3,
        runnerGripAfter: 0,
      }),
    ).toEqual(["lost", "lost", "lost", "flatline", "overkill", "overkill"]);
  });

  it("keeps the boundary visible when public grip counts are unavailable", () => {
    expect(kinds({ amount: 2, flatline: false })).toEqual([
      "unknown",
      "unknown",
      "flatline",
    ]);
  });
});
