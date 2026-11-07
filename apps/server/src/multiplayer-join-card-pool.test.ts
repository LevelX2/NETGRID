import { describe, expect, it } from "vitest";
import {
  InMemoryMatchStorage,
  MultiplayerService,
  type MatchCardPool,
} from "./multiplayer";
import { assertInviteLobbyPayloadRedacted } from "./invite-lobby-redaction.test-helper";

async function invitation(cardPool: MatchCardPool, isPublic = false) {
  const storage = new InMemoryMatchStorage();
  const service = new MultiplayerService(storage, {
    tokenSalt: "join-card-pool-test",
    allowTestCards: true,
  });
  const created = await service.createMatch({
    hostSide: "runner",
    mode: "human_vs_human",
    seed: "join-card-pool-test",
    isPublic,
    settings: { cardPool },
    participantADecks: {
      runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
      corpDeckSnapshotId: "demo_corp_001_snapshot_v0_6",
    },
  });
  const token = new URL(created.joinUrl!).searchParams.get("joinToken")!;
  return { storage, service, created, token };
}

describe("join-info deck-pool provenance", () => {
  it.each([
    "originalset",
    "originalset_classic",
    "originalset_proteus",
    "originalset_classic_proteus",
  ] as const)(
    "projects only the validated invitation's pool %s",
    async (cardPool) => {
      const { service, created, token } = await invitation(cardPool);
      const info = await service.getJoinInfo(created.matchId, token);
      expect(info).toEqual({
        matchId: created.matchId,
        status: "pending",
        availableSide: "corp",
        cardPool,
      });
      assertInviteLobbyPayloadRedacted(info, "authorized join pool");
      expect(await service.getJoinInfo(created.matchId)).not.toHaveProperty(
        "cardPool",
      );
      expect(
        await service.getJoinInfo(created.matchId, "wrong-token"),
      ).toMatchObject({ code: "invalid_token" });
    },
  );

  it("uses the same open-LAN authorization as joining without a token", async () => {
    const { service, created } = await invitation(
      "originalset_classic_proteus",
      true,
    );
    expect(await service.getJoinInfo(created.matchId)).toMatchObject({
      matchId: created.matchId,
      availableSide: "corp",
      cardPool: "originalset_classic_proteus",
    });
  });

  it("fails closed when an authorized match has lost its canonical pool", async () => {
    const { storage, service, created, token } = await invitation(
      "originalset_proteus",
    );
    const record = (await storage.load(created.matchId))!;
    delete record.match.settings.cardPool;
    await storage.save(record);
    const info = await service.getJoinInfo(created.matchId, token);
    expect(info).toMatchObject({
      code: "server_operation_failed",
      diagnosticCode: "join_info_card_pool_missing",
    });
    expect(info).not.toHaveProperty("cardPool");
    assertInviteLobbyPayloadRedacted(info, "missing canonical pool");
  });
});
