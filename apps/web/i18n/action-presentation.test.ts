import { describe, expect, it } from "vitest";

import {
  ACTION_PRESENTATION_SCOPE,
  actionPresentationNoun,
  actionPresentationText,
  normalizeActionPresentationLocale,
} from "./action-presentation";

describe("action presentation localization contract", () => {
  it.each([
    ["de", "Credit nehmen", "Zug beenden"],
    ["en", "Take credit", "End turn"],
    ["fr", "Prendre un crédit", "Terminer le tour"],
  ] as const)("renders core actions in %s", (locale, credit, endTurn) => {
    expect(actionPresentationText(locale, "actionGainCredit")).toBe(credit);
    expect(actionPresentationText(locale, "actionEndTurn")).toBe(endTurn);
  });

  it("falls back to English for missing or unsupported locales", () => {
    expect(normalizeActionPresentationLocale(undefined)).toBe("en");
    expect(normalizeActionPresentationLocale("es")).toBe("en");
    expect(actionPresentationText("es", "actionDrawCard")).toBe("Draw card");
  });

  it("interpolates structured values and fails closed when one is missing", () => {
    expect(actionPresentationText("fr", "actionRunOn", { server: "R&D" })).toBe(
      "Pirater R&D",
    );
    expect(() => actionPresentationText("en", "actionRunOn")).toThrow(
      /Missing action-presentation value "server"/,
    );
  });

  it("handles localized singular and plural nouns", () => {
    expect(actionPresentationNoun("de", "credit", 1)).toBe("Credit");
    expect(actionPresentationNoun("en", "credit", 2)).toBe("credits");
    expect(actionPresentationNoun("fr", "action", 2)).toBe("actions");
  });

  it("keeps the complete in-scope presentation inventory explicit", () => {
    expect(ACTION_PRESENTATION_SCOPE.actionLabels).toContain(
      "runAwareActionButtonLabel",
    );
    expect(ACTION_PRESENTATION_SCOPE.tooltips).toContain(
      "counterDisplayTooltipText",
    );
    expect(ACTION_PRESENTATION_SCOPE.adjacentPresentation).toContain(
      "runnerProgramInstallTrashChoiceInfo",
    );
  });
});
