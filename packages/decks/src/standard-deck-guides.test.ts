import { describe, expect, it } from "vitest";

import {
  STANDARD_DECK_GUIDE_SCHEMA_VERSION,
  computeStandardDeckGuideAnalysisHash,
  computeStandardDeckGuideAnalysisInputHash,
  computeStandardDeckGuideSourceHash,
  resolveStandardDeckGuide,
  resolveStandardDeckGuideContent,
  type StandardDeckGuideDeckSource,
  type StandardDeckGuideEntry,
  type StandardDeckGuideManifest,
} from "./standard-deck-guides";

const deck: StandardDeckGuideDeckSource = {
  standardDeckId: "standard_runner_fixture",
  version: "1.0.0",
  name: "Fixture Runner",
  side: "runner",
  identityCardId: "runner_identity_001",
  cards: [
    { cardId: "card_a", quantity: 3 },
    { cardId: "card_b", quantity: 2 },
  ],
};

const analysisHash = computeStandardDeckGuideAnalysisHash({
  primaryStrategies: ["runner.rig_first"],
});
const analysisInputHash = computeStandardDeckGuideAnalysisInputHash({
  deck,
  strategyProfileRevision: "fixture-revision",
});

describe("standard deck guides", () => {
  it("resolves a current, valid guide as available", () => {
    const resolution = resolveStandardDeckGuide({
      deck,
      manifest: manifest([guide()]),
      currentAnalysisHash: analysisHash,
      currentAnalysisInputHash: analysisInputHash,
    });

    expect(resolution).toMatchObject({
      status: "available",
      guide: { standardDeckId: deck.standardDeckId },
      reasons: [],
    });
  });

  it("keeps a missing guide as a non-throwing maintenance state", () => {
    expect(resolveStandardDeckGuide({ deck, manifest: manifest([]) })).toEqual({
      status: "missing",
      reasons: ["standard_deck_guide_missing"],
    });
  });

  it("marks deck and analysis drift as stale without hiding the deck", () => {
    const stale = guide({
      sourceDeckHash: "standard-deck:old",
      sourceAnalysisHash: "deck-analysis:old",
    });

    expect(
      resolveStandardDeckGuide({
        deck,
        manifest: manifest([stale]),
        currentAnalysisHash: analysisHash,
        currentAnalysisInputHash: analysisInputHash,
      }),
    ).toEqual({
      status: "stale",
      reasons: [
        "standard_deck_guide_deck_stale",
        "standard_deck_guide_analysis_stale",
      ],
    });
  });

  it("marks an unverified profile input hash as stale without computing a profile", () => {
    expect(
      resolveStandardDeckGuide({
        deck,
        manifest: manifest([
          guide({ sourceAnalysisInputHash: "deck-analysis-input:old" }),
        ]),
        currentAnalysisInputHash: analysisInputHash,
      }),
    ).toEqual({
      status: "stale",
      reasons: ["standard_deck_guide_analysis_stale"],
    });
  });

  it("marks malformed content and foreign key cards as invalid", () => {
    const invalid = guide();
    invalid.contentByLocale.en.summary = "";
    invalid.contentByLocale.en.keyCards[0]!.cardId = "foreign_card";

    expect(
      resolveStandardDeckGuide({ deck, manifest: manifest([invalid]) }),
    ).toEqual({
      status: "invalid",
      reasons: [
        "standard_deck_guide_key_card_not_in_deck",
        "standard_deck_guide_summary_invalid",
      ],
    });
  });

  it("requires complete English content for every valid guide", () => {
    const invalid = guide();
    delete (invalid.contentByLocale as Record<string, unknown>).en;

    expect(
      resolveStandardDeckGuide({ deck, manifest: manifest([invalid]) }),
    ).toEqual({
      status: "invalid",
      reasons: ["standard_deck_guide_english_content_required"],
    });
  });

  it("resolves exact and base locales before falling back to English", () => {
    const fixture = guide();

    expect(resolveStandardDeckGuideContent(fixture, "de-DE")).toMatchObject({
      locale: "de",
      usedFallback: false,
      content: { summary: "Ein kompaktes Testdeck." },
    });
    expect(resolveStandardDeckGuideContent(fixture, "fr")).toMatchObject({
      locale: "en",
      usedFallback: true,
      content: { summary: "A compact test deck." },
    });
  });

  it("treats a damaged manifest as invalid instead of throwing", () => {
    expect(
      resolveStandardDeckGuide({
        deck,
        manifest: { schemaVersion: "unknown", guides: [] },
      }),
    ).toEqual({
      status: "invalid",
      reasons: ["standard_deck_guide_manifest_schema_invalid"],
    });
  });
});

function guide(
  overrides: Partial<StandardDeckGuideEntry> = {},
): StandardDeckGuideEntry {
  return {
    standardDeckId: deck.standardDeckId,
    sourceDeckVersion: deck.version,
    sourceDeckHash: computeStandardDeckGuideSourceHash(deck),
    sourceAnalysisHash: analysisHash,
    sourceAnalysisInputHash: analysisInputHash,
    reviewedAt: "2026-08-02",
    analysis: {
      primaryStrategyIds: ["runner.rig_first"],
      secondaryStrategyIds: [],
      reviewStatus: "plausible",
    },
    contentByLocale: {
      en: {
        summary: "A compact test deck.",
        deckIdea: "Build the rig first, then increase the pressure.",
        gamePlan: {
          opening: "Secure economy and the basic rig.",
          midgame: "Attack profitable servers.",
          endgame: "Finish through repeated accesses.",
        },
        keyCards: [
          {
            cardId: "card_a",
            title: "Karte A",
            role: "Carries the core game plan.",
          },
        ],
        pilotingTips: ["Do not attack without economy."],
        weaknesses: ["Early pressure can disrupt the setup."],
      },
      de: {
        summary: "Ein kompaktes Testdeck.",
        deckIdea: "Baue zuerst das Rig auf und erhöhe danach den Druck.",
        gamePlan: {
          opening: "Sichere Economy und Grundrig.",
          midgame: "Greife lohnende Server an.",
          endgame: "Schließe über wiederholte Zugriffe ab.",
        },
        keyCards: [
          {
            cardId: "card_a",
            title: "Karte A",
            role: "Trägt den zentralen Spielplan.",
          },
        ],
        pilotingTips: ["Nicht ohne Economy angreifen."],
        weaknesses: ["Früher Druck kann den Aufbau stören."],
      },
    },
    ...overrides,
  };
}

function manifest(guides: StandardDeckGuideEntry[]): StandardDeckGuideManifest {
  return {
    schemaVersion: STANDARD_DECK_GUIDE_SCHEMA_VERSION,
    guideSetId: "fixture-guides",
    catalogId: "fixture-catalog",
    analyzedAt: "2026-08-02",
    guides,
  };
}
