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

  it("keeps seeded random on approved pool entries before Proteus promotion", () => {
    const setup = resolveParticipantDeckSetup(
      {},
      {
        seed: "proteus-seeded-before-promotion",
        aiPlayer: "player_b",
        aiDeckPolicy: "seeded_random",
        cardPool: "originalset_proteus",
      },
    );

    expect(
      setup.player_b.runnerSnapshot.cards.some((entry) =>
        entry.cardId.startsWith("onr_proteus_"),
      ),
    ).toBe(false);
    expect(
      setup.player_b.corpSnapshot.cards.some((entry) =>
        entry.cardId.startsWith("onr_proteus_"),
      ),
    ).toBe(false);
  });
});
