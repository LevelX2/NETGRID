import { describe, expect, it } from "vitest";
import { AccountDeckService, InMemoryAccountDeckStorage } from "./account-decks";
import { AccountAuthService, TEST_ACCOUNT_PASSWORD_KDF } from "./account-password";
import { InMemoryAccountStorage } from "./account-session";
import { createNetgridHttpServer } from "./http-server";
import { loadDeploymentConfig } from "./internet-hardening";
import { InMemoryMatchStorage, MultiplayerService } from "./multiplayer";

const ORIGIN = "http://127.0.0.1:3100";
const PASSWORD_A = "Sehr sichere Alpha Passphrase 2026";
const PASSWORD_B = "Sehr sichere Beta Passphrase 2026";

describe("account deck HTTP API", () => {
  it("exposes only standards and enforces owner, CSRF, version and quota boundaries", async () => {
    const accountAuth = new AccountAuthService(new InMemoryAccountStorage(), { tokenSalt: "account-decks-http", passwordKdf: TEST_ACCOUNT_PASSWORD_KDF });
    await accountAuth.bootstrapAdmin({ loginName: "alpha", displayName: "Alpha", password: PASSWORD_A });
    await accountAuth.createAccountWithPassword({ loginName: "beta", displayName: "Beta", password: PASSWORD_B });
    const accountDecks = new AccountDeckService(new InMemoryAccountDeckStorage(), { limit: 1 });
    const handle = createNetgridHttpServer(new MultiplayerService(new InMemoryMatchStorage(), { tokenSalt: "account-decks-match" }), {
      deploymentConfig: loadDeploymentConfig({} as NodeJS.ProcessEnv),
      accountAuth,
      accountDecks,
    });
    const baseUrl = await listen(handle);
    try {
      const standardsResponse = await fetch(`${baseUrl}/api/decks/standards`);
      const standardsText = await standardsResponse.text();
      const standardsPayload = JSON.parse(standardsText) as { catalog: { decks: Array<{ standardDeckId: string; side: string; guideStatus: string; guide?: { standardDeckId: string } }>; snapshots: unknown[] } };
      expect(standardsPayload.catalog.decks.length).toBeGreaterThan(40);
      expect(standardsPayload.catalog.decks.every((deck) => deck.guideStatus === "available" && deck.guide?.standardDeckId === deck.standardDeckId)).toBe(true);
      expect(JSON.stringify(standardsPayload.catalog.snapshots)).not.toMatch(/guideStatus|deckIdea/);
      expect(standardsText).not.toMatch(/internal_ai|test_fixture|retire|ownerAccountId/);

      const alpha = await login(baseUrl, "alpha", PASSWORD_A);
      const beta = await login(baseUrl, "beta", PASSWORD_B);
      const standard = standardsPayload.catalog.decks[0]!;
      const copied = await fetch(`${baseUrl}/api/account/decks/copy-standard`, {
        method: "POST",
        headers: authHeaders(alpha),
        body: JSON.stringify({ standardDeckId: standard.standardDeckId, name: "Alpha Standardkopie" }),
      });
      expect(copied.status).toBe(201);
      const copiedPayload = await copied.json() as { deck: { cloudDeckId: string; deckVersion: number; ownerAccountId?: string } };
      expect(copiedPayload.deck.ownerAccountId).toBeUndefined();

      expect((await fetch(`${baseUrl}/api/account/decks/${copiedPayload.deck.cloudDeckId}`, { headers: { cookie: beta.cookie } })).status).toBe(404);
      expect((await fetch(`${baseUrl}/api/account/decks/copy-standard`, {
        method: "POST",
        headers: authHeaders(alpha),
        body: JSON.stringify({ standardDeckId: standard.standardDeckId }),
      })).status).toBe(409);

      const current = await (await fetch(`${baseUrl}/api/account/decks/${copiedPayload.deck.cloudDeckId}`, { headers: { cookie: alpha.cookie } })).json() as { deck: { deck: Record<string, unknown> } };
      const updated = await fetch(`${baseUrl}/api/account/decks/${copiedPayload.deck.cloudDeckId}`, {
        method: "PUT",
        headers: authHeaders(alpha),
        body: JSON.stringify({ expectedVersion: 1, deck: { ...current.deck.deck, name: "Alpha überarbeitet" } }),
      });
      expect(updated.status).toBe(200);
      expect((await fetch(`${baseUrl}/api/account/decks/${copiedPayload.deck.cloudDeckId}`, {
        method: "PUT",
        headers: authHeaders(alpha),
        body: JSON.stringify({ expectedVersion: 1, deck: current.deck.deck }),
      })).status).toBe(409);

      const withoutCsrf = await fetch(`${baseUrl}/api/account/decks/${copiedPayload.deck.cloudDeckId}`, { method: "DELETE", headers: { cookie: alpha.cookie, origin: ORIGIN } });
      expect(withoutCsrf.status).toBe(403);
      const deleted = await fetch(`${baseUrl}/api/account/decks/${copiedPayload.deck.cloudDeckId}`, { method: "DELETE", headers: authHeaders(alpha) });
      expect(deleted.status).toBe(200);
      expect(await deleted.json()).toMatchObject({ quota: { limit: 1, used: 0, remaining: 1 } });

      const preflight = await fetch(`${baseUrl}/api/account/decks`, { method: "OPTIONS", headers: { origin: ORIGIN } });
      expect(preflight.headers.get("access-control-allow-methods")).toContain("PUT");
      expect(preflight.headers.get("access-control-allow-methods")).toContain("DELETE");

      await fetch(`${baseUrl}/api/account/decks/copy-standard`, {
        method: "POST",
        headers: authHeaders(alpha),
        body: JSON.stringify({ standardDeckId: standard.standardDeckId, name: "Exportiertes Deck" }),
      });
      const exported = await fetch(`${baseUrl}/api/account/export`, { headers: { cookie: alpha.cookie } });
      const exportText = await exported.text();
      expect(exported.status).toBe(200);
      expect(JSON.parse(exportText)).toMatchObject({ schemaVersion: "netgrid-account-export-v1" });
      expect(exportText).toContain("Exportiertes Deck");
      expect(exportText).not.toMatch(/passwordHash|sessionTokenHash|csrfTokenHash|inviteTokenHash/);

      const accountDeleted = await fetch(`${baseUrl}/api/account`, {
        method: "DELETE",
        headers: authHeaders(alpha),
        body: JSON.stringify({ currentPassword: PASSWORD_A }),
      });
      expect(accountDeleted.status).toBe(200);
      expect((await fetch(`${baseUrl}/api/account/session`, { headers: { cookie: alpha.cookie } })).status).toBe(401);
      expect((await fetch(`${baseUrl}/api/account/decks`, { headers: { cookie: beta.cookie } })).status).toBe(200);
    } finally {
      await handle.close();
    }
  });

  it("returns newly validated standard snapshots that existing match setup accepts", async () => {
    const accountAuth = new AccountAuthService(new InMemoryAccountStorage(), { passwordKdf: TEST_ACCOUNT_PASSWORD_KDF });
    const accountDecks = new AccountDeckService(new InMemoryAccountDeckStorage());
    const handle = createNetgridHttpServer(new MultiplayerService(new InMemoryMatchStorage(), { tokenSalt: "standard-snapshot-match" }), {
      deploymentConfig: loadDeploymentConfig({} as NodeJS.ProcessEnv), accountAuth, accountDecks,
    });
    const baseUrl = await listen(handle);
    try {
      const standards = accountDecks.listStandards();
      const runner = standards.find((deck) => deck.side === "runner")!;
      const corp = standards.find((deck) => deck.side === "corp")!;
      const runnerSnapshot = (await (await fetch(`${baseUrl}/api/decks/standards/${runner.standardDeckId}/snapshot`, { method: "POST" })).json() as { snapshot: unknown }).snapshot;
      const corpSnapshot = (await (await fetch(`${baseUrl}/api/decks/standards/${corp.standardDeckId}/snapshot`, { method: "POST" })).json() as { snapshot: unknown }).snapshot;
      const created = await fetch(`${baseUrl}/api/matches`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: ORIGIN },
        body: JSON.stringify({ hostSide: "runner", playMode: "human_vs_ai", participantADecks: { runnerDeckSnapshot: runnerSnapshot, corpDeckSnapshot: corpSnapshot } }),
      });
      expect(created.status).toBe(201);
      const text = await created.text();
      expect(text).not.toMatch(/"cards"|ownerAccountId|cloudDeckId/);
    } finally {
      await handle.close();
    }
  });
});

async function login(baseUrl: string, loginName: string, password: string): Promise<{ cookie: string; csrfToken: string }> {
  const response = await fetch(`${baseUrl}/api/account/login`, { method: "POST", headers: { "content-type": "application/json", origin: ORIGIN }, body: JSON.stringify({ loginName, password }) });
  const payload = await response.json() as { csrfToken: string };
  return { cookie: response.headers.get("set-cookie")?.split(";", 1)[0] ?? "", csrfToken: payload.csrfToken };
}

function authHeaders(auth: { cookie: string; csrfToken: string }): Record<string, string> {
  return { "content-type": "application/json", origin: ORIGIN, cookie: auth.cookie, "x-netgrid-csrf": auth.csrfToken };
}

async function listen(handle: ReturnType<typeof createNetgridHttpServer>): Promise<string> {
  await new Promise<void>((resolve) => handle.server.listen(0, "127.0.0.1", resolve));
  const address = handle.server.address();
  if (!address || typeof address === "string") throw new Error("Missing server address");
  return `http://127.0.0.1:${address.port}`;
}
