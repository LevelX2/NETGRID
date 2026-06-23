import { describe, expect, it } from "vitest";
import { isScoredIceMarkModifierChoiceSource } from "./scored-rezzed-ice-mark-modifier-sequence";

describe("ice transmutation sequence routing", () => {
  it("recognizes scored ICE mark modifier choice sources", () => {
    expect(
      isScoredIceMarkModifierChoiceSource(
        "card_implementation_primitive.select_rezzed_ice_mark_modifier:transmutation_agenda:8",
      ),
    ).toBe(true);
    expect(
      isScoredIceMarkModifierChoiceSource(
        "scored_agenda.rezzed_ice_mark_modifier:transmutation_agenda:8",
      ),
    ).toBe(true);
    expect(
      isScoredIceMarkModifierChoiceSource(
        "card_implementation.scored_agenda_free_rez:priority_agenda:8",
      ),
    ).toBe(false);
  });
});
