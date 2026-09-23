import { describe, expect, it } from "vitest";
import standardDeckCatalog from "../../../data/decks/standard-deck-catalog-1.0.0.json";
import { buildDeckStrategyProfile } from "./deck-doctrine-strategy";
import { buildCorpStrategicIntentProfile } from "./corp-strategic-intent";

describe("meta 461 canonical score-support profile", () => {
  it("carries the real Neon Escrow advancement tools through support and strategic intent", () => {
    const deck = standardDeckCatalog.decks.find(
      (entry) => entry.standardDeckId === "standard_corp_neon_escrow",
    )!;
    const profile = buildDeckStrategyProfile({
      deckSnapshotId: "meta-461-neon-escrow",
      side: "corp",
      cards: deck.cards,
    });
    expect(profile.corpProfile?.scoreProfile.scoreAcceleration).toBe(8);
    const acceleration = profile.strategyScores["corp.fast_advance"]!;
    expect(acceleration.supportGaps).not.toContain(
      "low_scoreAcceleration_support",
    );
    expect(acceleration.supportEvidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          cardId: "onr_v1_312_chicago-branch",
          quantity: 2,
          reason: "support:scoreAcceleration",
        }),
        expect.objectContaining({
          cardId: "onr_v1_347_vapor-ops",
          quantity: 3,
          reason: "support:scoreAcceleration",
        }),
      ]),
    );
    const intent = buildCorpStrategicIntentProfile({
      strategyProfile: profile,
    });
    expect(intent.scorePlan).toContain("corp.fast_advance_scoreline");
    expect(intent.evidence).toContain(
      `strategy_score:corp.fast_advance:anchor=${acceleration.anchorScore}:support=${acceleration.supportScore}:final=${acceleration.finalScore}:runtime=productive`,
    );
  });

  it.each([
    "onr_v1_291_falsified-transactions-expert",
    "onr_v1_304_systematic-layoffs",
    "onr_v1_305_team-restructuring",
    "onr_v1_312_chicago-branch",
    "onr_v1_347_vapor-ops",
  ])("counts the generated advancement-support semantics of %s", (cardId) => {
    const profile = buildDeckStrategyProfile({
      deckSnapshotId: `score-support-${cardId}`,
      side: "corp",
      cards: [{ cardId, quantity: 2 }],
    });
    expect(profile.corpProfile?.scoreProfile.scoreAcceleration).toBe(2);
    expect(
      profile.strategyScores["corp.fast_advance"]?.supportGaps,
    ).not.toContain("low_scoreAcceleration_support");
  });

  it("does not treat future overadvance payoffs or ordinary economy as acceleration tools", () => {
    const profile = buildDeckStrategyProfile({
      deckSnapshotId: "score-payoffs-are-not-support",
      side: "corp",
      cards: [
        { cardId: "onr_proteus_007_project-venice", quantity: 2 },
        { cardId: "onr_proteus_008_project-zurich", quantity: 3 },
        { cardId: "onr_v1_281_accounts-receivable", quantity: 2 },
      ],
    });
    expect(profile.corpProfile?.scoreProfile.scoreAcceleration).toBe(0);
    expect(profile.strategyScores["corp.fast_advance"]?.supportGaps).toContain(
      "low_scoreAcceleration_support",
    );
  });
});
