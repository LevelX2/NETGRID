import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createNetgridHttpServer } from "./http-server";
import { loadDeploymentConfig } from "./internet-hardening";
import {
  InMemoryMaintenanceCredentialStore,
  MaintenanceAuthService,
} from "./maintenance-auth";
import { MultiplayerService } from "./multiplayer";
import { SqliteMatchStorage } from "./storage-sqlite";

const fixtures: Array<{
  root: string;
  handle: ReturnType<typeof createNetgridHttpServer>;
}> = [];
const originalToken = process.env.NETGRID_LAUNCHER_CONTROL_TOKEN;
const owner = "a".repeat(32);
const other = "b".repeat(32);
const token = "isolated-update-preparation-token";

afterEach(async () => {
  try {
    for (const { root, handle } of fixtures.splice(0)) {
      await handle.close();
      if (
        dirname(resolve(root)) !== resolve(tmpdir()) ||
        !root.startsWith(join(tmpdir(), "netgrid-update-preparation-"))
      )
        throw new Error("update_preparation_cleanup_target_invalid");
      await rm(root, { recursive: true, force: true });
    }
  } finally {
    if (originalToken === undefined)
      delete process.env.NETGRID_LAUNCHER_CONTROL_TOKEN;
    else process.env.NETGRID_LAUNCHER_CONTROL_TOKEN = originalToken;
    vi.restoreAllMocks();
  }
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

async function start(profile: "local" | "private_internet" = "local") {
  const root = await mkdtemp(join(tmpdir(), "netgrid-update-preparation-"));
  const storage = new SqliteMatchStorage({
    dbPath: join(root, "matches.sqlite"),
    backupDir: join(root, "backups"),
  });
  const service = new MultiplayerService(storage, {
    tokenSalt: "isolated-update-preparation",
  });
  process.env.NETGRID_LAUNCHER_CONTROL_TOKEN = token;
  const handle = createNetgridHttpServer(service, {
    deploymentConfig: {
      ...loadDeploymentConfig({} as NodeJS.ProcessEnv),
      profile,
    },
    maintenanceAuth: new MaintenanceAuthService(
      new InMemoryMaintenanceCredentialStore(),
    ),
  });
  fixtures.push({ root, handle });
  await new Promise<void>((complete) =>
    handle.server.listen(0, "127.0.0.1", complete),
  );
  const address = handle.server.address();
  if (!address || typeof address === "string")
    throw new Error("fixture_address_missing");
  const url = `http://127.0.0.1:${address.port}`;
  const control = (
    method: "POST" | "DELETE",
    attempt = owner,
    controlToken = token,
  ) =>
    fetch(`${url}/api/system/update-preparation`, {
      method,
      headers: {
        "x-netgrid-launcher-control": controlToken,
        "x-netgrid-update-owner": attempt,
      },
    });
  return { service, storage, url, control };
}

describe("server-owned update preparation", () => {
  it.each(["join", "reconnect", "account", "bootstrap"] as const)(
    "drains a previously admitted %s before classifying persisted matches",
    async (kind) => {
      const { service, storage } = await start();
      const created = await service.createMatch({
        hostSide: "runner",
        seed: `drain-${kind}`,
      });
      if (kind === "account") {
        const record = await storage.load(created.matchId);
        if (!record) throw new Error("account_rejoin_fixture_missing");
        record.match.status = "active";
        await storage.save(record);
      }
      const entered = deferred<void>();
      const continueLoad = deferred<void>();
      const originalLoad = storage.load.bind(storage);
      vi.spyOn(storage, "load").mockImplementationOnce(async (...args) => {
        const record = await originalLoad(...args);
        entered.resolve();
        await continueLoad.promise;
        return record;
      });
      const work =
        kind === "join"
          ? service.joinMatch(created.matchId, {
              token: new URL(created.joinUrl!).searchParams.get("joinToken")!,
            })
          : kind === "reconnect"
            ? service.reconnectMatch(created.matchId, {
                side: "runner",
                sessionToken: created.hostSessionToken,
                reconnectToken: created.hostReconnectToken,
              })
            : kind === "account"
              ? service.rejoinBoundAccountMatch(created.matchId, "player_a")
              : service.bootstrap(
                  created.matchId,
                  "runner",
                  created.hostSessionToken,
                  { allowLobby: true },
                );
      await entered.promise;
      const summary = vi.spyOn(service, "storageMaintenanceSummary");
      const preparation = service.prepareUpdate(owner);
      try {
        await Promise.resolve();
        expect(summary).not.toHaveBeenCalled();
      } finally {
        continueLoad.resolve();
      }
      expect(await work).not.toHaveProperty("error");
      await expect(preparation).resolves.toEqual({
        updateAllowed: false,
        activeMatchCount: 1,
      });
      expect(summary).toHaveBeenCalledTimes(1);
    },
  );
  it("requires launcher control for both acquisition and cancellation", async () => {
    const { control, service } = await start();
    expect((await control("POST", owner, "wrong")).status).toBe(403);
    expect((await control("DELETE", owner, "wrong")).status).toBe(403);
    expect(await (await control("POST")).json()).toEqual({
      ok: true,
      updateAllowed: true,
      activeMatchCount: 0,
    });
    expect((await control("DELETE", owner, "wrong")).status).toBe(403);
    await expect(service.createMatch({ hostSide: "runner" })).rejects.toThrow(
      "update_preparing",
    );
    expect((await control("DELETE")).status).toBe(200);
  });

  it("does not expose preparation in private internet mode", async () => {
    const { control } = await start("private_internet");
    expect((await control("POST")).status).toBe(403);
    expect((await control("DELETE")).status).toBe(403);
  });

  it("rejects malformed ownership without reserving the server", async () => {
    const { control } = await start();
    const invalid = await control("POST", "bad-owner");
    expect(invalid.status).toBe(400);
    expect(await invalid.json()).toEqual({
      error: { code: "update_owner_invalid" },
    });
    expect((await control("POST")).status).toBe(200);
    const foreign = await control("DELETE", other);
    expect(foreign.status).toBe(503);
    expect(await foreign.json()).toEqual({
      error: { code: "update_owner_conflict" },
    });
    await control("DELETE");
  });

  it("rejects an existing persisted lobby and leaves normal operations admitted", async () => {
    const { control, service } = await start();
    await service.createMatch({ hostSide: "runner", seed: "existing-lobby" });
    const response = await control("POST");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      ok: true,
      updateAllowed: false,
      activeMatchCount: 1,
    });
    await expect(
      service.createMatch({ hostSide: "corp", seed: "after-denial" }),
    ).resolves.toHaveProperty("matchId");
    expect((await service.storageMaintenanceSummary())?.nonTerminalCount).toBe(
      2,
    );
  });

  it("drains a create whose SQLite save has not completed before reading the count", async () => {
    const { service, storage } = await start();
    const saving = deferred<void>();
    const entered = deferred<void>();
    const originalSave = storage.save.bind(storage);
    vi.spyOn(storage, "save").mockImplementationOnce(async (record) => {
      entered.resolve();
      await saving.promise;
      await originalSave(record);
    });
    const creating = service.createMatch({
      hostSide: "runner",
      seed: "in-flight-create",
    });
    await entered.promise;
    const summary = vi.spyOn(service, "storageMaintenanceSummary");
    const preparation = service.prepareUpdate(owner);
    try {
      await expect(service.createMatch({ hostSide: "runner" })).rejects.toThrow(
        "update_preparing",
      );
      expect(summary).not.toHaveBeenCalled();
    } finally {
      saving.resolve();
    }
    await creating;
    await expect(preparation).resolves.toEqual({
      updateAllowed: false,
      activeMatchCount: 1,
    });
    expect(summary).toHaveBeenCalledTimes(1);
  });

  it("blocks all direct match/session entry points before loading or changing a match", async () => {
    const { service, storage, control, url } = await start();
    await control("POST");
    const load = vi.spyOn(storage, "load");
    const operations = [
      () => service.createMatch({ hostSide: "runner" }),
      () => service.joinMatch("missing", {}),
      () =>
        service.reconnectMatch("missing", {
          side: "runner",
          sessionToken: "fixture",
          reconnectToken: "fixture",
        }),
      () =>
        service.recoverMatch("missing", {
          side: "runner",
          reconnectToken: "fixture",
        }),
      () => service.rejoinBoundAccountMatch("missing", "player_a"),
      () => service.bootstrap("missing", "runner", "fixture"),
      () => service.setConnected("missing", "runner", "fixture", true),
      () =>
        service.startNextSeriesGame("missing", {
          side: "runner",
          sessionToken: "fixture",
        }),
      () =>
        service.recreateMatch("missing", {
          side: "runner",
          sessionToken: "fixture",
        }),
    ];
    for (const operation of operations)
      await expect(operation()).rejects.toThrow("update_preparing");
    expect(load).not.toHaveBeenCalled();
    const create = await fetch(`${url}/api/matches`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ hostSide: "runner" }),
    });
    expect(create.status).toBe(503);
    expect(await create.json()).toEqual({
      error: { code: "server_update_preparing" },
    });
    expect((await fetch(`${url}/health`)).status).toBe(200);
    let countdownFinished = false;
    const countdown = service
      .activateLobbyCountdown("missing")
      .then((result) => {
        countdownFinished = true;
        return result;
      });
    await Promise.resolve();
    expect(countdownFinished).toBe(false);
    await control("DELETE");
    await expect(countdown).resolves.toMatchObject({ ok: false });
    await expect(
      service.createMatch({ hostSide: "runner" }),
    ).resolves.toHaveProperty("matchId");
  });

  it("an acknowledged cancellation invalidates a delayed or duplicate prepare request", async () => {
    const { control } = await start();
    expect((await control("DELETE")).status).toBe(200);
    const delayed = await control("POST");
    expect(delayed.status).toBe(503);
    expect(await delayed.json()).toEqual({
      error: { code: "update_owner_retired" },
    });
    expect((await control("POST", other)).status).toBe(200);
    expect((await control("DELETE")).status).toBe(200);
    expect((await control("POST", "c".repeat(32))).status).toBe(503);
    expect((await control("DELETE", other)).status).toBe(200);
  });
});
