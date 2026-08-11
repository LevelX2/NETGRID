import { describe, expect, it } from "vitest";

import { runnerNoRunRecurringEconomyProfile } from "./runner-canonical-card-facts";

describe("Runner canonical card facts", () => {
  it("projects no-run recurring economy from the canonical lifecycle", () => {
    expect(
      runnerNoRunRecurringEconomyProfile(
        "onr_v1_184_top-runners-conference",
      ),
    ).toEqual({ turnStartCredits: 2 });
  });

  it("does not infer the profile for unrelated Runner resources", () => {
    expect(
      runnerNoRunRecurringEconomyProfile("onr_v1_295_night-shift"),
    ).toBeUndefined();
  });
});
