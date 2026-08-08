import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createNetgridHttpServer, mayAccessLocalReadOnlyAnalysisWithoutMaintenanceAuth } from "./http-server";
import { FixedWindowRateLimiter, loadDeploymentConfig } from "./internet-hardening";
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
  it("permits only local loopback GET analysis without a session", () => {
    const config = loadDeploymentConfig({} as NodeJS.ProcessEnv);
    const request = (address: string, method = "GET") =>
      ({ method, socket: { remoteAddress: address }, headers: { host: "127.0.0.1", "x-forwarded-for": "127.0.0.1" } }) as never;
    expect(mayAccessLocalReadOnlyAnalysisWithoutMaintenanceAuth(request("127.0.0.1"), "/api/storage/maintenance/analysis/matches/match/bundle", config)).toBe(true);
    expect(mayAccessLocalReadOnlyAnalysisWithoutMaintenanceAuth(request("::1"), "/api/storage/maintenance/analysis/matches/match/bundle", config)).toBe(true);
    expect(mayAccessLocalReadOnlyAnalysisWithoutMaintenanceAuth(request("::ffff:127.0.0.1"), "/api/storage/maintenance/analysis/matches/match/decisions/1", config)).toBe(true);
    expect(mayAccessLocalReadOnlyAnalysisWithoutMaintenanceAuth(request("127.0.0.1"), "/api/storage/maintenance/analysis/future-endpoint", config)).toBe(false);
    expect(mayAccessLocalReadOnlyAnalysisWithoutMaintenanceAuth(request("203.0.113.9"), "/api/storage/maintenance/analysis/matches/match/bundle", config)).toBe(false);
    expect(mayAccessLocalReadOnlyAnalysisWithoutMaintenanceAuth(request("127.0.0.1"), "/api/storage/maintenance/analysis/matches/match/bundle", { ...config, profile: "private_internet" })).toBe(false);
    expect(mayAccessLocalReadOnlyAnalysisWithoutMaintenanceAuth(request("127.0.0.1", "POST"), "/api/storage/maintenance/analysis/matches/match/bundle", config)).toBe(false);
    expect(mayAccessLocalReadOnlyAnalysisWithoutMaintenanceAuth(request("127.0.0.1"), "/api/storage/maintenance/cleanup/preview", config)).toBe(false);
  });

  it("rate-limits decision analysis before reconstruction without affecting the bundle scope", async () => {
    const directory = mkdtempSync(join(tmpdir(), "netgrid-decision-analysis-rate-limit-"));
    tempDirs.push(directory);
    const storage = new SqliteMatchStorage({ dbPath: join(directory, "netgrid.sqlite"), backupDir: join(directory, "backups") });
    const service = new MultiplayerService(storage, { tokenSalt: "decision-analysis-rate-limit" });
    const decisionAnalysis = vi.spyOn(service, "storageMaintenanceDecisionAnalysis");
    const rateLimiter = new FixedWindowRateLimiter({
      create_match: undefined,
      token_probe: { limit: 1, windowMs: 60_000 },
      account_read: undefined,
      lifecycle: undefined,
      ai_advance: undefined,
      ws_handshake: undefined,
      ws_join: undefined,
    });
    const handle = createNetgridHttpServer(service, {
      deploymentConfig: loadDeploymentConfig({} as NodeJS.ProcessEnv),
      rateLimiter,
    });
    const baseUrl = await listen(handle);
    try {
      const firstDecision = await fetch(`${baseUrl}/api/storage/maintenance/analysis/matches/missing/decisions/1`);
      expect(firstDecision.status).toBe(404);
      const limitedDecision = await fetch(`${baseUrl}/api/storage/maintenance/analysis/matches/missing/decisions/1`);
      expect(limitedDecision.status).toBe(429);
      expect(await limitedDecision.json()).toMatchObject({ error: { code: "rate_limited" } });
      expect(decisionAnalysis).toHaveBeenCalledTimes(1);

      expect((await fetch(`${baseUrl}/api/storage/maintenance/analysis/matches/missing/bundle`)).status).toBe(404);
    } finally {
      await handle.close();
    }
  });

  it("allows loopback analysis without a session while other maintenance routes remain authenticated", async () => {
    const directory = mkdtempSync(join(tmpdir(), "netgrid-local-analysis-auth-"));
    tempDirs.push(directory);
    const storage = new SqliteMatchStorage({ dbPath: join(directory, "netgrid.sqlite"), backupDir: join(directory, "backups") });
    const service = new MultiplayerService(storage, { tokenSalt: "local-analysis-auth" });
    const maintenanceAuth = new MaintenanceAuthService(new InMemoryMaintenanceCredentialStore(), { passwordKdf: TEST_KDF });
    await maintenanceAuth.bootstrapPassword(PASSWORD);
    const handle = createNetgridHttpServer(service, {
      deploymentConfig: loadDeploymentConfig({} as NodeJS.ProcessEnv),
      maintenanceAuth
    });
    const baseUrl = await listen(handle);
    try {
      const analysis = await fetch(`${baseUrl}/api/storage/maintenance/analysis/matches/missing/bundle`);
      expect(analysis.status).toBe(404);
      expect(await analysis.json()).toMatchObject({ error: { code: "not_found" } });

      expect((await fetch(`${baseUrl}/api/storage/maintenance/summary`)).status).toBe(401);
      expect((await fetch(`${baseUrl}/api/storage/maintenance/cleanup/preview`, { method: "POST" })).status).toBe(401);
    } finally {
      await handle.close();
    }
  });
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

  it("accepts remote maintenance only through an explicit HTTPS trusted-proxy contract", async () => {
    const maintenanceAuth = new MaintenanceAuthService(new InMemoryMaintenanceCredentialStore(), { passwordKdf: TEST_KDF });
    await maintenanceAuth.bootstrapPassword(PASSWORD);
    const deploymentConfig = loadDeploymentConfig({
      NETGRID_DEPLOYMENT_PROFILE: "private_internet",
      NETGRID_WEB_BASE_URL: "https://play.netgrid.example",
      NETGRID_SERVER_BASE_URL: "https://api.netgrid.example",
      NETGRID_ALLOWED_ORIGINS: "https://play.netgrid.example",
      NETGRID_TOKEN_SALT: "private-maintenance-test-salt",
      NETGRID_MAINTENANCE_ENABLED: "true",
      NETGRID_MAINTENANCE_BASE_URL: "https://admin.netgrid.example",
      NETGRID_MAINTENANCE_ALLOWED_ORIGINS: "https://admin.netgrid.example",
      NETGRID_MAINTENANCE_TRUSTED_PROXY_ADDRESSES: "127.0.0.1"
    } as NodeJS.ProcessEnv);
    const handle = createNetgridHttpServer(new MultiplayerService(new InMemoryMatchStorage(), { tokenSalt: "private-maintenance-http" }), {
      deploymentConfig,
      maintenanceAuth
    });
    const baseUrl = await listen(handle);
    try {
      const directHttp = await fetch(`${baseUrl}/api/storage/maintenance/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: "https://admin.netgrid.example" },
        body: JSON.stringify({ password: PASSWORD })
      });
      expect(directHttp.status).toBe(403);

      const proxiedHttps = await fetch(`${baseUrl}/api/storage/maintenance/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: "https://admin.netgrid.example", "x-forwarded-proto": "https" },
        body: JSON.stringify({ password: PASSWORD })
      });
      expect(proxiedHttps.status).toBe(200);
      expect(proxiedHttps.headers.get("set-cookie")).toContain("; Secure");
      expect(proxiedHttps.headers.get("access-control-allow-origin")).toBe("https://admin.netgrid.example");
      expect(proxiedHttps.headers.get("access-control-allow-credentials")).toBe("true");

      const adminOriginOnGamePlane = await fetch(`${baseUrl}/health`, { headers: { origin: "https://admin.netgrid.example" } });
      expect(adminOriginOnGamePlane.status).toBe(403);
      expect(await adminOriginOnGamePlane.text()).toContain("origin_not_allowed");
    } finally {
      await handle.close();
    }
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
