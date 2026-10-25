import { describe, expect, it } from "vitest";
import { quoteAgendaDefinitionScorePoints } from "./agenda-definition-score-quote";
const babylon = "onr_v1_214_project-babylon";
describe("public agenda definition score-point quote", () => {
  it.each([
    [3, 1],
    [4, 1],
    [5, 2],
    [7, 3],
  ])(
    "quotes %i counters as %i points under the scoring effect",
    (counters, points) => {
      expect(
        quoteAgendaDefinitionScorePoints(babylon, 3, counters, 2),
      ).toMatchObject({
        complete: true,
        agendaPoints: points,
        bonusAgendaPoints: points - 1,
        minimumAdvancementCountersForRequestedPoints: 5,
      });
    },
  );
  it("uses the visible effective difficulty and reaches more than one bonus group", () => {
    expect(quoteAgendaDefinitionScorePoints(babylon, 5, 7, 4)).toMatchObject({
      complete: true,
      agendaPoints: 2,
      minimumAdvancementCountersForRequestedPoints: 11,
    });
  });
  it("does not invent bonus points for an ordinary agenda", () => {
    expect(
      quoteAgendaDefinitionScorePoints("onr_v1_220_tycho-extension", 4, 8, 5),
    ).toMatchObject({
      complete: true,
      agendaPoints: 4,
      bonusAgendaPoints: 0,
      minimumAdvancementCountersForRequestedPoints: null,
    });
  });
  it.each(["unknown-agenda", "onr_v1_133_score!", "onr_v1_225_canis-major"])(
    "fails visibly for unavailable agenda identity %s",
    (id) => {
      expect(quoteAgendaDefinitionScorePoints(id, 3, 5, 2)).toEqual({
        complete: false,
        reason: "unknown_agenda_definition",
      });
    },
  );
  it.each([-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid projection number %s",
    (value) => {
      for (const args of [
        [value, 5, 2],
        [3, value, 2],
        [3, 5, value],
      ])
        expect(
          quoteAgendaDefinitionScorePoints(
            babylon,
            args[0]!,
            args[1]!,
            args[2]!,
          ),
        ).toEqual({ complete: false, reason: "invalid_score_projection" });
    },
  );
});
