import { describe, expect, it } from "vitest";
import {
  AccountDeckService,
  InMemoryAccountDeckStorage,
} from "./account-decks";
import {
  AccountMatchStartPreferenceService,
  InMemoryAccountMatchStartPreferenceStorage,
  ACCOUNT_MATCH_START_PREFERENCES_SCHEMA_VERSION,
  type AccountMatchStartPreferences,
} from "./account-match-start-preferences";
import {
  AccountAuthService,
  TEST_ACCOUNT_PASSWORD_KDF,
} from "./account-password";
import { InMemoryAccountStorage } from "./account-session";
import { createNetgridHttpServer } from "./http-server";
import { loadDeploymentConfig } from "./internet-hardening";
import { InMemoryMatchStorage, MultiplayerService } from "./multiplayer";

const ORIGIN = "http://127.0.0.1:3100";
const PASSWORD_A = "Sichere Alpha Passphrase 2026";
const PASSWORD_B = "Sichere Beta Passphrase 2026";

describe("account match-start preferences HTTP API", () => {
  it("keeps preferences private, validates deck ownership and supports reset/export/deletion", async () => {
    const accountAuth = new AccountAuthService(new InMemoryAccountStorage(), {
      tokenSalt: "match-start-preferences-http",
      passwordKdf: TEST_ACCOUNT_PASSWORD_KDF,
    });
    await accountAuth.bootstrapAdmin({
      loginName: "alpha",
      displayName: "Alpha",
      password: PASSWORD_A,
    });
    await accountAuth.createAccountWithPassword({
      loginName: "beta",
      displayName: "Beta",
      password: PASSWORD_B,
    });
    const accountDecks = new AccountDeckService(
      new InMemoryAccountDeckStorage(),
    );
    const preferences = new AccountMatchStartPreferenceService(
      new InMemoryAccountMatchStartPreferenceStorage(),
      accountDecks,
      { now: () => "2026-07-27T18:00:00.000Z" },
    );
    const handle = createNetgridHttpServer(
      new MultiplayerService(new InMemoryMatchStorage(), {
        tokenSalt: "match-start-preferences-match",
      }),
      {
        deploymentConfig: loadDeploymentConfig({} as NodeJS.ProcessEnv),
        accountAuth,
        accountDecks,
        accountMatchStartPreferences: preferences,
      },
    );
    const baseUrl = await listen(handle);
    try {
      const alpha = await login(baseUrl, "alpha", PASSWORD_A);
      const beta = await login(baseUrl, "beta", PASSWORD_B);
      const preflight = await fetch(
        `${baseUrl}/api/account/match-start-preferences`,
        {
          method: "OPTIONS",
          headers: {
            origin: ORIGIN,
            "access-control-request-method": "PUT",
            "access-control-request-headers": "content-type,x-netgrid-csrf",
          },
        },
      );
      expect(preflight.status).toBe(204);
      expect(preflight.headers.get("access-control-allow-methods")).toContain(
        "PUT",
      );
      expect(preflight.headers.get("access-control-allow-methods")).toContain(
        "DELETE",
      );
      const standards = accountDecks.listStandards();
      const runner = standards.find((deck) => deck.side === "runner")!;
      const corp = standards.find((deck) => deck.side === "corp")!;
      const copiedCorp = await accountDecks.copyStandard(
        alpha.accountId,
        corp.standardDeckId,
      );
      const saved = preferencesFor({
        runnerDeck: { kind: "standard", standardDeckId: runner.standardDeckId },
        corpDeck: { kind: "account", cloudDeckId: copiedCorp.cloudDeckId },
      });

      expect(
        (await fetch(`${baseUrl}/api/account/match-start-preferences`)).status,
      ).toBe(401);
      expect(
        (
          await fetch(`${baseUrl}/api/account/match-start-preferences`, {
            method: "PUT",
            headers: { cookie: alpha.cookie, origin: ORIGIN },
            body: JSON.stringify({ preferences: saved }),
          })
        ).status,
      ).toBe(403);

      const savedResponse = await fetch(
        `${baseUrl}/api/account/match-start-preferences`,
        {
          method: "PUT",
          headers: authHeaders(alpha),
          body: JSON.stringify({
            preferences: { ...saved, ignoredSensitiveField: "not persisted" },
          }),
        },
      );
      const savedText = await savedResponse.text();
      expect(savedResponse.status).toBe(200);
      expect(savedResponse.headers.get("cache-control")).toBe("no-store");
      expect(JSON.parse(savedText)).toMatchObject({
        preferences: {
          runnerDeck: saved.runnerDeck,
          corpDeck: saved.corpDeck,
        },
        invalidDeckSlots: [],
      });
      expect(savedText).not.toContain("ignoredSensitiveField");
      const alphaSecondDevice = await login(baseUrl, "alpha", PASSWORD_A);
      expect(
        await (
          await fetch(`${baseUrl}/api/account/match-start-preferences`, {
            headers: { cookie: alphaSecondDevice.cookie },
          })
        ).json(),
      ).toMatchObject({
        preferences: {
          runnerDeck: saved.runnerDeck,
          corpDeck: saved.corpDeck,
        },
      });

      const invalid = await fetch(
        `${baseUrl}/api/account/match-start-preferences`,
        {
          method: "PUT",
          headers: authHeaders(alpha),
          body: JSON.stringify({
            preferences: { ...saved, countdownSeconds: 7 },
          }),
        },
      );
      expect(invalid.status).toBe(400);
      expect(
        await (
          await fetch(`${baseUrl}/api/account/match-start-preferences`, {
            headers: { cookie: alpha.cookie },
          })
        ).json(),
      ).toMatchObject({ preferences: { countdownSeconds: 5 } });

      const betaAttempt = await fetch(
        `${baseUrl}/api/account/match-start-preferences`,
        {
          method: "PUT",
          headers: authHeaders(beta),
          body: JSON.stringify({
            preferences: preferencesFor({
              corpDeck: {
                kind: "account",
                cloudDeckId: copiedCorp.cloudDeckId,
              },
            }),
          }),
        },
      );
      expect(betaAttempt.status).toBe(200);
      const betaPayload = (await betaAttempt.json()) as {
        preferences: Record<string, unknown>;
        invalidDeckSlots: string[];
      };
      expect(betaPayload).toMatchObject({
        invalidDeckSlots: ["corp"],
      });
      expect(betaPayload.preferences).not.toHaveProperty("corpDeck");
      const alphaRead = await (
        await fetch(`${baseUrl}/api/account/match-start-preferences`, {
          headers: { cookie: alpha.cookie },
        })
      ).json();
      expect(alphaRead).toMatchObject({
        preferences: { corpDeck: saved.corpDeck },
      });

      const exported = await fetch(`${baseUrl}/api/account/export`, {
        headers: { cookie: alpha.cookie },
      });
      const exportedText = await exported.text();
      expect(exported.status).toBe(200);
      expect(JSON.parse(exportedText)).toMatchObject({
        schemaVersion: "netgrid-account-export-v2",
        matchStartPreferences: { runnerDeck: saved.runnerDeck },
      });
      expect(exportedText).not.toMatch(/seed|sessionToken|participantB/i);

      const reset = await fetch(
        `${baseUrl}/api/account/match-start-preferences`,
        { method: "DELETE", headers: authHeaders(alpha) },
      );
      expect(reset.status).toBe(200);
      expect(
        await (
          await fetch(`${baseUrl}/api/account/match-start-preferences`, {
            headers: { cookie: alpha.cookie },
          })
        ).json(),
      ).toEqual({ preferences: null, invalidDeckSlots: [] });

      await preferences.save(alpha.accountId, saved);
      const deleted = await fetch(`${baseUrl}/api/account`, {
        method: "DELETE",
        headers: authHeaders(alpha),
        body: JSON.stringify({ currentPassword: PASSWORD_A }),
      });
      expect(deleted.status).toBe(200);
      expect(await preferences.load(alpha.accountId)).toEqual({
        preferences: null,
        invalidDeckSlots: [],
      });
    } finally {
      await handle.close();
    }
  });
});

function preferencesFor(
  overrides: Partial<AccountMatchStartPreferences> = {},
): AccountMatchStartPreferences {
  return {
    schemaVersion: ACCOUNT_MATCH_START_PREFERENCES_SCHEMA_VERSION,
    playMode: "human_vs_ai",
    humanSideSelection: "random",
    humanAiSideSelection: "runner",
    matchFormat: "rules_match",
    seriesGamesPlanned: 2,
    matchCardPool: "originalset",
    runnerDifficulty: "normal",
    corpDifficulty: "normal",
    aiDeckPolicy: "selected",
    countdownSeconds: 5,
    playerClockMode: "player_clock",
    playerClockMinutes: 20,
    playerClockGraceSeconds: 10,
    ...overrides,
  };
}

async function login(
  baseUrl: string,
  loginName: string,
  password: string,
): Promise<{ cookie: string; csrfToken: string; accountId: string }> {
  const response = await fetch(`${baseUrl}/api/account/login`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: ORIGIN },
    body: JSON.stringify({ loginName, password }),
  });
  const payload = (await response.json()) as {
    csrfToken: string;
    account: { accountId: string };
  };
  return {
    cookie: response.headers.get("set-cookie")?.split(";", 1)[0] ?? "",
    csrfToken: payload.csrfToken,
    accountId: payload.account.accountId,
  };
}

function authHeaders(auth: { cookie: string; csrfToken: string }) {
  return {
    "content-type": "application/json",
    origin: ORIGIN,
    cookie: auth.cookie,
    "x-netgrid-csrf": auth.csrfToken,
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
