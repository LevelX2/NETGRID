import { describe, expect, it } from "vitest";
import { once } from "node:events";
import { connect } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { createNetgridHttpServer } from "./http-server";
import { InMemoryMatchStorage, MultiplayerService } from "./multiplayer";
import { loadDeploymentConfig } from "./internet-hardening";
import {
  InMemoryMaintenanceCredentialStore,
  MaintenanceAuthService,
} from "./maintenance-auth";

describe("HTTP shutdown", () => {
  it.each(["", "GET /health HTTP/1.1\r\nHost:"])(
    "closes preconnected sockets without an accepted request (%j)",
    async (partialRequest) => {
      const handle = createNetgridHttpServer(
        new MultiplayerService(new InMemoryMatchStorage(), {
          tokenSalt: "http-stop-fixture",
        }),
        {
          deploymentConfig: loadDeploymentConfig({} as NodeJS.ProcessEnv),
          maintenanceAuth: new MaintenanceAuthService(
            new InMemoryMaintenanceCredentialStore(),
          ),
        },
      );
      await new Promise<void>((resolve) =>
        handle.server.listen(0, "127.0.0.1", resolve),
      );
      const address = handle.server.address();
      if (!address || typeof address === "string")
        throw new Error("fixture_address_missing");
      const accepted = once(handle.server, "connection");
      const socket = connect(address.port, "127.0.0.1");
      let stopping: Promise<void> | undefined;
      try {
        await Promise.all([once(socket, "connect"), accepted]);
        if (partialRequest) {
          const received = once((await accepted)[0], "data");
          socket.write(partialRequest);
          await received;
        }
        stopping = handle.close();
        const outcome = await Promise.race([
          stopping.then(() => "stopped"),
          delay(500).then(() => "timeout"),
        ]);
        expect(outcome).toBe("stopped");
      } finally {
        socket.destroy();
        await (stopping ?? handle.close());
      }
    },
  );
});
