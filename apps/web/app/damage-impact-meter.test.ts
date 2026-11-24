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
    ).toEqual(["lost", "lost", "remaining"]);
  });

  it("shows all surviving cards after the lost cards", () => {
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
    ]);
  });

  it("shows an empty grip without a flatline marker when the runner survives", () => {
    expect(
      kinds({
        amount: 3,
        flatline: false,
        runnerGripBefore: 3,
        runnerGripAfter: 0,
      }),
    ).toEqual(["lost", "lost", "lost"]);
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

  it("shows the boundary for a confirmed flatline even without public grip counts", () => {
    expect(kinds({ amount: 2, flatline: false })).toEqual([
      "unknown",
      "unknown",
    ]);
    expect(kinds({ amount: 2, flatline: true })).toEqual([
      "unknown",
      "unknown",
      "flatline",
    ]);
  });
});
