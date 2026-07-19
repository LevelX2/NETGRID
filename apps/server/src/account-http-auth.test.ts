import { describe, expect, it } from "vitest";
import {
  AccountAuthService,
  TEST_ACCOUNT_PASSWORD_KDF,
} from "./account-password";
import { InMemoryAccountStorage } from "./account-session";
import { createNetgridHttpServer } from "./http-server";
import { loadDeploymentConfig } from "./internet-hardening";
import { InMemoryMatchStorage, MultiplayerService } from "./multiplayer";
import {
  AccountMatchStatisticsService,
  InMemoryAccountStatisticsStorage,
} from "./account-statistics";

const ORIGIN = "http://127.0.0.1:3100";
const ADMIN_PASSWORD = "Eine starke Admin-Passphrase 2026";

describe("closed account HTTP API", () => {
  it("keeps login neutral and enforces HttpOnly cookie, origin, CSRF, admin invite and one-time acceptance", async () => {
    const accountAuth = new AccountAuthService(new InMemoryAccountStorage(), {
      tokenSalt: "account-http-test-salt",
      passwordKdf: TEST_ACCOUNT_PASSWORD_KDF,
    });
    await accountAuth.bootstrapAdmin({
      loginName: "admin",
      displayName: "Admin",
      password: ADMIN_PASSWORD,
    });
    const matchStorage = new InMemoryMatchStorage();
    const accountStatistics = new AccountMatchStatisticsService(
      new InMemoryAccountStatisticsStorage(),
      { now: () => "2026-07-19T00:00:00.000Z" },
    );
    const handle = createNetgridHttpServer(
      new MultiplayerService(matchStorage, {
        tokenSalt: "account-http-match-salt",
      }),
      {
        deploymentConfig: loadDeploymentConfig({} as NodeJS.ProcessEnv),
        accountAuth,
        accountStatistics,
      },
    );
    const baseUrl = await listen(handle);
    try {
      const unknown = await login(
        baseUrl,
        "unbekannt",
        "Falsche geheime Passphrase 2026",
      );
      const wrong = await login(
        baseUrl,
        "admin",
        "Falsche geheime Passphrase 2026",
      );
      expect(unknown.status).toBe(401);
      expect(wrong.status).toBe(401);
      expect(await unknown.json()).toEqual(await wrong.json());

      const signedIn = await login(baseUrl, "admin", ADMIN_PASSWORD);
      const signedInText = await signedIn.text();
      const signedInPayload = JSON.parse(signedInText) as {
        csrfToken: string;
        account: { accountId: string; role: string };
      };
      const setCookie = signedIn.headers.get("set-cookie") ?? "";
      const cookie = setCookie.split(";", 1)[0] ?? "";
      expect(signedIn.status).toBe(200);
      expect(setCookie).toMatch(
        /^ng_account_session=[^;]+; HttpOnly; SameSite=Lax; Path=\/; Max-Age=1209600$/,
      );
      expect(signedInPayload.account.role).toBe("admin");
      expect(signedInText).not.toContain(ADMIN_PASSWORD);
      expect(signedInText).not.toContain("sessionToken");
      expect(signedInText).not.toContain("TokenHash");

      const firstRestoredSession = await fetch(
        `${baseUrl}/api/account/session`,
        { headers: { cookie } },
      );
      const secondRestoredSession = await fetch(
        `${baseUrl}/api/account/session`,
        { headers: { cookie } },
      );
      const firstRestoredPayload = (await firstRestoredSession.json()) as {
        csrfToken: string;
        account: { loginName: string; role: string };
      };
      const secondRestoredPayload = (await secondRestoredSession.json()) as {
        csrfToken: string;
      };
      expect(firstRestoredSession.status).toBe(200);
      expect(secondRestoredSession.status).toBe(200);
      expect(firstRestoredPayload.csrfToken).toBe(signedInPayload.csrfToken);
      expect(secondRestoredPayload.csrfToken).toBe(signedInPayload.csrfToken);

      const noCsrf = await fetch(`${baseUrl}/api/account/admin/invites`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: ORIGIN, cookie },
        body: JSON.stringify({
          loginName: "runner-one",
          displayName: "Runner Eins",
        }),
      });
      expect(noCsrf.status).toBe(403);

      const foreignOrigin = await fetch(`${baseUrl}/api/account/logout`, {
        method: "POST",
        headers: {
          origin: "https://attacker.example",
          cookie,
          "x-netgrid-csrf": signedInPayload.csrfToken,
        },
      });
      expect(foreignOrigin.status).toBe(403);

      const invited = await fetch(`${baseUrl}/api/account/admin/invites`, {
        method: "POST",
        headers: authHeaders(cookie, signedInPayload.csrfToken),
        body: JSON.stringify({
          loginName: "runner-one",
          displayName: "Runner Eins",
        }),
      });
      expect(invited.status).toBe(201);
      const invitePayload = (await invited.json()) as { inviteToken: string };

      const accepted = await fetch(
        `${baseUrl}/api/account/invites/${invitePayload.inviteToken}/accept`,
        {
          method: "POST",
          headers: { "content-type": "application/json", origin: ORIGIN },
          body: JSON.stringify({
            password: "Sehr sichere Runner Passphrase 2026",
          }),
        },
      );
      expect(accepted.status).toBe(200);
      const acceptedText = await accepted.text();
      expect(acceptedText).not.toContain(invitePayload.inviteToken);
      expect(
        (
          await fetch(
            `${baseUrl}/api/account/invites/${invitePayload.inviteToken}`,
          )
        ).status,
      ).toBe(404);

      expect(firstRestoredPayload).toMatchObject({
        account: { loginName: "admin", role: "admin" },
      });

      const createdMatch = await fetch(`${baseUrl}/api/matches`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: ORIGIN, cookie },
        body: JSON.stringify({
          hostSide: "runner",
          playMode: "human_vs_ai",
          humanSide: "runner",
          displayName: "Manipulierter Gastname",
          seed: "account-name-is-authoritative",
        }),
      });
      expect(createdMatch.status).toBe(201);
      const storedMatch = (await matchStorage.list()).find(
        (record) => record.match.seed === "account-name-is-authoritative",
      );
      expect(storedMatch?.sessions[0]?.displayName).toBe("Admin");
      expect(storedMatch?.match.participantIdentities).toEqual({
        player_a: "account",
      });
      expect(
        await accountStatistics.bindingsForMatch(
          storedMatch?.match.matchId ?? "",
        ),
      ).toEqual([
        expect.objectContaining({
          participantSlot: "player_a",
          accountId: signedInPayload.account.accountId,
          bindingSource: "authenticated_create",
        }),
      ]);
      expect(JSON.stringify(storedMatch)).not.toContain(
        signedInPayload.account.accountId,
      );

      const guestLobby = await fetch(`${baseUrl}/api/matches`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: ORIGIN },
        body: JSON.stringify({
          hostSide: "runner",
          mode: "human_vs_human",
          displayName: "Gastgeber",
          seed: "account-join-name-is-authoritative",
        }),
      });
      expect(guestLobby.status).toBe(201);
      const guestLobbyPayload = (await guestLobby.json()) as {
        joinUrl: string;
      };
      const guestLobbyUrl = new URL(guestLobbyPayload.joinUrl);
      const joined = await fetch(
        `${baseUrl}/api/matches/${encodeURIComponent(guestLobbyUrl.searchParams.get("matchId") ?? "")}/join`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: ORIGIN,
            cookie,
          },
          body: JSON.stringify({
            token: guestLobbyUrl.searchParams.get("joinToken"),
            displayName: "Manipulierter Beitrittsname",
          }),
        },
      );
      expect(joined.status).toBe(200);
      const joinedMatch = (await matchStorage.list()).find(
        (record) => record.match.seed === "account-join-name-is-authoritative",
      );
      expect(joinedMatch?.sessions[1]?.displayName).toBe("Admin");
      expect(joinedMatch?.match.participantIdentities).toEqual({
        player_a: "guest",
        player_b: "account",
      });
      expect(
        await accountStatistics.bindingsForMatch(
          joinedMatch?.match.matchId ?? "",
        ),
      ).toEqual([
        expect.objectContaining({
          participantSlot: "player_b",
          accountId: signedInPayload.account.accountId,
          bindingSource: "authenticated_join",
        }),
      ]);

      const loggedOut = await fetch(`${baseUrl}/api/account/logout`, {
        method: "POST",
        headers: authHeaders(cookie, firstRestoredPayload.csrfToken),
      });
      expect(loggedOut.status).toBe(200);
      expect(
        (await fetch(`${baseUrl}/api/account/session`, { headers: { cookie } }))
          .status,
      ).toBe(401);
    } finally {
      await handle.close();
    }
  });

  it("creates one-time admin resets, revokes existing sessions and uses Secure cookies in private internet", async () => {
    const accountAuth = new AccountAuthService(new InMemoryAccountStorage(), {
      tokenSalt: "account-http-private-salt",
      passwordKdf: TEST_ACCOUNT_PASSWORD_KDF,
    });
    await accountAuth.bootstrapAdmin({
      loginName: "admin",
      displayName: "Admin",
      password: ADMIN_PASSWORD,
    });
    const deploymentConfig = loadDeploymentConfig({
      NETGRID_DEPLOYMENT_PROFILE: "private_internet",
      NETGRID_WEB_BASE_URL: "https://play.netgrid.example",
      NETGRID_SERVER_BASE_URL: "https://api.netgrid.example",
      NETGRID_ALLOWED_ORIGINS: "https://play.netgrid.example",
      NETGRID_TOKEN_SALT: "private-account-http-salt",
    } as NodeJS.ProcessEnv);
    const handle = createNetgridHttpServer(
      new MultiplayerService(new InMemoryMatchStorage()),
      { deploymentConfig, accountAuth },
    );
    const baseUrl = await listen(handle);
    try {
      const signedIn = await login(
        baseUrl,
        "admin",
        ADMIN_PASSWORD,
        "https://play.netgrid.example",
      );
      const payload = (await signedIn.json()) as { csrfToken: string };
      const setCookie = signedIn.headers.get("set-cookie") ?? "";
      const cookie = setCookie.split(";", 1)[0] ?? "";
      expect(setCookie).toContain("; Secure");

      const reset = await fetch(`${baseUrl}/api/account/admin/resets`, {
        method: "POST",
        headers: authHeaders(
          cookie,
          payload.csrfToken,
          "https://play.netgrid.example",
        ),
        body: JSON.stringify({ loginName: "admin" }),
      });
      expect(reset.status).toBe(201);
      const resetPayload = (await reset.json()) as { resetToken: string };
      const accepted = await fetch(
        `${baseUrl}/api/account/resets/${resetPayload.resetToken}/accept`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "https://play.netgrid.example",
          },
          body: JSON.stringify({
            newPassword: "Noch sicherere Admin Passphrase 2026",
          }),
        },
      );
      expect(accepted.status).toBe(200);
      expect(
        (await fetch(`${baseUrl}/api/account/session`, { headers: { cookie } }))
          .status,
      ).toBe(401);
      expect(
        (
          await login(
            baseUrl,
            "admin",
            ADMIN_PASSWORD,
            "https://play.netgrid.example",
          )
        ).status,
      ).toBe(401);
      expect(
        (
          await login(
            baseUrl,
            "admin",
            "Noch sicherere Admin Passphrase 2026",
            "https://play.netgrid.example",
          )
        ).status,
      ).toBe(200);
      expect(
        (
          await fetch(
            `${baseUrl}/api/account/resets/${resetPayload.resetToken}/accept`,
            {
              method: "POST",
              headers: {
                "content-type": "application/json",
                origin: "https://play.netgrid.example",
              },
              body: JSON.stringify({
                newPassword: "Dritte sichere Admin Passphrase 2026",
              }),
            },
          )
        ).status,
      ).toBe(404);
    } finally {
      await handle.close();
    }
  });
});

function login(
  baseUrl: string,
  loginName: string,
  password: string,
  origin = ORIGIN,
): Promise<Response> {
  return fetch(`${baseUrl}/api/account/login`, {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify({ loginName, password }),
  });
}

function authHeaders(
  cookie: string,
  csrfToken: string,
  origin = ORIGIN,
): Record<string, string> {
  return {
    "content-type": "application/json",
    origin,
    cookie,
    "x-netgrid-csrf": csrfToken,
  };
}

async function listen(
  handle: ReturnType<typeof createNetgridHttpServer>,
): Promise<string> {
  await new Promise<void>((resolve) =>
    handle.server.listen(0, "127.0.0.1", resolve),
  );
  const address = handle.server.address();
  if (!address || typeof address === "string")
    throw new Error("Missing server address");
  return `http://127.0.0.1:${address.port}`;
}
