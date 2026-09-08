import { describe, expect, it } from "vitest";
import { once } from "node:events";
import { createServer, type ServerResponse } from "node:http";
import { connect } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { HttpConnectionDrain } from "./http-connection-drain";

describe("HTTP connection drain ownership", () => {
  it.each([false, true])(
    "finishes accepted pipelined responses without truncation (late request: %s)",
    async (lateRequest) => {
      const responses: ServerResponse[] = [];
      const server = createServer((request, response) => {
        if (!drain.accept(request, response)) return;
        responses.push(response);
        if (responses.length === 1) {
          response.writeHead(200);
          response.write("first-part-");
        }
      });
      const drain = new HttpConnectionDrain(server);
      await new Promise<void>((resolve) =>
        server.listen(0, "127.0.0.1", resolve),
      );
      const address = server.address();
      if (!address || typeof address === "string")
        throw new Error("fixture_address_missing");
      const socket = connect(address.port, "127.0.0.1");
      let data = "";
      socket.setEncoding("utf8");
      socket.on("data", (chunk) => {
        data += chunk;
      });
      const closed = once(socket, "close");
      let stopping: Promise<void> | undefined;
      try {
        await once(socket, "connect");
        socket.write(
          "GET /first HTTP/1.1\r\nHost: localhost\r\n\r\nGET /second HTTP/1.1\r\nHost: localhost\r\n\r\n",
        );
        await expect.poll(() => responses.length).toBe(2);
        drain.begin();
        stopping = new Promise<void>((resolve, reject) =>
          server.close((error) => (error ? reject(error) : resolve())),
        );
        expect(
          await Promise.race([
            stopping.then(() => "stopped"),
            delay(30).then(() => "draining"),
          ]),
        ).toBe("draining");
        if (lateRequest) {
          const late = once(server, "request");
          socket.write("GET /late HTTP/1.1\r\nHost: localhost\r\n\r\n");
          await late;
          expect(responses).toHaveLength(2);
        }
        responses[1]!.end("second-response-complete");
        responses[0]!.end("first-response-complete");
        await Promise.all([stopping, closed]);
        expect(data).toContain("first-part-");
        expect(data).toContain("first-response-complete");
        expect(data).toContain("second-response-complete");
        if (lateRequest) {
          expect(data).toContain("503 Service Unavailable");
          expect(data).toContain('"code":"server_stopping"');
        }
      } finally {
        socket.destroy();
        await (stopping ??
          new Promise<void>((resolve) => server.close(() => resolve())));
      }
    },
  );

  it("does not claim upgraded connections from the realtime owner", async () => {
    const server = createServer();
    const drain = new HttpConnectionDrain(server);
    let upgraded = false;
    server.on("upgrade", (_request, socket) => {
      upgraded = true;
      socket.write(
        "HTTP/1.1 101 Switching Protocols\r\nConnection: Upgrade\r\nUpgrade: fixture\r\n\r\n",
      );
    });
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    const address = server.address();
    if (!address || typeof address === "string")
      throw new Error("fixture_address_missing");
    const accepted = once(server, "connection");
    const socket = connect(address.port, "127.0.0.1");
    socket.resume();
    try {
      await once(socket, "connect");
      socket.write(
        "GET / HTTP/1.1\r\nHost: localhost\r\nConnection: Upgrade\r\nUpgrade: fixture\r\n\r\n",
      );
      await expect.poll(() => upgraded).toBe(true);
      drain.begin();
      expect((await accepted)[0].destroyed).toBe(false);
    } finally {
      (await accepted)[0].destroy();
      socket.destroy();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
