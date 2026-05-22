import { describe, expect, it } from "vitest";

import { visibleKnownCardRulesText } from "./card-text-source";

describe("card text source selection", () => {
  it("uses catalog text for known card tooltips instead of projected implementation summaries", () => {
    expect(
      visibleKnownCardRulesText({
        catalogText: "A: Draw two cards.",
        visibleRulesText: "Rezzed transaction asset with a Corp draw/economy ability surface.",
      }),
    ).toBe("A: Draw two cards.");
  });

  it("falls back to projected visible text when catalog detail is not loaded", () => {
    expect(
      visibleKnownCardRulesText({
        catalogText: null,
        visibleRulesText: "Known projected text",
      }),
    ).toBe("Known projected text");
  });
});
