import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  AccountAuthService,
  TEST_ACCOUNT_PASSWORD_KDF,
  accountAccessModeFromEnvironment,
} from "./account-password";
import {
  InMemoryAccountStorage,
  SqliteAccountStorage,
} from "./account-session";
import { createNetgridHttpServer } from "./http-server";
import { loadDeploymentConfig } from "./internet-hardening";
import {
  InMemoryMaintenanceCredentialStore,
  MaintenanceAuthService,
} from "./maintenance-auth";
import { InMemoryMatchStorage, MultiplayerService } from "./multiplayer";

const ORIGIN = "http://127.0.0.1:3100";
const MAINTENANCE_PASSWORD = "Sichere Maintenance Passphrase 2026";
const FIRST_PASSWORD = "Erstes ausreichend langes Passwort 2026";
const SECOND_PASSWORD = "Zweites ausreichend langes Passwort 2026";
const handles: Array<ReturnType<typeof createNetgridHttpServer>> = [];

afterEach(async () => {
  await Promise.all(handles.splice(0).map((handle) => handle.close()));
});

describe("local account access policy", () => {
  it("keeps invite-only as development default and validates overrides", () => {
    expect(accountAccessModeFromEnvironment({} as NodeJS.ProcessEnv)).toBe(
      "invite_only",
    );
    expect(
      accountAccessModeFromEnvironment({
        NETGRID_ACCOUNT_ACCESS_MODE: "simple",
      } as NodeJS.ProcessEnv),
    ).toBe("simple");
    expect(() =>
      accountAccessModeFromEnvironment({
        NETGRID_ACCOUNT_ACCESS_MODE: "public",
      } as NodeJS.ProcessEnv),
    ).toThrow("account_access_mode_invalid");
  });

  it("persists mode changes, requires every profile credential, and revokes sessions", async () => {
    const directory = await mkdtemp(join(tmpdir(), "netgrid-account-mode-"));
    const dbPath = join(directory, "netgrid.sqlite");
    const storage = new SqliteAccountStorage({
      dbPath,
      backupDir: join(directory, "backups"),
    });
    try {
      const service = new AccountAuthService(storage, {
        tokenSalt: "local-mode-service-test",
        defaultAccessMode: "simple",
        passwordKdf: TEST_ACCOUNT_PASSWORD_KDF,
      });
      expect(await service.accessPolicy()).toEqual({
        mode: "simple",
        source: "configured_default",
      });
      const first = await service.registerLocalProfile({
        displayName: "Spieler Eins",
      });
      const second = await service.registerLocalProfile({
        displayName: "Spieler Zwei",
      });
      expect(await service.listLocalProfiles()).toEqual([
        { accountId: first.account.accountId, displayName: "Spieler Eins" },
        { accountId: second.account.accountId, displayName: "Spieler Zwei" },
      ]);

      await expect(
        service.changeLocalAccessMode({
          mode: "protected",
          credentials: [
            { accountId: first.account.accountId, password: FIRST_PASSWORD },
          ],
        }),
      ).rejects.toThrow("account_access_mode_credentials_incomplete");
      await service.changeLocalAccessMode({
        mode: "protected",
        credentials: [
          { accountId: first.account.accountId, password: FIRST_PASSWORD },
          { accountId: second.account.accountId, password: SECOND_PASSWORD },
        ],
      });
      expect(await service.accessPolicy()).toEqual({
        mode: "protected",
        source: "persisted",
      });
      expect(
        await service.authenticateSession(first.session.sessionToken),
      ).toEqual({ ok: false, errorCode: "session_revoked" });
      expect(
        (
          await service.login({
            loginName: first.account.loginName,
            password: FIRST_PASSWORD,
          })
        ).ok,
      ).toBe(true);

      service.close();
      const reopened = new AccountAuthService(
        new SqliteAccountStorage({
          dbPath,
          backupDir: join(directory, "backups"),
        }),
        { defaultAccessMode: "invite_only" },
      );
      expect(await reopened.accessPolicy()).toEqual({
        mode: "protected",
        source: "persisted",
      });
      reopened.close();
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("exposes simple and protected self-service only on the local deployment profile", async () => {
    const accountAuth = new AccountAuthService(new InMemoryAccountStorage(), {
      tokenSalt: "local-access-http-test",
      defaultAccessMode: "simple",
      passwordKdf: TEST_ACCOUNT_PASSWORD_KDF,
    });
    const maintenanceAuth = new MaintenanceAuthService(
      new InMemoryMaintenanceCredentialStore(),
      { passwordKdf: TEST_ACCOUNT_PASSWORD_KDF },
    );
    await maintenanceAuth.bootstrapPassword(MAINTENANCE_PASSWORD);
    const handle = createNetgridHttpServer(
      new MultiplayerService(new InMemoryMatchStorage(), {
        tokenSalt: "local-access-match-test",
      }),
      {
        deploymentConfig: loadDeploymentConfig({} as NodeJS.ProcessEnv),
        accountAuth,
        maintenanceAuth,
      },
    );
    handles.push(handle);
    const baseUrl = await listen(handle);

    const policy = await fetch(`${baseUrl}/api/account/access-policy`);
    expect(await policy.json()).toMatchObject({
      mode: "simple",
      selfServiceEnabled: true,
    });
    const created = await fetch(`${baseUrl}/api/account/profiles`, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ displayName: "Lokales Profil" }),
    });
    expect(created.status).toBe(201);
    const createdPayload = (await created.json()) as {
      account: { accountId: string; loginName: string; displayName: string };
    };
    const simpleCookie = cookieFrom(created);
    expect(createdPayload.account.displayName).toBe("Lokales Profil");
    expect((await fetch(`${baseUrl}/api/account/profiles`)).status).toBe(200);
    expect(
      (
        await fetch(`${baseUrl}/api/account/login`, {
          method: "POST",
          headers: jsonHeaders(),
          body: JSON.stringify({ loginName: "x", password: "x" }),
        })
      ).status,
    ).toBe(409);

    const maintenanceLogin = await fetch(
      `${baseUrl}/api/storage/maintenance/auth/login`,
      {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({ password: MAINTENANCE_PASSWORD }),
      },
    );
    const maintenanceCookie = cookieFrom(maintenanceLogin);
    const maintenancePayload = (await maintenanceLogin.json()) as {
      csrfToken: string;
    };
    const maintenanceHeaders = jsonHeaders({
      cookie: maintenanceCookie,
      "x-netgrid-csrf": maintenancePayload.csrfToken,
    });
    expect(
      (
        await fetch(
          `${baseUrl}/api/storage/maintenance/accounts/access-policy`,
          {
            method: "POST",
            headers: maintenanceHeaders,
            body: JSON.stringify({
              mode: "protected",
              credentials: [
                {
                  accountId: createdPayload.account.accountId,
                  password: FIRST_PASSWORD,
                },
              ],
            }),
          },
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await fetch(`${baseUrl}/api/storage/maintenance/auth/reauthenticate`, {
          method: "POST",
          headers: maintenanceHeaders,
          body: JSON.stringify({ password: MAINTENANCE_PASSWORD }),
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await fetch(
          `${baseUrl}/api/storage/maintenance/accounts/access-policy`,
          {
            method: "POST",
            headers: maintenanceHeaders,
            body: JSON.stringify({
              mode: "protected",
              credentials: [
                {
                  accountId: createdPayload.account.accountId,
                  password: FIRST_PASSWORD,
                },
              ],
            }),
          },
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await fetch(`${baseUrl}/api/account/session`, {
          headers: { cookie: simpleCookie },
        })
      ).status,
    ).toBe(401);

    const protectedRegistration = await fetch(
      `${baseUrl}/api/account/register`,
      {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({
          loginName: "spieler.zwei",
          displayName: "Spieler Zwei",
          password: SECOND_PASSWORD,
        }),
      },
    );
    expect(protectedRegistration.status).toBe(201);
    const protectedCookie = cookieFrom(protectedRegistration);
    expect((await fetch(`${baseUrl}/api/account/profiles`)).status).toBe(409);

    await reauthenticateMaintenance(
      baseUrl,
      maintenanceHeaders,
      MAINTENANCE_PASSWORD,
    );
    const replacementPassword = "Ersetztes sicheres Passwort 2026";
    expect(
      (
        await fetch(
          `${baseUrl}/api/storage/maintenance/accounts/${createdPayload.account.accountId}/password`,
          {
            method: "POST",
            headers: maintenanceHeaders,
            body: JSON.stringify({ newPassword: replacementPassword }),
          },
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await fetch(`${baseUrl}/api/account/login`, {
          method: "POST",
          headers: jsonHeaders(),
          body: JSON.stringify({
            loginName: createdPayload.account.loginName,
            password: replacementPassword,
          }),
        })
      ).status,
    ).toBe(200);

    await reauthenticateMaintenance(
      baseUrl,
      maintenanceHeaders,
      MAINTENANCE_PASSWORD,
    );
    expect(
      (
        await fetch(
          `${baseUrl}/api/storage/maintenance/accounts/access-policy`,
          {
            method: "POST",
            headers: maintenanceHeaders,
            body: JSON.stringify({ mode: "simple" }),
          },
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await fetch(`${baseUrl}/api/account/session`, {
          headers: { cookie: protectedCookie },
        })
      ).status,
    ).toBe(401);
    expect((await fetch(`${baseUrl}/api/account/profiles`)).status).toBe(200);
  });

  it("rejects installed-product self-service in private internet mode", async () => {
    const accountAuth = new AccountAuthService(new InMemoryAccountStorage(), {
      defaultAccessMode: "protected",
      passwordKdf: TEST_ACCOUNT_PASSWORD_KDF,
    });
    const deploymentConfig = loadDeploymentConfig({
      NETGRID_DEPLOYMENT_PROFILE: "private_internet",
      NETGRID_WEB_BASE_URL: "https://play.netgrid.example",
      NETGRID_SERVER_BASE_URL: "https://api.netgrid.example",
      NETGRID_ALLOWED_ORIGINS: "https://play.netgrid.example",
      NETGRID_TOKEN_SALT: "private-local-access-test",
    } as NodeJS.ProcessEnv);
    const handle = createNetgridHttpServer(
      new MultiplayerService(new InMemoryMatchStorage()),
      { deploymentConfig, accountAuth },
    );
    handles.push(handle);
    const baseUrl = await listen(handle);
    const response = await fetch(`${baseUrl}/api/account/register`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://play.netgrid.example",
      },
      body: JSON.stringify({
        loginName: "remote.user",
        displayName: "Remote User",
        password: FIRST_PASSWORD,
      }),
    });
    expect(response.status).toBe(403);
    expect(await accountAuth.listAccountsForMaintenance()).toEqual([]);
  });
});

function jsonHeaders(
  extra: Record<string, string> = {},
): Record<string, string> {
  return { "content-type": "application/json", origin: ORIGIN, ...extra };
}

function cookieFrom(response: Response): string {
  return response.headers.get("set-cookie")?.split(";", 1)[0] ?? "";
}

async function reauthenticateMaintenance(
  baseUrl: string,
  headers: Record<string, string>,
  password: string,
): Promise<void> {
  const response = await fetch(
    `${baseUrl}/api/storage/maintenance/auth/reauthenticate`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ password }),
    },
  );
  expect(response.status).toBe(200);
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
