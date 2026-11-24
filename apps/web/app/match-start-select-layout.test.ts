import { readFileSync } from "node:fs";
import { createTranslator } from "use-intl/core";
import { describe, expect, it } from "vitest";

import { APP_LOCALES } from "../i18n/locale";
import de from "../messages/de.json";
import en from "../messages/en.json";
import fr from "../messages/fr.json";

const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");

describe("decorated match-start selects", () => {
  it.each(APP_LOCALES)("leads with the deck name in %s", (locale) => {
    const messages = { de, en, fr }[locale].Decks.selection;
    const t = createTranslator({ locale, messages });
    const deck = { name: "Nachtschicht", side: t("side.corp") };
    for (const source of ["standard", "personal"] as const) {
      expect(t(source, deck).split(" · ")[0]).toBe(deck.name);
    }
  });

  it("owns the native appearance so WebKit preserves icon and text spacing", () => {
    expect(css).toMatch(
      /\.sideSelectionControl select,\s*\.deckSlotControl select \{[^}]*-webkit-appearance: none;[^}]*appearance: none;[^}]*padding-right: 36px;/u,
    );
    expect(css).toMatch(
      /\.sideSelectionControl::after,\s*\.deckSlotControl::after \{[^}]*right: 14px;[^}]*pointer-events: none;/u,
    );
    expect(css).toMatch(
      /\.sideSelectionControl select \{[^}]*padding-left: 44px;/u,
    );
    expect(css).toMatch(/\.deckSlotSelect select \{[^}]*padding-left: 34px;/u);
  });
});
