import { describe, expect, it } from "vitest";

import {
  cardMetricLine,
  formatCardTerm,
  formatCardTypeLine,
} from "./card-text-lines";

describe("card text lines", () => {
  it("formats shared type and subtype labels consistently", () => {
    expect(formatCardTypeLine({ type: "ice", subtypes: ["code_gate"] })).toBe(
      "ICE - Code Gate",
    );
    expect(formatCardTerm("event")).toBe("Prep");
  });

  it("keeps the relevant numeric card values in one compact line", () => {
    expect(
      cardMetricLine({
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
