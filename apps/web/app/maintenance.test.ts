import { describe, expect, it } from "vitest";
import {
  buildMaintenanceCleanupRequest,
  buildMaintenanceMatchQuery,
  buildMaintenanceRecoveryLink,
  aiTraceMetaRows,
  aiTraceTitle,
  DEFAULT_MAINTENANCE_CLEANUP_FILTERS,
  EMPTY_MAINTENANCE_FILTERS,
  findForbiddenMaintenanceMarkers,
  formatAge,
  formatBytes,
  participantsLabel,
  resolveMaintenanceServerHttp
} from "./maintenance";

describe("Backend 0.5 maintenance UI helpers", () => {
  it("builds match-list queries for the supported filters", () => {
    expect(buildMaintenanceMatchQuery(EMPTY_MAINTENANCE_FILTERS)).toBe("?limit=50");
    expect(
      buildMaintenanceMatchQuery({
        status: "active",
        terminal: "false",
        mode: "human_vs_human",
        olderThanDays: "14",
        largerThanMiB: "3",
        limit: "50"
      })
    ).toBe("?status=active&terminal=false&mode=human_vs_human&olderThanDays=14&largerThanBytes=3145728&limit=50");
    expect(buildMaintenanceMatchQuery({ ...EMPTY_MAINTENANCE_FILTERS, limit: "" })).toBe("?limit=all");
  });

  it("formats storage metadata compactly", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1536)).toBe("1.5 KiB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MiB");
    expect(formatAge(42)).toBe("gerade eben");
    expect(formatAge(3600 * 26)).toBe("26 h");
  });

  it("keeps participant labels side-safe", () => {
    expect(
      participantsLabel([
        { side: "runner", displayName: "Ludwig", connected: true, lastSeenAt: "2026-05-14T10:00:00.000Z" },
        { side: "corp", displayName: "Korp KI", connected: false, lastSeenAt: "2026-05-14T10:01:00.000Z" }
      ])
    ).toBe("Runner: Ludwig · Korp: Korp KI");
  });

  it("detects forbidden markers in maintenance payloads", () => {
    expect(findForbiddenMaintenanceMarkers({ matchId: "match_1", stateHash: "fnv1a:1234" })).toEqual([]);
    expect(findForbiddenMaintenanceMarkers({ sessionToken: "secret", privatePayload: { value: true } }).length).toBeGreaterThan(0);
  });

  it("builds bounded cleanup requests with active older-than-one-hour defaults", () => {
    expect(buildMaintenanceCleanupRequest(DEFAULT_MAINTENANCE_CLEANUP_FILTERS)).toEqual({ statuses: ["active"], olderThanMinutes: 60, limit: 100, includeProtected: false });
    expect(
      buildMaintenanceCleanupRequest({
        statuses: ["active", "active", "abandoned"],
        olderThanMinutes: "90.7",
        limit: "999",
        vacuumAfter: true,
        createBackup: false,
        includeProtected: true
      })
    ).toEqual({ statuses: ["active", "abandoned"], olderThanMinutes: 90, limit: 500, includeProtected: true });
  });

  it("builds a root reconnect link from local recovery access", () => {
    expect(
      buildMaintenanceRecoveryLink(
        {
          matchId: "match_abc",
          side: "runner",
          access: "recovery_access_secret"
        },
        "http://127.0.0.1:3000/maintenance"
      )
    ).toBe("http://127.0.0.1:3000/?matchId=match_abc&side=runner&reconnectToken=recovery_access_secret");
  });

  it("uses the loopback backend for locally opened maintenance pages", () => {
    expect(resolveMaintenanceServerHttp("http://192.168.178.141:8787", "127.0.0.1")).toBe("http://127.0.0.1:8787");
    expect(resolveMaintenanceServerHttp("http://192.168.178.141:8787", "localhost")).toBe("http://127.0.0.1:8787");
    expect(resolveMaintenanceServerHttp("http://192.168.178.141:8787", "192.168.178.141")).toBe("http://192.168.178.141:8787");
  });

  it("formats AI decision trace navigation labels and meta rows", () => {
    const trace = {
      traceId: "ai_trace_1",
      matchId: "match_1",
      eventId: "evt_1",
      stateVersion: 4,
      matchVersion: 5,
      side: "corp" as const,
      turn: 4,
      decisionIndex: 2,
      selectedActionType: "install_card",
      planKind: "build_scoring_remote",
      score: 312.34,
      confidence: 0.73,
      createdAt: "2026-05-22T10:00:00.000Z",
      schemaVersion: "ai-decision-trace-v1",
      meta: {}
    };
    expect(aiTraceTitle(trace)).toBe("#2 Korp · build_scoring_remote");
    expect(aiTraceMetaRows(trace)).toContainEqual(["Vertrauen", "73%"]);
  });
});
