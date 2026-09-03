import { appendFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { Side } from "@netgrid/shared";
import { resolveServerRuntimePaths } from "./runtime-paths";

export type ConnectionAuditEventName =
  | "server_start"
  | "server_stop"
  | "ws_handshake_denied"
  | "ws_open"
  | "ws_join_ok"
  | "ws_join_failed"
  | "ws_replaced_by_reconnect"
  | "ws_close"
  | "ws_error";

export type ConnectionAuditEvent = {
  event: ConnectionAuditEventName;
  timestamp?: string;
  pid?: number;
  profile?: string | undefined;
  url?: string | undefined;
  origin?: string | undefined;
  clientKey?: string | undefined;
  matchId?: string | undefined;
  side?: Side | undefined;
  code?: number | undefined;
  reason?: string | undefined;
  errorCode?: string | undefined;
  rateLimitCategory?: "ws_handshake" | "ws_join" | undefined;
  durationMs?: number | undefined;
  ignoredAsReplaced?: boolean | undefined;
};

export type ConnectionAuditLogger = {
  record(event: ConnectionAuditEvent): void;
};

export const noopConnectionAuditLogger: ConnectionAuditLogger = {
  record: () => undefined,
};

export function createFileConnectionAuditLogger(
  logPath?: string,
): ConnectionAuditLogger {
  const targetPath = resolve(logPath ?? defaultConnectionAuditLogPath());
  let pending = Promise.resolve();
  return {
    record(event) {
      const entry = sanitizeConnectionAuditEvent({
        ...event,
        timestamp: event.timestamp ?? new Date().toISOString(),
        pid: event.pid ?? process.pid,
      });
      pending = pending
        .then(async () => {
          await mkdir(dirname(targetPath), { recursive: true });
          await appendFile(targetPath, `${JSON.stringify(entry)}\n`, "utf8");
        })
        .catch(() => undefined);
    },
  };
}

export function createConnectionAuditLoggerFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): ConnectionAuditLogger {
  if (env.NETGRID_CONNECTION_AUDIT_LOG === "off")
    return noopConnectionAuditLogger;
  if (env.VITEST === "true" || env.NODE_ENV === "test")
    return noopConnectionAuditLogger;
  return createFileConnectionAuditLogger(
    resolveServerRuntimePaths({ env }).connectionAuditLogPath,
  );
}

function sanitizeConnectionAuditEvent(
  event: ConnectionAuditEvent,
): ConnectionAuditEvent {
  return Object.fromEntries(
    Object.entries(event).filter(
      ([, value]) => value !== undefined && value !== "",
    ),
  ) as ConnectionAuditEvent;
}

function defaultConnectionAuditLogPath(): string {
  return resolveServerRuntimePaths().connectionAuditLogPath;
}
