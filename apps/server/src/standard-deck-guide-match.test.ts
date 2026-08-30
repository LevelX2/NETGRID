import { describe, expect, it } from "vitest";

import { InMemoryMatchStorage, MultiplayerService } from "./multiplayer";

describe("standard deck guide match projection", () => {
  it("keeps each standard guide reference own-only across join and reconnect", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "standard-guide-match-projection",
    });
    const created = await service.createMatch({
      hostSide: "runner",
      seed: "standard-guide-match-projection",
      participantADecks: {
        runnerDeckSnapshotId:
          "standard_standard_runner_rent_i_con_shellspiel_2026_07_17_1.0.0",
        corpDeckSnapshotId: "standard_standard_corp_cheap_bag_tricks_1.0.0",
      },
      participantBDecks: {
        runnerDeckSnapshotId: "standard_standard_runner_bit_denial_lock_1.0.0",
        corpDeckSnapshotId: "standard_standard_corp_chrome_rush_bureau_1.1.0",
      },
      settings: { cardPool: "originalset_classic_proteus" },
    });

    expect(created.playerView.ownDeckGuideRef).toEqual({
      standardDeckId: "standard_runner_rent_i_con_shellspiel_2026_07_17",
    });
    expect(created.playerView).not.toHaveProperty("opponentDeckGuideRef");
    expect(created.playerView.deckMetadata?.opponent).not.toHaveProperty(
      "standardDeckId",
    );
    expect(JSON.stringify(created.playerView)).not.toContain("contentByLocale");

    const joinToken = new URL(created.joinUrl ?? "").searchParams.get(
      "joinToken",
    );
    if (!joinToken) throw new Error("Missing join token");
    const joined = await service.joinMatch(created.matchId, {
      token: joinToken,
      displayName: "Corp",
    });
    if ("error" in joined) throw new Error(joined.error.message);
    expect(joined.playerView.ownDeckGuideRef).toEqual({
      standardDeckId: "standard_corp_chrome_rush_bureau",
    });
    expect(joined.playerView).not.toHaveProperty("opponentDeckGuideRef");
    expect(joined.playerView.deckMetadata?.opponent).not.toHaveProperty(
      "standardDeckId",
    );

    const reconnected = await service.reconnectMatch(created.matchId, {
      side: "runner",
      sessionToken: created.hostSessionToken,
      reconnectToken: created.hostReconnectToken,
    });
    if ("error" in reconnected) throw new Error(reconnected.error.message);
    expect(reconnected.playerView.ownDeckGuideRef).toEqual(
      created.playerView.ownDeckGuideRef,
    );
  });
});
