import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { AccountSessionService, InMemoryAccountStorage, SqliteAccountStorage } from "./account-session";
import { InMemoryMatchStorage, MultiplayerService } from "./multiplayer";

describe("AccountSessionService", () => {
  it("persists account session tokens only as hashes and returns redacted self views", async () => {
    const dir = await mkdtemp(join(tmpdir(), "netgrid-account-session-"));
    const dbPath = join(dir, "accounts.sqlite");
    const storage = new SqliteAccountStorage({ dbPath });
    let db: DatabaseSync | undefined;
    try {
      const service = new AccountSessionService(storage, { tokenSalt: "account-session-test-salt", now: () => "2026-05-17T10:00:00.000Z" });
      await service.createAccount({ accountId: "acct_ludwig", displayName: "Ludwig", role: "admin" });

      const created = await service.createSession({ accountId: "acct_ludwig", sessionToken: "raw-account-session-token", deviceLabel: "Laptop" });

      db = new DatabaseSync(dbPath, { readOnly: true });
      const storedSession = db.prepare("SELECT session_token_hash AS sessionTokenHash FROM account_sessions WHERE account_id = ?").get("acct_ludwig") as
        | { sessionTokenHash: string }
        | undefined;
      expect(storedSession?.sessionTokenHash).toMatch(/^sha256:[a-f0-9]{64}$/);
      expect(storedSession?.sessionTokenHash).not.toContain(created.sessionToken);
      expect(JSON.stringify(db.prepare("SELECT * FROM account_sessions").all())).not.toContain(created.sessionToken);

      const authenticated = await service.authenticateSessionToken(created.sessionToken);
      expect(authenticated.ok).toBe(true);
      expect(JSON.stringify(authenticated)).not.toContain(created.sessionToken);
      expect(JSON.stringify(authenticated)).not.toContain("sessionTokenHash");
      if (authenticated.ok) {
        expect(authenticated.account).toEqual({
          accountId: "acct_ludwig",
          displayName: "Ludwig",
          status: "active",
          role: "admin",
          createdAt: "2026-05-17T10:00:00.000Z",
          updatedAt: "2026-05-17T10:00:00.000Z"
        });
        expect(authenticated.session).toMatchObject({ accountId: "acct_ludwig", deviceLabel: "Laptop" });
      }
    } finally {
      db?.close();
      storage.close();
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("revokes one account session and then all sessions for an account", async () => {
    const storage = new InMemoryAccountStorage();
    let now = "2026-05-17T11:00:00.000Z";
    const service = new AccountSessionService(storage, { tokenSalt: "account-session-revoke-salt", now: () => now });
    await service.createAccount({ accountId: "acct_runner", displayName: "Runner" });
    const first = await service.createSession({ accountId: "acct_runner", sessionToken: "first-account-session" });
    const second = await service.createSession({ accountId: "acct_runner", sessionToken: "second-account-session" });

    expect((await service.authenticateSessionToken(first.sessionToken)).ok).toBe(true);
    expect((await service.authenticateSessionToken(second.sessionToken)).ok).toBe(true);

    now = "2026-05-17T11:05:00.000Z";
    await expect(service.revokeSessionByToken(first.sessionToken)).resolves.toBe(true);
    expect(await service.authenticateSessionToken(first.sessionToken)).toEqual({ ok: false, errorCode: "session_revoked" });
    expect((await service.authenticateSessionToken(second.sessionToken)).ok).toBe(true);

    now = "2026-05-17T11:10:00.000Z";
    await expect(service.revokeAllAccountSessions("acct_runner")).resolves.toBe(1);
    expect(await service.authenticateSessionToken(second.sessionToken)).toEqual({ ok: false, errorCode: "session_revoked" });
  });

  it("keeps account sessions separate from match capabilities and side payloads", async () => {
    const accountService = new AccountSessionService(new InMemoryAccountStorage(), { tokenSalt: "account-session-match-boundary", now: () => "2026-05-17T12:00:00.000Z" });
    await accountService.createAccount({ accountId: "acct_boundary", displayName: "Boundary" });
    const accountSession = await accountService.createSession({ accountId: "acct_boundary", sessionToken: "account-session-cannot-play" });

    const matchService = new MultiplayerService(new InMemoryMatchStorage(), { tokenSalt: "match-token-salt" });
    const created = await matchService.createMatch({ hostSide: "runner", playMode: "human_vs_ai", seed: "account-session-boundary" });
    const actionId = created.legalActions[0]?.actionId ?? "draw";

    const denied = await matchService.submitAction({
      matchId: created.matchId,
      side: "runner",
      sessionToken: accountSession.sessionToken,
      actionId,
      clientKnownStateVersion: created.playerView.stateVersion,
      idempotencyKey: "account-session-token-is-not-match-session"
    });

    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.error.code).toBe("unauthorized");
    expect(JSON.stringify(denied)).not.toContain(accountSession.sessionToken);
    expect(JSON.stringify(created)).not.toMatch(/acct_boundary|account-session-cannot-play|sessionTokenHash|accountId/);
  });
});
