import { isAppLocale, type AppLocale } from "./locale";

import classicDe from "./card-rule-translations/classic.de.json";
import classicFr from "./card-rule-translations/classic.fr.json";
import originalsetDe from "./card-rule-translations/originalset-v1.de.json";
import originalsetFr from "./card-rule-translations/originalset-v1.fr.json";
import proteusDe from "./card-rule-translations/proteus.de.json";
import proteusFr from "./card-rule-translations/proteus.fr.json";

export type CardRuleTranslationLocale = Exclude<AppLocale, "en">;
export type CardRuleTranslationCatalog = Readonly<Record<string, string>>;

/**
 * Confirmed display translations only. Card titles, types and mechanical data
 * deliberately stay outside this catalog. Missing entries fall back to the
 * canonical English rules text supplied by the sanitized card presentation.
 */
export const CARD_RULE_TRANSLATION_CATALOGS: Readonly<
  Record<CardRuleTranslationLocale, CardRuleTranslationCatalog>
> = {
  de: {
    ...originalsetDe,
    ...classicDe,
    ...proteusDe,
  },
  fr: {
    ...originalsetFr,
    ...classicFr,
    ...proteusFr,
  },
};

export const CARD_RULE_TRANSLATION_SET_CATALOGS: Readonly<
  Record<
    "originalset-v1" | "classic" | "proteus",
    Readonly<Record<CardRuleTranslationLocale, CardRuleTranslationCatalog>>
  >
> = {
  "originalset-v1": { de: originalsetDe, fr: originalsetFr },
  classic: { de: classicDe, fr: classicFr },
  proteus: { de: proteusDe, fr: proteusFr },
};

export function cardRuleTranslationCoverage(): Readonly<
  Record<CardRuleTranslationLocale, number>
> {
  return {
    de: Object.keys(CARD_RULE_TRANSLATION_CATALOGS.de).length,
    fr: Object.keys(CARD_RULE_TRANSLATION_CATALOGS.fr).length,
  };
}

function translatedRulesText(
  definitionId: string,
  locale: CardRuleTranslationLocale,
): string | undefined {
  return CARD_RULE_TRANSLATION_CATALOGS[locale][definitionId];
}

export function tooltipCardRulesText({
  definitionId,
  englishRulesText,
  locale,
  translateToSelectedLanguage,
}: {
  definitionId: string | null | undefined;
  englishRulesText: string;
  locale: unknown;
  translateToSelectedLanguage: boolean;
}): string {
  if (!translateToSelectedLanguage) return englishRulesText;
  const selectedLocale: AppLocale = isAppLocale(locale) ? locale : "en";
  if (selectedLocale === "en" || !definitionId) return englishRulesText;
  return translatedRulesText(definitionId, selectedLocale) ?? englishRulesText;
}
