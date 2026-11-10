import { describe, expect, it } from "vitest";
import { InMemoryMatchStorage, MultiplayerService } from "./multiplayer";

describe("series participant identity", () => {
  it.each([
    ["account", "two_game_side_swap"],
    ["account", "fixed_pairing_repeat"],
    ["guest", "two_game_side_swap"],
    ["guest", "fixed_pairing_repeat"],
  ] as const)(
    "preserves %s through %s and public results",
    async (identityKind, matchFormat) => {
      const storage = new InMemoryMatchStorage();
      const service = new MultiplayerService(storage, {
        tokenSalt: "series-identity",
      });
      const created = await service.createMatch({
        hostSide: "corp",
        mode: "human_corp_vs_runner_ai",
        identityKind,
        displayName: "Lui",
        seed: "series-identity",
        isPublic: true,
        settings: { matchFormat, seriesGamesPlanned: 2 },
      });
      const first = await service.loadForTest(created.matchId);
      if (!first?.gameState) throw new Error("Missing test match");
      first.match.status = "finished";
      first.gameState.winner = "corp";
      first.gameState.gameEndReason = "agenda_points";
      first.gameState.corp.agendaPoints = 7;
      await storage.save(first);

      const next = await service.startNextSeriesGame(created.matchId, {
        side: "corp",
        sessionToken: created.hostSessionToken,
      });
      if ("error" in next) throw new Error(next.error.message);
      const second = await service.loadForTest(next.matchId);
      if (!second?.gameState) throw new Error("Missing next test match");
      expect(second.match.participantIdentities).toEqual(
        first.match.participantIdentities,
      );
      second.match.status = "finished";
      second.gameState.winner = next.hostSide;
      second.gameState.gameEndReason = "agenda_points";
      second.gameState[next.hostSide].agendaPoints = 7;
      await storage.save(second);
      const entries = await service.listRecentGameResults(20);
      const result = (await service.loadForTest(next.matchId))?.resultSnapshot;
      expect(result?.[next.hostSide].identityKind).toBe(identityKind);
      expect(
        result?.[next.hostSide === "runner" ? "corp" : "runner"].identityKind,
      ).toBe("ai");
      expect(entries).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            entryType: "series",
            players: expect.objectContaining({
              player_a: expect.objectContaining({ identityKind }),
            }),
          }),
        ]),
      );
      expect(JSON.stringify(result)).not.toContain("accountId");
      expect(JSON.stringify(result)).not.toContain("sessionToken");
    },
  );
});
