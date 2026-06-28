import { describe, expect, it } from "vitest";
import { strategicPlanKindMatches } from "./strategic-plan-conversion-metrics";

describe("strategicPlanKindMatches", () => {
  it("matches strategic plan kinds by bounded terms", () => {
    expect(strategicPlanKindMatches("recover_economy_plan", ["recover_economy"]))
      .toBe(true);
    expect(strategicPlanKindMatches("recover_economyish_noise", ["recover_economy"]))
      .toBe(false);
    expect(strategicPlanKindMatches("protect_hq", ["protect_hq", "protect_rnd"]))
      .toBe(true);
    expect(strategicPlanKindMatches("protector_hq_noise", ["protect_hq"]))
      .toBe(false);
  });
});
