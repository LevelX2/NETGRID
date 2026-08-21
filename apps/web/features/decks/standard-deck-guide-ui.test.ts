import { describe, expect, it } from "vitest";

import type { StandardDeckGuideEntry } from "@netgrid/decks";
import {
  attachStandardDeckGuides,
  standardDeckGuideControlState,
} from "./standard-deck-guide-ui";

describe("standard deck guide selection UI", () => {
  it("shows an actionable guide only for a current fixed standard", () => {
    const guide = fixtureGuide();
    expect(
      standardDeckGuideControlState({
        source: "snapshot",
        snapshot: {
          deckSnapshotId: "snapshot",
          name: "Standard",
          guideStatus: "available",
          guide,
        },
      }),
    ).toMatchObject({
      label: "Deck-Anleitung",
      disabled: false,
      status: "available",
      guide,
    });
    expect(standardDeckGuideControlState({ source: "local" })).toBeNull();
    expect(
      standardDeckGuideControlState({ source: "random_standard" }),
    ).toBeNull();
  });

  it("distinguishes missing and update-required maintenance states", () => {
    expect(
      standardDeckGuideControlState({
        source: "snapshot",
        snapshot: {
          deckSnapshotId: "missing",
          name: "Missing",
          guideStatus: "missing",
        },
      }),
    ).toMatchObject({
      label: "Anleitung fehlt noch",
      disabled: true,
      status: "missing",
    });
    for (const status of ["stale", "invalid"] as const) {
      expect(
        standardDeckGuideControlState({
          source: "snapshot",
          snapshot: {
            deckSnapshotId: status,
            name: status,
            guideStatus: status,
          },
        }),
      ).toMatchObject({
        label: "Anleitung muss aktualisiert werden",
        disabled: true,
        status,
      });
    }
  });

  it("joins guide metadata by stable standard id and defaults to missing", () => {
    const guide = fixtureGuide();
    const attached = attachStandardDeckGuides(
      [
        {
          deckSnapshotId: "snapshot_current",
          sourceDeckId: "standard_current",
          name: "Current",
        },
        {
          deckSnapshotId: "snapshot_new",
          sourceDeckId: "standard_new",
          name: "New",
        },
      ],
      [
        {
          standardDeckId: "standard_current",
          guideStatus: "available" as const,
          guide,
        },
      ],
    );
    expect(attached[0]).toMatchObject({ guideStatus: "available", guide });
    expect(attached[1]).toMatchObject({ guideStatus: "missing" });
  });
});

function fixtureGuide(): StandardDeckGuideEntry {
  return {
    standardDeckId: "standard_current",
    sourceDeckVersion: "1.0.0",
    sourceDeckHash: "standard-deck:test",
    sourceAnalysisHash: "deck-analysis:test",
    reviewedAt: "2026-08-02",
    analysis: {
      primaryStrategyIds: ["runner.rig_first"],
      secondaryStrategyIds: [],
      reviewStatus: "plausible",
    },
    contentByLocale: {
      en: {
        summary: "Summary",
        deckIdea: "Deck idea",
        gamePlan: {
          opening: "Opening",
          midgame: "Midgame",
          endgame: "Endgame",
        },
        keyCards: [],
        noDistinctKeyCardsReason: "No individual anchors.",
        pilotingTips: ["Tip"],
        weaknesses: ["Weakness"],
      },
      de: {
        summary: "Zusammenfassung",
        deckIdea: "Deckidee",
        gamePlan: {
          opening: "Eröffnung",
          midgame: "Mittelspiel",
          endgame: "Endphase",
        },
        keyCards: [],
        noDistinctKeyCardsReason: "Keine einzelnen Anker.",
        pilotingTips: ["Tipp"],
        weaknesses: ["Schwäche"],
      },
    },
  };
}
