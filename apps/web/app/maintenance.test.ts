import { describe, expect, it } from "vitest";
import {
  buildMaintenanceMatchQuery,
  EMPTY_MAINTENANCE_FILTERS,
  findForbiddenMaintenanceMarkers,
  formatAge,
  formatBytes,
  participantsLabel,
  resolveMaintenanceServerHttp
} from "./maintenance";

describe("Backend 0.5 maintenance UI helpers", () => {
  it("builds match-list queries for the supported filters", () => {
    expect(buildMaintenanceMatchQuery(EMPTY_MAINTENANCE_FILTERS)).toBe("");
    expect(
      buildMaintenanceMatchQuery({
        status: "active",
        terminal: "false",
        mode: "human_vs_human",
        olderThanDays: "14",
        largerThanMiB: "3"
      })
    ).toBe("?status=active&terminal=false&mode=human_vs_human&olderThanDays=14&largerThanBytes=3145728");
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

  it("uses the loopback backend for locally opened maintenance pages", () => {
    expect(resolveMaintenanceServerHttp("http://192.168.178.141:8787", "127.0.0.1")).toBe("http://127.0.0.1:8787");
    expect(resolveMaintenanceServerHttp("http://192.168.178.141:8787", "localhost")).toBe("http://127.0.0.1:8787");
    expect(resolveMaintenanceServerHttp("http://192.168.178.141:8787", "192.168.178.141")).toBe("http://192.168.178.141:8787");
  });
});
