import { afterEach, describe, expect, it } from "vitest";

import {
  resolveParticipantDeckPair,
  resolveParticipantDeckSetup,
  standardDeckGuideRefForSnapshot,
} from "./deck-setup";

const previousRuntimeProfile = process.env.NETGRID_RUNTIME_PROFILE;

afterEach(() => {
  if (previousRuntimeProfile === undefined)
    delete process.env.NETGRID_RUNTIME_PROFILE;
  else process.env.NETGRID_RUNTIME_PROFILE = previousRuntimeProfile;
});

describe("AI deck readiness stages", () => {
  it("rejects test-card snapshots unless the backend explicitly enables them", () => {
    const input = {
      runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
      corpDeckSnapshotId: "demo_corp_008_snapshot_v0_8",
    };

    expect(() => resolveParticipantDeckPair(input)).toThrow(
      "deck_snapshot_card_pool_mismatch",
    );
    expect(
      resolveParticipantDeckPair(input, { allowTestCards: true }).runnerSnapshot
        .deckSnapshotId,
    ).toBe("demo_runner_008_snapshot_v0_8");
  });

  it("cannot activate test-card snapshots in the release profile", () => {
    process.env.NETGRID_RUNTIME_PROFILE = "release";

    expect(() =>
      resolveParticipantDeckPair(
        {
          runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
          corpDeckSnapshotId: "demo_corp_008_snapshot_v0_8",
        },
        { allowTestCards: true },
      ),
    ).toThrow("test_content_forbidden_in_release_profile");
  });

  it("resolves curated standard decks for match start", () => {
    const participants = resolveParticipantDeckSetup(
      {
        participantADecks: {
          runnerDeckSnapshotId:
            "standard_standard_runner_rent_i_con_shellspiel_2026_07_17_1.0.0",
          corpDeckSnapshotId: "standard_standard_corp_cheap_bag_tricks_1.0.0",
        },
        participantBDecks: {
          runnerDeckSnapshotId:
            "standard_standard_runner_bit_denial_lock_1.0.0",
          corpDeckSnapshotId: "standard_standard_corp_cheap_bag_tricks_1.0.0",
        },
      },
      {
        seed: "standard-match-start",
        aiPlayer: "player_b",
        aiDeckPolicy: "selected",
        cardPool: "originalset_classic_proteus",
      },
    );

    expect(participants.player_a.runnerSnapshot.name).toBe(
      "Rent-I-Con: Das Shellspiel",
    );
    expect(participants.player_b.corpSnapshot.name).toBe("Cheap Bag of Tricks");
    expect(
      standardDeckGuideRefForSnapshot(participants.player_a.runnerSnapshot),
    ).toEqual({
      standardDeckId: "standard_runner_rent_i_con_shellspiel_2026_07_17",
    });
    expect(
      standardDeckGuideRefForSnapshot(participants.player_b.corpSnapshot),
    ).toEqual({ standardDeckId: "standard_corp_cheap_bag_tricks" });
  });

  it("does not infer a standard guide from a copied or renamed snapshot", () => {
    const participants = resolveParticipantDeckSetup(
      {
        participantADecks: {
          runnerDeckSnapshotId:
            "standard_standard_runner_bit_denial_lock_1.0.0",
        },
      },
      { seed: "standard-guide-copy-guard" },
    );
    const copied = structuredClone(participants.player_a.runnerSnapshot);
    copied.deckSnapshotId = "account_snapshot_copy";
    copied.name = "My modified copy";

    expect(standardDeckGuideRefForSnapshot(copied)).toBeUndefined();
  });

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
