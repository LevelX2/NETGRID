import { describe, expect, it } from "vitest";
import { AccountDeckService, InMemoryAccountDeckStorage } from "./account-decks";
import { AccountAuthService, TEST_ACCOUNT_PASSWORD_KDF } from "./account-password";
import { InMemoryAccountStorage } from "./account-session";
import { AccountMatchStatisticsService, InMemoryAccountStatisticsStorage } from "./account-statistics";
import { createNetgridHttpServer } from "./http-server";
import { loadDeploymentConfig } from "./internet-hardening";
import { InMemoryMatchStorage, MultiplayerService } from "./multiplayer";

const ORIGIN = "http://127.0.0.1:3100";
const PASSWORD = "Eine starke Statistik-Passphrase 2026";

describe("private account statistics HTTP API", () => {
  it("serves only the signed-in account, exports v2 and deletes its statistics", async () => {
    const accountAuth = new AccountAuthService(new InMemoryAccountStorage(), {
      tokenSalt: "account-statistics-http",
      passwordKdf: TEST_ACCOUNT_PASSWORD_KDF,
    });
    await accountAuth.bootstrapAdmin({ loginName: "admin", displayName: "Admin", password: PASSWORD });
    const accountDecks = new AccountDeckService(new InMemoryAccountDeckStorage());
    const accountStatistics = new AccountMatchStatisticsService(new InMemoryAccountStatisticsStorage("2026-07-19T00:00:00.000Z"));
    const handle = createNetgridHttpServer(
      new MultiplayerService(new InMemoryMatchStorage(), { tokenSalt: "account-statistics-http-match" }),
      { deploymentConfig: loadDeploymentConfig({} as NodeJS.ProcessEnv), accountAuth, accountDecks, accountStatistics },
    );
    const baseUrl = await listen(handle);
    try {
      const signedIn = await fetch(`${baseUrl}/api/account/login`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: ORIGIN },
        body: JSON.stringify({ loginName: "admin", password: PASSWORD }),
      });
      const auth = await signedIn.json() as { account: { accountId: string }; csrfToken: string };
      const cookie = (signedIn.headers.get("set-cookie") ?? "").split(";", 1)[0] ?? "";

      const createdResponse = await fetch(`${baseUrl}/api/matches`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: ORIGIN, cookie },
        body: JSON.stringify({ hostSide: "runner", playMode: "human_vs_ai", humanSide: "runner", seed: "account-statistics-http", isPublic: false }),
      });
      const created = await createdResponse.json() as { matchId: string; hostSessionToken: string; hostSide: "runner" | "corp" };
      expect(createdResponse.status).toBe(201);
      expect((await fetch(`${baseUrl}/api/account/statistics`)).status).toBe(401);

      const forfeited = await fetch(`${baseUrl}/api/matches/${encodeURIComponent(created.matchId)}/forfeit`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: ORIGIN },
        body: JSON.stringify({ side: created.hostSide, sessionToken: created.hostSessionToken }),
      });
      expect(forfeited.status).toBe(200);

      expect(
        (await fetch(`${baseUrl}/api/account/recent-results`)).status,
      ).toBe(401);
      const recentResultsResponse = await fetch(
        `${baseUrl}/api/account/recent-results?limit=20`,
        { headers: { cookie } },
      );
      const recentResultsText = await recentResultsResponse.text();
      expect(recentResultsResponse.status).toBe(200);
      expect(recentResultsResponse.headers.get("cache-control")).toBe(
        "no-store",
      );
      expect(JSON.parse(recentResultsText)).toMatchObject({
        schemaVersion: "netgrid-personal-recent-results-v1",
        results: [
          {
            matchId: created.matchId,
            matchStatus: "forfeited",
            isPublic: false,
          },
        ],
      });
      expect(recentResultsText).not.toMatch(
        /sessionToken|reconnectToken|tokenHash|cardInstances|privateDeck/i,
      );
      const publicRecentText = await (
        await fetch(`${baseUrl}/api/matches/recent-results?limit=20`)
      ).text();
      expect(publicRecentText).not.toContain(created.matchId);

      const statisticsResponse = await fetch(`${baseUrl}/api/account/statistics?period=all&opponentKind=ai`, { headers: { cookie } });
      expect(statisticsResponse.status).toBe(200);
      expect(statisticsResponse.headers.get("cache-control")).toBe("no-store");
      expect(await statisticsResponse.json()).toMatchObject({
        schemaVersion: "netgrid-account-statistics-v1",
        statisticsSince: "2026-07-19T00:00:00.000Z",
        totals: { gamesPlayed: 1, wins: 0, losses: 1, forfeitsLost: 1, selfPlay: 0 },
        bySide: { runner: { gamesPlayed: 1, losses: 1 } },
        byOpponentKind: { ai: { gamesPlayed: 1, losses: 1 } },
      });

      const historyResponse = await fetch(`${baseUrl}/api/account/match-history?limit=1`, { headers: { cookie } });
      expect(historyResponse.headers.get("cache-control")).toBe("no-store");
      expect(await historyResponse.json()).toMatchObject({
        schemaVersion: "netgrid-account-match-history-v1",
        entries: [{ matchId: created.matchId, side: "runner", outcome: "loss", finishKind: "forfeit", opponentKind: "ai" }],
      });

      const exported = await fetch(`${baseUrl}/api/account/export`, { headers: { cookie } });
      const exportedText = await exported.text();
      expect(exported.status).toBe(200);
      expect(exported.headers.get("cache-control")).toBe("no-store");
      expect(JSON.parse(exportedText)).toMatchObject({
        schemaVersion: "netgrid-account-export-v2",
        statistics: { schemaVersion: "netgrid-account-statistics-export-v1", games: [{ matchId: created.matchId }] },
      });
      expect(exportedText).not.toContain("opponentAccountId");

      const deleted = await fetch(`${baseUrl}/api/account`, {
        method: "DELETE",
        headers: { "content-type": "application/json", origin: ORIGIN, cookie, "x-netgrid-csrf": auth.csrfToken },
        body: JSON.stringify({ currentPassword: PASSWORD }),
      });
      expect(deleted.status).toBe(200);
      expect(await accountStatistics.gameResultsForAccount(auth.account.accountId)).toEqual([]);
      expect(await accountStatistics.seriesResultsForAccount(auth.account.accountId)).toEqual([]);
    } finally {
      await handle.close();
    }
  });
});

async function listen(handle: ReturnType<typeof createNetgridHttpServer>): Promise<string> {
  await handle.accountStatisticsReady;
  await new Promise<void>((resolve) => handle.server.listen(0, "127.0.0.1", resolve));
  const address = handle.server.address();
  if (!address || typeof address === "string") throw new Error("Missing server address");
  return `http://127.0.0.1:${address.port}`;
}
