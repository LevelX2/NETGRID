import { describe, expect, it } from "vitest";
import { isScoredSubtypeRevealChoiceSource } from "./subtype-reveal-economy-sequence";

describe("subtype reveal economy sequence routing", () => {
  it("recognizes subtype reveal choice sources", () => {
    expect(
      isScoredSubtypeRevealChoiceSource(
        "v162.scored_subtype_reveal:agenda_1:wall:2:8",
      ),
    ).toBe(true);
    expect(
      isScoredSubtypeRevealChoiceSource(
        "v1920.ice_transmutation:transmutation_agenda:8",
      ),
    ).toBe(false);
  });
});
