import { describe, expect, it } from "vitest";

import {
  deckCardMetricLine,
  formatDeckCardTerm,
  formatDeckCardTypeLine,
} from "./deck-card-text-lines";

describe("deck card text lines", () => {
  it("formats shared type and subtype labels consistently", () => {
    expect(formatDeckCardTypeLine({ type: "ice", subtypes: ["code_gate"] })).toBe(
      "ICE - Code Gate",
    );
    expect(formatDeckCardTerm("event")).toBe("Prep");
  });

  it("keeps the relevant numeric card values in one compact line", () => {
    expect(
      deckCardMetricLine({
        numeric: {
          rezCost: 4,
          strength: 3,
          trashCost: 2,
          agendaPoints: undefined,
        },
      }),
    ).toBe("Stärke 3 · Rez 4 · Trash 2");
  });
});
