import { describe, expect, it } from "vitest";
import { isScoredAgendaStartDrawChoiceSource } from "./scored-agenda-start-draw-choice-sequence";

describe("direct scored agenda effect modules", () => {
  it("recognizes employee empowerment start-draw choices", () => {
    expect(
      isScoredAgendaStartDrawChoiceSource(
        "scored_agenda.start_draw_choice:agenda_1:8",
      ),
    ).toBe(true);
    expect(
      isScoredAgendaStartDrawChoiceSource(
        "v162.scored_subtype_reveal:agenda_1:wall:2:8",
      ),
    ).toBe(false);
  });
});
