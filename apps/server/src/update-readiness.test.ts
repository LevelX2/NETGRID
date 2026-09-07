import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import type { ApiMatchStatus } from "@netgrid/shared";
import { createNetgridHttpServer } from "./http-server";
import { loadDeploymentConfig } from "./internet-hardening";
import { InMemoryMatchStorage, MultiplayerService } from "./multiplayer";
import { SqliteMatchStorage } from "./storage-sqlite";
import {
  InMemoryMaintenanceCredentialStore,
  MaintenanceAuthService,
} from "./maintenance-auth";

const handles: Array<ReturnType<typeof createNetgridHttpServer>> = [];
const fixtureRoots: string[] = [];
const previousToken = process.env.NETGRID_LAUNCHER_CONTROL_TOKEN;

afterEach(async () => {
  await Promise.all(handles.splice(0).map((handle) => handle.close()));
  for (const root of fixtureRoots.splice(0)) {
    if (
      dirname(resolve(root)) !== resolve(tmpdir()) ||
      !root.startsWith(join(tmpdir(), "netgrid-update-readiness-"))
    )
      throw new Error("update_readiness_fixture_cleanup_target_invalid");
    await rm(root, { recursive: true, force: true });
  }
  if (previousToken === undefined)
    delete process.env.NETGRID_LAUNCHER_CONTROL_TOKEN;
  else process.env.NETGRID_LAUNCHER_CONTROL_TOKEN = previousToken;
  vi.restoreAllMocks();
});

describe("launcher update readiness", () => {
  it("fails closed when storage cannot provide the authoritative count", async () => {
    process.env.NETGRID_LAUNCHER_CONTROL_TOKEN = "missing-summary-token";
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "missing-summary",
    });
    const baseUrl = await start(
      service,
      loadDeploymentConfig({} as NodeJS.ProcessEnv),
    );
    const response = await fetch(`${baseUrl}/api/system/update-readiness`, {
      headers: { "x-netgrid-launcher-control": "missing-summary-token" },
    });
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: {
        code: "storage_unavailable",
        message: "Speicherstatus ist nicht verfügbar.",
      },
    });
  });

  it("uses persisted SQLite statuses, including pending lobbies, not connected players", async () => {
    process.env.NETGRID_LAUNCHER_CONTROL_TOKEN = "sqlite-readiness-token";
    const root = await mkdtemp(join(tmpdir(), "netgrid-update-readiness-"));
    fixtureRoots.push(root);
    const storage = new SqliteMatchStorage({
      dbPath: join(root, "matches.sqlite"),
      backupDir: join(root, "backups"),
    });
    const service = new MultiplayerService(storage, {
      tokenSalt: "sqlite-readiness",
    });
    const baseUrl = await start(
      service,
      loadDeploymentConfig({} as NodeJS.ProcessEnv),
    );
    const readiness = async () => {
      const response = await fetch(`${baseUrl}/api/system/update-readiness`, {
        headers: { "x-netgrid-launcher-control": "sqlite-readiness-token" },
      });
      expect(response.status).toBe(200);
      return response.json();
    };
    expect(await readiness()).toEqual({
      ok: true,
      updateAllowed: true,
      activeMatchCount: 0,
    });
    const created = await service.createMatch({
      hostSide: "runner",
      seed: "readiness-status-fixture",
    });
    const record = await storage.load(created.matchId);
    if (!record) throw new Error("readiness_fixture_missing");
    expect(record.sessions.every((session) => !session.connected)).toBe(true);
    // Explicit persisted-status fixtures, not a claim that these artificial
    // transitions are legal engine actions. The real summary and HTTP path
    // must classify every storage status without returning match details.
    const cases = {
      pending: false,
      waiting_for_runner: false,
      waiting_for_corp: false,
      waiting_for_joiner_decks: false,
      ready_check: false,
      countdown: false,
      active: false,
      cancelled: true,
      abandoned: true,
      forfeited: true,
      finished: true,
    } satisfies Record<ApiMatchStatus, boolean>;
    for (const [status, allowed] of Object.entries(cases)) {
      record.match.status = status as ApiMatchStatus;
      await storage.save(record);
      expect(await readiness(), status).toEqual({
        ok: true,
        updateAllowed: allowed,
        activeMatchCount: allowed ? 0 : 1,
      });
    }
  });

  it("requires the ephemeral launcher token and reports active matches", async () => {
    process.env.NETGRID_LAUNCHER_CONTROL_TOKEN = "test-launcher-control-token";
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "update-readiness",
    });
    vi.spyOn(service, "storageMaintenanceSummary").mockResolvedValue({
      nonTerminalCount: 2,
    } as never);
    const baseUrl = await start(
      service,
      loadDeploymentConfig({} as NodeJS.ProcessEnv),
    );

    expect((await fetch(`${baseUrl}/api/system/update-readiness`)).status).toBe(
      403,
    );
    expect(
      (
        await fetch(`${baseUrl}/api/system/update-readiness`, {
          headers: { "x-netgrid-launcher-control": "wrong" },
        })
      ).status,
    ).toBe(403);
    const response = await fetch(`${baseUrl}/api/system/update-readiness`, {
      headers: { "x-netgrid-launcher-control": "test-launcher-control-token" },
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      updateAllowed: false,
      activeMatchCount: 2,
    });
  });

  it("allows an update only when no match is active", async () => {
    process.env.NETGRID_LAUNCHER_CONTROL_TOKEN = "ready-token";
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "update-ready",
    });
    vi.spyOn(service, "storageMaintenanceSummary").mockResolvedValue({
      nonTerminalCount: 0,
    } as never);
    const baseUrl = await start(
      service,
      loadDeploymentConfig({} as NodeJS.ProcessEnv),
    );
    const response = await fetch(`${baseUrl}/api/system/update-readiness`, {
      headers: { "x-netgrid-launcher-control": "ready-token" },
    });
    expect(await response.json()).toEqual({
      ok: true,
      updateAllowed: true,
      activeMatchCount: 0,
    });
  });

  it("does not expose launcher control in private internet mode", async () => {
    process.env.NETGRID_LAUNCHER_CONTROL_TOKEN = "internet-token";
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "update-internet",
    });
    vi.spyOn(service, "storageMaintenanceSummary").mockResolvedValue({
      nonTerminalCount: 0,
    } as never);
    const local = loadDeploymentConfig({} as NodeJS.ProcessEnv);
    const baseUrl = await start(service, {
      ...local,
      profile: "private_internet",
    });
    expect(
      (
        await fetch(`${baseUrl}/api/system/update-readiness`, {
          headers: { "x-netgrid-launcher-control": "internet-token" },
        })
      ).status,
    ).toBe(403);
  });
});

async function start(
  service: MultiplayerService,
  deploymentConfig: ReturnType<typeof loadDeploymentConfig>,
): Promise<string> {
  const handle = createNetgridHttpServer(service, {
    deploymentConfig,
    maintenanceAuth: new MaintenanceAuthService(
      new InMemoryMaintenanceCredentialStore(),
    ),
  });
  handles.push(handle);
  await new Promise<void>((resolve) =>
    handle.server.listen(0, "127.0.0.1", resolve),
  );
  const address = handle.server.address();
  if (!address || typeof address === "string")
    throw new Error("Missing server address");
  return `http://127.0.0.1:${address.port}`;
}
