import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { MultiplayerService } from "./multiplayer";
import { SqliteMatchStorage } from "./storage-sqlite";

describe("SQLite maintenance match sizes", () => {
  it("includes engine, AI, and associated match payloads without JSON hydration", async () => {
    const dir = await mkdtemp(
      join(tmpdir(), "netgrid-maintenance-match-size-"),
    );
    const dbPath = join(dir, "netgrid.sqlite");
    const storage = new SqliteMatchStorage({
      dbPath,
      backupDir: join(dir, "backups"),
    });
    const matches = new MultiplayerService(storage, {
      tokenSalt: "maintenance-match-size",
    });
    const created = await matches.createMatch({
      hostSide: "runner",
      seed: "maintenance-match-size",
    });
    const database = new DatabaseSync(dbPath);
    try {
      const largeEnginePayload = "engine-event-payload".repeat(8_000);
      const largeTracePayload = "ai-decision-trace-payload".repeat(8_000);
      database
        .prepare(
          "INSERT INTO engine_events (match_id, event_id, event_index, event_json) VALUES (?, ?, ?, ?)",
        )
        .run(
          created.matchId,
          "maintenance-engine-event",
          1,
          largeEnginePayload,
        );
      database
        .prepare(
          `INSERT INTO events (match_id, event_id, event_index, state_version_before, state_version_after, state_hash_after, public_payload_json, private_payload_local_only, hidden_info_barrier) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          created.matchId,
          "maintenance-engine-event",
          1,
          1,
          1,
          "maintenance-state-hash",
          "{}",
          0,
          0,
        );
      database
        .prepare(
          `INSERT INTO ai_decision_traces (match_id, trace_id, event_id, state_version, match_version, side, turn, decision_index, created_at, schema_version, trace_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          created.matchId,
          "maintenance-ai-trace",
          "maintenance-engine-event",
          1,
          1,
          "runner",
          1,
          1,
          "2026-08-19T00:00:00.000Z",
          "test",
          largeTracePayload,
        );
      database
        .prepare(
          "INSERT INTO pending_undo (match_id, pending_undo_json) VALUES (?, ?)",
        )
        .run(created.matchId, "pending-undo-payload");
      database
        .prepare(
          "INSERT INTO start_lobbies (match_id, start_lobby_json) VALUES (?, ?)",
        )
        .run(created.matchId, "start-lobby-payload");
      const entry = (await storage.maintenanceMatches()).find(
        (match) => match.matchId === created.matchId,
      );
      const stored = database
        .prepare(
          `SELECT (SELECT COALESCE(SUM(LENGTH(event_json)), 0) FROM engine_events WHERE match_id = ?) AS engineEventBytes, (SELECT COALESCE(SUM(LENGTH(trace_json)), 0) FROM ai_decision_traces WHERE match_id = ?) AS aiDecisionTraceBytes, (SELECT COALESCE(LENGTH(pending_undo_json), 0) FROM pending_undo WHERE match_id = ?) AS pendingUndoBytes, (SELECT COALESCE(LENGTH(start_lobby_json), 0) FROM start_lobbies WHERE match_id = ?) AS startLobbyBytes`,
        )
        .get(
          created.matchId,
          created.matchId,
          created.matchId,
          created.matchId,
        ) as Record<string, number>;
      expect(entry).toBeDefined();
      expect(entry!.sizes.engineEventBytes).toBe(stored.engineEventBytes);
      expect(entry!.sizes.aiDecisionTraceBytes).toBe(
        stored.aiDecisionTraceBytes,
      );
      expect(entry!.sizes.pendingUndoBytes).toBe(stored.pendingUndoBytes);
      expect(entry!.sizes.startLobbyBytes).toBe(stored.startLobbyBytes);
      expect(entry!.sizes.approximateTotalBytes).toBe(
        Object.entries(entry!.sizes)
          .filter(([key]) => key !== "approximateTotalBytes")
          .reduce((sum, [, value]) => sum + value, 0),
      );
    } finally {
      database.close();
      matches.closeStorage();
      await rm(dir, { recursive: true, force: true });
    }
  });
});
