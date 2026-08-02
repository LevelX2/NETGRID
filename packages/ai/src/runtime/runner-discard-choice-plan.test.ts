import { describe, expect, it } from "vitest";

import { runnerEmergencyDiscardKeepApplies } from "./runner-discard-choice-plan";

describe("runner discard choice plan", () => {
  it("protects reviewed flatline prevention only under confirmed danger", () => {
    const arasaka = {
      definitionId: "onr_v1_078_arasaka-owns-you",
    };

    expect(runnerEmergencyDiscardKeepApplies("confirmed", arasaka)).toBe(true);
    expect(runnerEmergencyDiscardKeepApplies("critical", arasaka)).toBe(true);
    expect(runnerEmergencyDiscardKeepApplies("suspected", arasaka)).toBe(false);
    expect(runnerEmergencyDiscardKeepApplies("none", arasaka)).toBe(false);
    expect(
      runnerEmergencyDiscardKeepApplies("confirmed", {
        definitionId: "onr_v1_139_r-and-d-interface",
      }),
    ).toBe(false);
  });
});
