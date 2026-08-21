import { isAppLocale, type AppLocale } from "./locale";

type CardRuleTranslations = Readonly<
  Record<string, Readonly<Partial<Record<AppLocale, string>>>>
>;

/**
 * Confirmed display translations only. Card titles, types and mechanical data
 * deliberately stay outside this catalog. Missing entries fall back to the
 * canonical English rules text supplied by the sanitized card presentation.
 */
export const CARD_RULE_TRANSLATIONS: CardRuleTranslations = {
  "onr_v1_046_pattels-virus": {
    de: "Immer wenn du einen erfolgreichen Run durchführst, lege einen Pattel-Counter auf ein ICE, dessen sämtliche Subroutinen während dieses Runs gebrochen wurden. Jeder Pattel-Counter auf einem ICE reduziert dessen Stärke um 1. Die Korp kann alle Virus-Counter entfernen, indem sie ihre nächsten drei Aktionen aussetzt.",
    fr: "Chaque fois que vous réussissez un piratage, placez un pion Pattel sur une glace dont toutes les routines ont été neutralisées pendant ce piratage. Chaque pion Pattel sur une glace réduit sa force de 1. La Corpo peut retirer tous les pions Virus en renonçant à ses trois prochaines actions.",
  },
  "onr_v1_234_data-darts": {
    de: "[Subroutine] Verursache 3 Netzwerkschaden.\n[Subroutine] Der Runner kann keine Subroutinen des nächsten ICE brechen, dem er während dieses Runs begegnet.",
    fr: "[Subroutine] Infligez 3 dégâts réseau.\n[Subroutine] Le Runner ne peut neutraliser aucune routine de la prochaine glace rencontrée pendant ce piratage.",
  },
  "onr_v1_257_nerve-labyrinth": {
    de: "[Subroutine] Verursache 2 Netzwerkschaden.\n[Subroutine] Beende den Run.",
    fr: "[Subroutine] Infligez 2 dégâts réseau.\n[Subroutine] Mettez fin au piratage.",
  },
  "onr_v1_290_efficiency-experts": {
    de: "Erhalte 3 Credits.",
    fr: "Gagnez 3 crédits.",
  },
};

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
  return (
    CARD_RULE_TRANSLATIONS[definitionId]?.[selectedLocale] ?? englishRulesText
  );
}
