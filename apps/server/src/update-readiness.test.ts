import { afterEach, describe, expect, it, vi } from "vitest";
import { createNetgridHttpServer } from "./http-server";
import { loadDeploymentConfig } from "./internet-hardening";
import { InMemoryMatchStorage, MultiplayerService } from "./multiplayer";

const handles: Array<ReturnType<typeof createNetgridHttpServer>> = [];
const previousToken = process.env.NETGRID_LAUNCHER_CONTROL_TOKEN;

afterEach(async () => {
  await Promise.all(handles.splice(0).map((handle) => handle.close()));
  if (previousToken === undefined)
    delete process.env.NETGRID_LAUNCHER_CONTROL_TOKEN;
  else process.env.NETGRID_LAUNCHER_CONTROL_TOKEN = previousToken;
  vi.restoreAllMocks();
});

describe("launcher update readiness", () => {
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
  const handle = createNetgridHttpServer(service, { deploymentConfig });
  handles.push(handle);
  await new Promise<void>((resolve) =>
    handle.server.listen(0, "127.0.0.1", resolve),
  );
  const address = handle.server.address();
  if (!address || typeof address === "string")
    throw new Error("Missing server address");
  return `http://127.0.0.1:${address.port}`;
}
