import { describe, expect, it } from "vitest";

import { tooltipCardRulesText } from "./card-rule-translations";

describe("translated card rules in text tooltips", () => {
  const englishRulesText =
    "Whenever you make a successful run, put a Pattel counter on a piece of ice.";

  it("keeps canonical rules text while translation is disabled", () => {
    expect(
      tooltipCardRulesText({
        definitionId: "onr_v1_046_pattels-virus",
        englishRulesText,
        locale: "de",
        translateToSelectedLanguage: false,
      }),
    ).toBe(englishRulesText);
  });

  it("selects confirmed German and French rules by definition id", () => {
    expect(
      tooltipCardRulesText({
        definitionId: "onr_v1_046_pattels-virus",
        englishRulesText,
        locale: "de",
        translateToSelectedLanguage: true,
      }),
    ).toContain("erfolgreichen Run");
    expect(
      tooltipCardRulesText({
        definitionId: "onr_v1_046_pattels-virus",
        englishRulesText,
        locale: "fr",
        translateToSelectedLanguage: true,
      }),
    ).toContain("piratage");
  });

  it("falls back to English for unsupported locales or missing translations", () => {
    expect(
      tooltipCardRulesText({
        definitionId: "onr_v1_046_pattels-virus",
        englishRulesText,
        locale: "es",
        translateToSelectedLanguage: true,
      }),
    ).toBe(englishRulesText);
    expect(
      tooltipCardRulesText({
        definitionId: "card_without_translation",
        englishRulesText,
        locale: "fr",
        translateToSelectedLanguage: true,
      }),
    ).toBe(englishRulesText);
  });
});
