import { afterEach, describe, expect, it, vi } from "vitest";
import { createNetgridHttpServer } from "./http-server";
import { loadDeploymentConfig } from "./internet-hardening";
import { InMemoryMatchStorage, MultiplayerService } from "./multiplayer";

const handles: Array<ReturnType<typeof createNetgridHttpServer>> = [];

afterEach(async () => {
  await Promise.all(handles.splice(0).map((handle) => handle.close()));
});

describe("maintenance cleanup startup schedule", () => {
  it("runs the stored local cleanup policy once after listening", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "startup-cleanup-test",
    });
    const cleanup = vi
      .spyOn(service, "runStorageMaintenanceCleanupPolicy")
      .mockResolvedValue(undefined);
    const handle = createNetgridHttpServer(service, {
      deploymentConfig: loadDeploymentConfig({} as NodeJS.ProcessEnv),
    });
    handles.push(handle);

    expect(cleanup).not.toHaveBeenCalled();
    await listen(handle);
    await vi.waitFor(() => expect(cleanup).toHaveBeenCalledTimes(1));
  });

  it("does not run the local cleanup schedule in private internet mode", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "startup-cleanup-private-test",
    });
    const cleanup = vi
      .spyOn(service, "runStorageMaintenanceCleanupPolicy")
      .mockResolvedValue(undefined);
    const local = loadDeploymentConfig({} as NodeJS.ProcessEnv);
    const handle = createNetgridHttpServer(service, {
      deploymentConfig: { ...local, profile: "private_internet" },
    });
    handles.push(handle);

    await listen(handle);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(cleanup).not.toHaveBeenCalled();
  });
});

async function listen(
  handle: ReturnType<typeof createNetgridHttpServer>,
): Promise<void> {
  await new Promise<void>((resolve) =>
    handle.server.listen(0, "127.0.0.1", resolve),
  );
}
