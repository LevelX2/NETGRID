import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createNetgridHttpServer } from "./http-server";
import { loadDeploymentConfig } from "./internet-hardening";
import { InMemoryMaintenanceCredentialStore, MaintenanceAuthService } from "./maintenance-auth";
import { InMemoryMatchStorage, MultiplayerService } from "./multiplayer";
import { SqliteMatchStorage } from "./storage-sqlite";

const ORIGIN = "http://127.0.0.1:3100";
const PASSWORD = "sichere Test-Passphrase";
const TEST_KDF = { keyLength: 32, cost: 1024, blockSize: 8, parallelization: 1, maxMemory: 8 * 1024 * 1024 };
const tempDirs: string[] = [];

afterEach(() => {
  for (const path of tempDirs.splice(0)) rmSync(path, { recursive: true, force: true });
});

describe("ARC-001 maintenance HTTP security", () => {
  it("fails closed, enforces cookie, origin, CSRF and reauthentication, and revokes sessions after password change", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), { tokenSalt: "maintenance-auth-http" });
    const maintenanceAuth = new MaintenanceAuthService(new InMemoryMaintenanceCredentialStore(), { passwordKdf: TEST_KDF });
    const handle = createNetgridHttpServer(service, {
      deploymentConfig: loadDeploymentConfig({} as NodeJS.ProcessEnv),
      maintenanceAuth
    });
    const baseUrl = await listen(handle);
    try {
      const beforeBootstrap = await fetch(`${baseUrl}/api/storage/maintenance/summary`);
      expect(beforeBootstrap.status).toBe(503);
      expect(await beforeBootstrap.text()).toContain("maintenance_auth_uninitialized");

      await maintenanceAuth.bootstrapPassword(PASSWORD);
      expect((await fetch(`${baseUrl}/api/storage/maintenance/summary`)).status).toBe(401);
      expect((await login(baseUrl, "falsche Passphrase")).status).toBe(401);

      const signedIn = await login(baseUrl, PASSWORD);
      const loginText = await signedIn.text();
      const loginPayload = JSON.parse(loginText) as { csrfToken?: string };
      const setCookie = signedIn.headers.get("set-cookie");
      const cookie = setCookie?.split(";", 1)[0] ?? "";
      expect(signedIn.status).toBe(200);
      expect(setCookie).toMatch(/^ng_maintenance_session=[^;]+; HttpOnly; SameSite=Strict; Path=\/; Max-Age=1800$/);
      expect(loginPayload.csrfToken).toBeTruthy();
      expect(loginText).not.toContain(PASSWORD);
      expect(loginText).not.toContain("sessionToken");

      const withoutCsrf = await fetch(`${baseUrl}/api/storage/maintenance/cleanup/preview`, {
        method: "POST",
        headers: { "content-type": "application/json", cookie, origin: ORIGIN },
        body: JSON.stringify({ statuses: ["finished"] })
      });
      expect(withoutCsrf.status).toBe(403);
      expect(await withoutCsrf.text()).toContain("maintenance_request_rejected");

      const foreignOrigin = await fetch(`${baseUrl}/api/storage/maintenance/cleanup/preview`, {
        method: "POST",
        headers: { "content-type": "application/json", cookie, origin: "https://attacker.example", "x-netgrid-csrf": loginPayload.csrfToken ?? "" },
        body: JSON.stringify({ statuses: ["finished"] })
      });
      expect(foreignOrigin.status).toBe(403);
      expect(await foreignOrigin.text()).toContain("origin_not_allowed");

      const withoutReauth = await fetch(`${baseUrl}/api/storage/maintenance/cleanup/apply`, {
        method: "POST",
        headers: { "content-type": "application/json", cookie, origin: ORIGIN, "x-netgrid-csrf": loginPayload.csrfToken ?? "" },
        body: JSON.stringify({})
      });
      expect(withoutReauth.status).toBe(403);
      expect(await withoutReauth.text()).toContain("maintenance_reauthentication_required");

      const changedPassword = "noch sicherere Test-Passphrase";
      const passwordChange = await fetch(`${baseUrl}/api/storage/maintenance/auth/password`, {
        method: "POST",
        headers: { "content-type": "application/json", cookie, origin: ORIGIN, "x-netgrid-csrf": loginPayload.csrfToken ?? "" },
        body: JSON.stringify({ currentPassword: PASSWORD, newPassword: changedPassword })
      });
      expect(passwordChange.status).toBe(200);
      expect(await passwordChange.json()).toMatchObject({ ok: true, sessionsRevoked: true });
      expect((await fetch(`${baseUrl}/api/storage/maintenance/summary`, { headers: { cookie } })).status).toBe(401);
      expect((await login(baseUrl, PASSWORD)).status).toBe(401);
      expect((await login(baseUrl, changedPassword)).status).toBe(200);
    } finally {
      await handle.close();
    }
  });

  it("revalidates cleanup status and refuses a match that became active", async () => {
    const directory = mkdtempSync(join(tmpdir(), "netgrid-maintenance-cleanup-"));
    tempDirs.push(directory);
    const storage = new SqliteMatchStorage({ dbPath: join(directory, "netgrid.sqlite"), backupDir: join(directory, "backups") });
    const service = new MultiplayerService(storage, { tokenSalt: "maintenance-cleanup-revalidation" });
    const created = await service.createMatch({ hostSide: "runner", playMode: "human_vs_ai", seed: "cleanup-revalidation" });
    const record = await service.loadForTest(created.matchId);
    if (!record) throw new Error("Missing cleanup revalidation fixture");
    record.match.status = "abandoned";
    record.match.updatedAt = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    await storage.save(record);
    const filters = { statuses: ["abandoned" as const], olderThanMinutes: 60, limit: 100 };
    const preview = await storage.maintenanceCleanupPreview(filters);
    expect(preview.matches.map((match) => match.matchId)).toEqual([created.matchId]);

    record.match.status = "active";
    await storage.save(record);

    await expect(storage.maintenanceCleanupApply({ filters, previewId: preview.previewId })).rejects.toThrow("maintenance_preview_mismatch");
    expect(await storage.load(created.matchId)).toBeTruthy();
    service.closeStorage();
  });
});

function login(baseUrl: string, password: string): Promise<Response> {
  return fetch(`${baseUrl}/api/storage/maintenance/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: ORIGIN },
    body: JSON.stringify({ password })
  });
}

async function listen(handle: ReturnType<typeof createNetgridHttpServer>): Promise<string> {
  await new Promise<void>((resolve) => handle.server.listen(0, "127.0.0.1", resolve));
  const address = handle.server.address();
  if (!address || typeof address === "string") throw new Error("Missing server address");
  return `http://127.0.0.1:${address.port}`;
}
