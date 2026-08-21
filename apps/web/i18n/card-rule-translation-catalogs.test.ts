import {
  CLASSIC_CARD_IDS,
  ORIGINALSET_V1_CARD_IDS,
  PROTEUS_CARD_IDS,
  createRuntimeCardsById,
} from "@netgrid/catalog";
import { describe, expect, it } from "vitest";

import {
  CARD_RULE_TRANSLATION_SET_CATALOGS,
  cardRuleTranslationCoverage,
} from "./card-rule-translations";
import { cardRuleTranslationIssues } from "./card-rule-translation-validation";

const expectedIds = {
  "originalset-v1": new Set(ORIGINALSET_V1_CARD_IDS),
  classic: new Set(CLASSIC_CARD_IDS),
  proteus: new Set(PROTEUS_CARD_IDS),
};

describe("card rule translation catalogs", () => {
  it("keeps every partial catalog scoped to its product set", () => {
    for (const [setId, catalogs] of Object.entries(
      CARD_RULE_TRANSLATION_SET_CATALOGS,
    )) {
      for (const [locale, catalog] of Object.entries(catalogs)) {
        for (const definitionId of Object.keys(catalog)) {
          expect(
            expectedIds[setId as keyof typeof expectedIds].has(definitionId),
            `${locale}:${definitionId} must belong to ${setId}`,
          ).toBe(true);
        }
      }
    }
  });

  it("reports the current confirmed coverage without counting fallback text", () => {
    expect(cardRuleTranslationCoverage()).toEqual({ de: 374, fr: 300 });
  });

  it("preserves structural rule tokens in every confirmed translation", () => {
    const cardsById = createRuntimeCardsById();
    for (const catalogs of Object.values(CARD_RULE_TRANSLATION_SET_CATALOGS)) {
      for (const [locale, catalog] of Object.entries(catalogs)) {
        for (const [definitionId, translation] of Object.entries(catalog)) {
          const card = cardsById[definitionId];
          expect(
            card,
            `${definitionId} must exist in the runtime catalog`,
          ).toBeDefined();
          if (!card) throw new Error(`Missing runtime card ${definitionId}.`);
          expect(
            cardRuleTranslationIssues(
              {
                definitionId,
                title: card.title,
                englishRulesText: card.text,
              },
              translation,
            ),
            `${locale}:${definitionId}`,
          ).toEqual([]);
        }
      }
    }
  });
});
