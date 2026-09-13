import { describe, expect, it } from "vitest";
import { createTranslator } from "use-intl/core";
import {
  DECK_VALIDATION_ISSUE_PARAMETERS,
  type DeckValidationIssueCode,
  type DeckValidationResult,
} from "@netgrid/decks";
import de from "../messages/de.json";
import en from "../messages/en.json";
import fr from "../messages/fr.json";
import { localizedDeckValidationIssues } from "./deck-validation";

describe("localized structured deck validation", () => {
  it.each([
    ["de", de],
    ["en", en],
    ["fr", fr],
  ] as const)(
    "renders every issue family and exact parameters in %s",
    (locale, messages) => {
      const translate = createTranslator({
        locale,
        messages: messages.Decks.issues,
      });
      expect(Object.keys(messages.Decks.issues).sort()).toEqual(
        Object.keys(DECK_VALIDATION_ISSUE_PARAMETERS).sort(),
      );
      for (const [code, parameters] of Object.entries(
        DECK_VALIDATION_ISSUE_PARAMETERS,
      )) {
        const params = Object.fromEntries(
          parameters.map((name) => [
            name,
            name === "cardId"
              ? "CARD-123"
              : name === "status"
                ? "deck_legal"
                : 7,
          ]),
        );
        const validation: DeckValidationResult = {
          ok: false,
          errors: ["RAW_DIAGNOSTIC_MUST_NOT_RENDER"],
          warnings: [],
          totalCards: 45,
          agendaPoints: 7,
          issues: [
            {
              code: code as DeckValidationIssueCode,
              severity: "error",
              params,
            },
          ],
        };
        const before = JSON.stringify(validation);
        const [message] = localizedDeckValidationIssues(
          JSON.parse(before),
          translate,
        );
        expect(message).not.toContain("RAW_DIAGNOSTIC");
        expect(message).not.toContain("{");
        for (const value of Object.values(params))
          expect(message).toContain(String(value));
        expect(JSON.stringify(validation)).toBe(before);
      }
    },
  );
  it("distinguishes lower and upper agenda bounds and localizes warnings", () => {
    const validation: DeckValidationResult = {
      ok: false,
      errors: ["raw"],
      warnings: ["raw warning"],
      totalCards: 45,
      agendaPoints: 22,
      issues: [
        {
          code: "agenda_points_too_high",
          severity: "error",
          params: { actual: 22, cards: 45, minimum: 20, maximum: 21 },
        },
        { code: "runner_agenda_points", severity: "warning", params: {} },
      ],
    };
    const translate = createTranslator({
      locale: "de",
      messages: de.Decks.issues,
    });
    expect(localizedDeckValidationIssues(validation, translate)).toEqual([
      "Zu viele Agenda-Punkte: 22. Bei 45 Karten sind 20–21 erlaubt.",
      "Das Runner-Deck enthält Agenda-Punkte.",
    ]);
    validation.issues[0]!.code = "agenda_points_too_low";
    expect(localizedDeckValidationIssues(validation, translate)[0]).toContain(
      "Zu wenige Agenda-Punkte",
    );
  });
  it.each([
    "missing_issues",
    "missing_parameter",
    "unknown_code",
    "extra_parameter",
    "wrong_parameter_type",
    "missing_error_issue",
  ])("rejects %s without rendering a raw fallback", (condition) => {
    const validation: any = {
      ok: false,
      errors: ["secret raw diagnostic"],
      warnings: [],
      totalCards: 1,
      agendaPoints: 0,
      issues: [
        {
          code: "minimum_deck_size",
          severity: "error",
          params: { actual: 1, minimum: 40 },
        },
      ],
    };
    if (condition === "missing_issues") delete validation.issues;
    if (condition === "missing_parameter")
      delete validation.issues[0].params.minimum;
    if (condition === "unknown_code") validation.issues[0].code = "unknown";
    if (condition === "extra_parameter")
      validation.issues[0].params.other = "unexpected";
    if (condition === "missing_error_issue") validation.issues = [];
    if (condition === "wrong_parameter_type")
      validation.issues[0].params.minimum = "40";
    expect(() =>
      localizedDeckValidationIssues(validation, () => "must not render"),
    ).toThrowError(
      expect.objectContaining({
        code: "deck_validation_issue_contract_invalid",
      }),
    );
  });
});
