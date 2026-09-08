import type { IncomingMessage, Server, ServerResponse } from "node:http";
import type { Socket } from "node:net";

/** HTTP owns preconnections as well as requests; upgraded sockets belong to realtime. */
export class HttpConnectionDrain {
  private readonly connections = new Map<Socket, Set<ServerResponse>>();
  private stopping = false;

  constructor(server: Server) {
    server.on("connection", (socket) => {
      if (this.stopping) {
        socket.destroy();
        return;
      }
      this.connections.set(socket, new Set());
      socket.once("close", () => this.connections.delete(socket));
    });
    server.on("upgrade", (_request, socket) => {
      this.connections.delete(socket as Socket);
    });
  }

  accept(request: IncomingMessage, response: ServerResponse): boolean {
    const socket = request.socket;
    const responses = this.connections.get(socket);
    if (!responses) {
      // A connection rejected during shutdown must not reach the application.
      if (this.stopping && socket.destroyed) return false;
      throw new Error("http_connection_ownership_missing");
    }
    responses.add(response);
    const finished = () => {
      response.removeListener("finish", finished);
      response.removeListener("close", finished);
      responses.delete(response);
      if (this.stopping && responses.size === 0) socket.destroySoon();
    };
    response.once("finish", finished);
    response.once("close", finished);
    if (!this.stopping) return true;
    response.writeHead(503, {
      "Content-Type": "application/json",
      Connection: "close",
    });
    response.end(
      JSON.stringify({
        error: { code: "server_stopping", message: "Der Server wird beendet." },
      }),
    );
    return false;
  }

  begin(): void {
    this.stopping = true;
    for (const [socket, responses] of this.connections) {
      if (responses.size === 0) socket.destroySoon();
      // Accepted responses, including pipelined ones, drain before closing.
      // Setting Connection: close on an earlier response would truncate them.
    }
  }
}
