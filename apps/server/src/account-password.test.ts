import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import {
  AccountAuthService,
  TEST_ACCOUNT_PASSWORD_KDF,
  validateNewAccountPassword,
} from "./account-password";
import {
  InMemoryAccountStorage,
  SqliteAccountStorage,
} from "./account-session";

describe("AccountAuthService", () => {
  it("bootstraps one admin, persists only password hashes, and logs in with a revocable session", async () => {
    const dir = await mkdtemp(join(tmpdir(), "netgrid-account-password-"));
    const dbPath = join(dir, "netgrid.sqlite");
    const storage = new SqliteAccountStorage({
      dbPath,
      backupDir: join(dir, "backups"),
    });
    let db: DatabaseSync | undefined;
    try {
      const service = new AccountAuthService(storage, {
        tokenSalt: "account-auth-test-token-salt",
        passwordKdf: TEST_ACCOUNT_PASSWORD_KDF,
        now: () => "2026-07-18T08:00:00.000Z",
      });
      const created = await service.bootstrapAdmin({
        loginName: "Ludwig.Admin",
        displayName: "Ludwig",
        password: "Sehr langes Testpasswort 2026",
        deviceLabel: "Desktop",
      });

      expect(created.account).toMatchObject({
        loginName: "Ludwig.Admin",
        displayName: "Ludwig",
        role: "admin",
      });
      await expect(
        service.bootstrapAdmin({
          loginName: "Zweiter.Admin",
          displayName: "Zweiter Admin",
          password: "Noch ein sehr langes Testpasswort",
        }),
      ).rejects.toThrow("account_bootstrap_closed");

      db = new DatabaseSync(dbPath, { readOnly: true });
      const raw = JSON.stringify({
        accounts: db.prepare("SELECT * FROM accounts").all(),
        credentials: db
          .prepare("SELECT * FROM account_password_credentials")
          .all(),
        sessions: db.prepare("SELECT * FROM account_sessions").all(),
      });
      expect(raw).not.toContain("Sehr langes Testpasswort 2026");
      expect(raw).not.toContain(created.session.sessionToken);
      expect(raw).not.toContain(created.session.csrfToken);
      expect(raw).toMatch(/password_hash/);

      const login = await service.login({
        loginName: "ludwig.admin",
        password: "Sehr langes Testpasswort 2026",
      });
      expect(login.ok).toBe(true);
      expect(
        await service.login({
          loginName: "ludwig.admin",
          password: "Falsches sehr langes Passwort",
        }),
      ).toEqual({
        ok: false,
        errorCode: "invalid_credentials",
      });
      expect(
        await service.login({
          loginName: "unbekannter.user",
          password: "Falsches sehr langes Passwort",
        }),
      ).toEqual({
        ok: false,
        errorCode: "invalid_credentials",
      });
      if (login.ok) {
        expect(
          await service.authenticateSession(login.session.sessionToken),
        ).toMatchObject({ ok: true });
        expect(
          await service.verifyCsrf(
            login.session.sessionToken,
            login.session.csrfToken,
          ),
        ).toBe(true);
        await service.sessions.revokeSessionByToken(login.session.sessionToken);
        expect(
          await service.authenticateSession(login.session.sessionToken),
        ).toEqual({ ok: false, errorCode: "session_revoked" });
      }
    } finally {
      db?.close();
      storage.close();
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("normalizes login names, rejects duplicates, and applies the password policy", async () => {
    const service = new AccountAuthService(new InMemoryAccountStorage(), {
      tokenSalt: "account-policy-test",
      passwordKdf: TEST_ACCOUNT_PASSWORD_KDF,
      now: () => "2026-07-18T09:00:00.000Z",
    });
    await service.createAccountWithPassword({
      loginName: "Spieler.Eins",
      displayName: "Spieler Eins",
      password: "Ein ausreichend langes Passwort",
    });
    await expect(
      service.createAccountWithPassword({
        loginName: "spieler.eins",
        displayName: "Andere Anzeige",
        password: "Noch ein ausreichend langes Passwort",
      }),
    ).rejects.toThrow("login_name_unavailable");
    expect(() =>
      validateNewAccountPassword("viel zu kurz", "spieler.eins"),
    ).toThrow("account_password_too_short");
    expect(() =>
      validateNewAccountPassword("passwordpassword", "spieler.eins"),
    ).toThrow("account_password_blocked");
    expect(() =>
      validateNewAccountPassword(
        "Mein NETGRID Passwort ist lang",
        "spieler.eins",
      ),
    ).toThrow("account_password_blocked");
    expect(validateNewAccountPassword("Lange Passphrase mit Umlaut ä")).toBe(
      "Lange Passphrase mit Umlaut ä",
    );
  });

  it("changes a password, increments the credential version, and revokes every old session", async () => {
    const storage = new InMemoryAccountStorage();
    let now = "2026-07-18T10:00:00.000Z";
    const service = new AccountAuthService(storage, {
      tokenSalt: "account-password-change-test",
      passwordKdf: TEST_ACCOUNT_PASSWORD_KDF,
      now: () => now,
    });
    const created = await service.createAccountWithPassword({
      loginName: "runner.one",
      displayName: "Runner One",
      password: "Altes ausreichend langes Passwort",
    });
    const second = await service.login({
      loginName: "runner.one",
      password: "Altes ausreichend langes Passwort",
    });
    expect(second.ok).toBe(true);

    now = "2026-07-18T10:05:00.000Z";
    await expect(
      service.changePassword({
        accountId: created.account.accountId,
        currentPassword: "Altes ausreichend langes Passwort",
        newPassword: "Neues noch längeres Passwort 2026",
      }),
    ).resolves.toBe(true);
    expect(
      await service.authenticateSession(created.session.sessionToken),
    ).toEqual({ ok: false, errorCode: "session_revoked" });
    if (second.ok)
      expect(
        await service.authenticateSession(second.session.sessionToken),
      ).toEqual({ ok: false, errorCode: "session_revoked" });
    expect(
      await service.login({
        loginName: "runner.one",
        password: "Altes ausreichend langes Passwort",
      }),
    ).toEqual({
      ok: false,
      errorCode: "invalid_credentials",
    });
    expect(
      (
        await service.login({
          loginName: "runner.one",
          password: "Neues noch längeres Passwort 2026",
        })
      ).ok,
    ).toBe(true);
    expect(
      (await storage.loadAccount(created.account.accountId))?.credentialVersion,
    ).toBe(2);
  });
});
