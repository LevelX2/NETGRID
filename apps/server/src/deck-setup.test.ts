import { describe, expect, it } from "vitest";

import { resolveParticipantDeckSetup } from "./deck-setup";

describe("AI deck readiness stages", () => {
  it("allows selected Proteus playtest decks at the approved stage", () => {
    const setup = resolveParticipantDeckSetup(
      {
        participantADecks: {
          runnerDeckSnapshotId: "demo_runner_130_snapshot_v1_3_0",
          corpDeckSnapshotId: "demo_corp_130_snapshot_v1_3_0",
        },
        participantBDecks: {
          runnerDeckSnapshotId:
            "proteus_runner_hq_virus_derez_snapshot_v2026_05_25",
          corpDeckSnapshotId:
            "proteus_corp_region_fast_score_snapshot_v2026_05_25",
        },
      },
      {
        seed: "proteus-selected-readiness",
        aiPlayer: "player_b",
        aiDeckPolicy: "selected",
        cardPool: "originalset_proteus",
      },
    );

    expect(setup.player_b.runnerSnapshot.formatProfileId).toBe(
      "netgrid_private_local_proteus_playtest_v1",
    );
  });

  it("uses Proteus snapshots reproducibly for seeded random in the Proteus pool", () => {
    const options = {
      seed: "proteus-seeded-after-promotion",
      aiPlayer: "player_b" as const,
      aiDeckPolicy: "seeded_random" as const,
      cardPool: "originalset_proteus" as const,
    };
    const first = resolveParticipantDeckSetup({}, options);
    const second = resolveParticipantDeckSetup({}, options);

    expect(first.player_b.runnerSnapshot.deckSnapshotId).toBe(
      second.player_b.runnerSnapshot.deckSnapshotId,
    );
    expect(first.player_b.corpSnapshot.deckSnapshotId).toBe(
      second.player_b.corpSnapshot.deckSnapshotId,
    );
    for (const snapshot of [
      first.player_b.runnerSnapshot,
      first.player_b.corpSnapshot,
    ]) {
      expect(
        snapshot.cards.some((entry) => entry.cardId.startsWith("onr_proteus_")),
      ).toBe(true);
    }
  });

  it.each([
    ["originalset", "", false],
    ["originalset_classic", "onr_classic_", true],
    ["originalset_proteus", "onr_proteus_", true],
    ["originalset_classic_proteus", "onr_proteus_", true],
  ] as const)(
    "uses pool-aware fixed defaults for %s",
    (cardPool, expectedPrefix, expectsExtension) => {
      const setup = resolveParticipantDeckSetup(
        {},
        {
          seed: `fixed-${cardPool}`,
          aiPlayer: "player_b",
          aiDeckPolicy: "fixed",
          cardPool,
        },
      );
      const cards = [
        ...setup.player_b.runnerSnapshot.cards,
        ...setup.player_b.corpSnapshot.cards,
      ];
      expect(
        cards.some(
          (entry) =>
            entry.cardId.startsWith("onr_classic_") ||
            entry.cardId.startsWith("onr_proteus_"),
        ),
      ).toBe(expectsExtension);
      if (expectedPrefix)
        expect(
          cards.some((entry) => entry.cardId.startsWith(expectedPrefix)),
        ).toBe(true);
    },
  );

  it("keeps seeded random within Originalset and combined pool boundaries", () => {
    const original = resolveParticipantDeckSetup(
      {},
      {
        seed: "seeded-originalset-guard",
        aiPlayer: "player_b",
        aiDeckPolicy: "seeded_random",
        cardPool: "originalset",
      },
    );
    const combined = resolveParticipantDeckSetup(
      {},
      {
        seed: "seeded-classic-proteus-guard",
        aiPlayer: "player_b",
        aiDeckPolicy: "seeded_random",
        cardPool: "originalset_classic_proteus",
      },
    );
    expect(
      [original.player_b.runnerSnapshot, original.player_b.corpSnapshot].some(
        (snapshot) =>
          snapshot.cards.some(
            (entry) =>
              entry.cardId.startsWith("onr_classic_") ||
              entry.cardId.startsWith("onr_proteus_"),
          ),
      ),
    ).toBe(false);
    expect(
      [combined.player_b.runnerSnapshot, combined.player_b.corpSnapshot].every(
        (snapshot) => snapshot.validation.ok,
      ),
    ).toBe(true);
  });
});
