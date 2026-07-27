import { describe, expect, it } from "vitest";

import {
  AccountAuthService,
  TEST_ACCOUNT_PASSWORD_KDF,
} from "./account-password";
import { InMemoryAccountStorage } from "./account-session";
import {
  AccountMatchStatisticsService,
  InMemoryAccountStatisticsStorage,
} from "./account-statistics";
import { createNetgridHttpServer } from "./http-server";
import { loadDeploymentConfig } from "./internet-hardening";
import { InMemoryMatchStorage, MultiplayerService } from "./multiplayer";

const ORIGIN = "http://127.0.0.1:3100";
const PASSWORD = "Eine starke Rejoin-Passphrase 2026";
const SECOND_PASSWORD = "Eine starke zweite Rejoin-Passphrase 2026";

describe("account-bound active-match rejoin HTTP API", () => {
  it("rotates only the bound account slot and rejects token, CSRF, foreign and terminal cases", async () => {
    const accountAuth = new AccountAuthService(new InMemoryAccountStorage(), {
      tokenSalt: "account-rejoin-http",
      passwordKdf: TEST_ACCOUNT_PASSWORD_KDF,
    });
    await accountAuth.bootstrapAdmin({
      loginName: "admin",
      displayName: "Admin",
      password: PASSWORD,
    });
    const accountStatistics = new AccountMatchStatisticsService(
      new InMemoryAccountStatisticsStorage(),
    );
    const handle = createNetgridHttpServer(
      new MultiplayerService(new InMemoryMatchStorage(), {
        tokenSalt: "account-rejoin-http-match",
      }),
      {
        deploymentConfig: loadDeploymentConfig({} as NodeJS.ProcessEnv),
        accountAuth,
        accountStatistics,
      },
    );
    const baseUrl = await listen(handle);
    try {
      const signedIn = await fetch(`${baseUrl}/api/account/login`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: ORIGIN },
        body: JSON.stringify({ loginName: "admin", password: PASSWORD }),
      });
      const auth = (await signedIn.json()) as {
        csrfToken: string;
      };
      const cookie =
        (signedIn.headers.get("set-cookie") ?? "").split(";", 1)[0] ?? "";
      const createdResponse = await fetch(`${baseUrl}/api/matches`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: ORIGIN, cookie },
        body: JSON.stringify({
          hostSide: "runner",
          playMode: "human_vs_ai",
          humanSide: "runner",
          seed: "account-rejoin-http",
          isPublic: true,
        }),
      });
      const created = (await createdResponse.json()) as {
        matchId: string;
        hostSide: "runner" | "corp";
        hostSessionToken: string;
        hostReconnectToken: string;
      };
      expect(createdResponse.status).toBe(201);

      const unauthenticated = await fetch(
        `${baseUrl}/api/account/matches/${encodeURIComponent(created.matchId)}/rejoin`,
        { method: "POST", headers: { origin: ORIGIN } },
      );
      expect(unauthenticated.status).toBe(401);

      const missingCsrf = await fetch(
        `${baseUrl}/api/account/matches/${encodeURIComponent(created.matchId)}/rejoin`,
        { method: "POST", headers: { origin: ORIGIN, cookie } },
      );
      expect(missingCsrf.status).toBe(403);

      const invited = await fetch(`${baseUrl}/api/account/admin/invites`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: ORIGIN,
          cookie,
          "x-netgrid-csrf": auth.csrfToken,
        },
        body: JSON.stringify({
          loginName: "anderer-spieler",
          displayName: "Anderer Spieler",
        }),
      });
      const invite = (await invited.json()) as { inviteToken: string };
      const accepted = await fetch(
        `${baseUrl}/api/account/invites/${encodeURIComponent(invite.inviteToken)}/accept`,
        {
          method: "POST",
          headers: { "content-type": "application/json", origin: ORIGIN },
          body: JSON.stringify({ password: SECOND_PASSWORD }),
        },
      );
      const secondAuth = (await accepted.json()) as { csrfToken: string };
      const secondCookie =
        (accepted.headers.get("set-cookie") ?? "").split(";", 1)[0] ?? "";
      const foreign = await fetch(
        `${baseUrl}/api/account/matches/${encodeURIComponent(created.matchId)}/rejoin`,
        {
          method: "POST",
          headers: {
            origin: ORIGIN,
            cookie: secondCookie,
            "x-netgrid-csrf": secondAuth.csrfToken,
          },
        },
      );
      expect(foreign.status).toBe(404);

      const rejoinResponse = await fetch(
        `${baseUrl}/api/account/matches/${encodeURIComponent(created.matchId)}/rejoin`,
        {
          method: "POST",
          headers: {
            origin: ORIGIN,
            cookie,
            "x-netgrid-csrf": auth.csrfToken,
          },
        },
      );
      const rejoined = (await rejoinResponse.json()) as {
        side: "runner" | "corp";
        sessionToken: string;
        reconnectToken: string;
        playerView: { side: "runner" | "corp" };
      };
      expect(rejoinResponse.status).toBe(200);
      expect(rejoined.side).toBe(created.hostSide);
      expect(rejoined.playerView.side).toBe(created.hostSide);
      expect(rejoined.sessionToken).not.toBe(created.hostSessionToken);
      expect(rejoined.reconnectToken).not.toBe(created.hostReconnectToken);

      const staleReconnect = await fetch(
        `${baseUrl}/api/matches/${encodeURIComponent(created.matchId)}/reconnect`,
        {
          method: "POST",
          headers: { "content-type": "application/json", origin: ORIGIN },
          body: JSON.stringify({
            side: created.hostSide,
            sessionToken: created.hostSessionToken,
            reconnectToken: created.hostReconnectToken,
          }),
        },
      );
      expect(staleReconnect.status).toBe(403);

      const forfeited = await fetch(
        `${baseUrl}/api/matches/${encodeURIComponent(created.matchId)}/forfeit`,
        {
          method: "POST",
          headers: { "content-type": "application/json", origin: ORIGIN },
          body: JSON.stringify({
            side: rejoined.side,
            sessionToken: rejoined.sessionToken,
          }),
        },
      );
      expect(forfeited.status).toBe(200);
      const terminal = await fetch(
        `${baseUrl}/api/account/matches/${encodeURIComponent(created.matchId)}/rejoin`,
        {
          method: "POST",
          headers: {
            origin: ORIGIN,
            cookie,
            "x-netgrid-csrf": auth.csrfToken,
          },
        },
      );
      expect(terminal.status).toBe(404);
    } finally {
      await handle.close();
    }
  });
});

async function listen(
  handle: ReturnType<typeof createNetgridHttpServer>,
): Promise<string> {
  await handle.accountStatisticsReady;
  await new Promise<void>((resolve) =>
    handle.server.listen(0, "127.0.0.1", resolve),
  );
  const address = handle.server.address();
  if (!address || typeof address === "string")
    throw new Error("Missing server address");
  return `http://127.0.0.1:${address.port}`;
}
