import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { hashState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";
import { MultiplayerService } from "./multiplayer";
import { SqliteMatchStorage } from "./storage-sqlite";

describe("SQLite game state codec", () => {
  it("stores one current state and restores both random protocols from tuple rows", async () => {
    const dir = await mkdtemp(join(tmpdir(), "netgrid-sqlite-state-codec-"));
    const dbPath = join(dir, "matches.sqlite");
    const backupDir = join(dir, "backups");
    let storage: SqliteMatchStorage | undefined;
    let db: DatabaseSync | undefined;
    try {
      storage = new SqliteMatchStorage({ dbPath, backupDir });
      const service = new MultiplayerService(storage, {
        tokenSalt: "sqlite-state-codec",
      });
      const created = await service.createMatch({
        mode: "ai_vs_ai",
        hostSide: "corp",
        seed: "sqlite-state-codec",
        isPublic: true,
      });
      const record = await storage.load(created.matchId);
      if (!record) throw new Error("The test match was not stored.");
      const state = record.gameState;
      const purpose = state.randomDrawRecords[0]!.purpose;
      state.aiTurnPlanRandomCounter = 1;
      state.aiTurnPlanRandomDrawRecords = [
        { domain: "ai_turn_plan_selection", counter: 0, purpose, value: 0.25 },
      ];
      await storage.save(record);
      storage.close();
      storage = undefined;

      db = new DatabaseSync(dbPath);
      const row = db
        .prepare(
          `SELECT record_json AS recordJson, game_state_json AS gameStateJson
         FROM matches JOIN game_states USING (match_id) WHERE match_id = ?`,
        )
        .get(created.matchId) as { recordJson: string; gameStateJson: string };
      const stored = JSON.parse(row.gameStateJson);
      expect(JSON.parse(row.recordJson)).not.toHaveProperty("gameState");
      expect(stored).not.toHaveProperty("eventLog");
      expect(stored.randomDrawRecords).toHaveLength(
        state.randomDrawRecords.length,
      );
      expect(stored.randomDrawRecords[0]).toEqual([
        state.randomDrawRecords[0]!.counter,
        0,
        state.randomDrawRecords[0]!.value,
      ]);
      expect(stored.aiTurnPlanRandomDrawRecords).toEqual([[0, 0, 0.25]]);
      expect(stored.randomPurposes[0]).toBe(purpose);

      storage = new SqliteMatchStorage({ dbPath, backupDir });
      const reopened = await storage.load(created.matchId);
      expect(reopened?.gameState).toEqual(state);
      expect(hashState(reopened!.gameState)).toBe(hashState(state));
      const [candidate] = await storage.listPublicMatchCandidates();
      expect(candidate?.gameState.randomDrawRecords).toEqual(
        state.randomDrawRecords,
      );

      db.prepare(
        "UPDATE game_states SET game_state_json = json_set(game_state_json, '$.randomDrawRecords[0][1]', -1) WHERE match_id = ?",
      ).run(created.matchId);
      await expect(storage.load(created.matchId)).rejects.toMatchObject({
        code: "stored_match_invalid",
      });
      db.prepare("DELETE FROM game_states WHERE match_id = ?").run(
        created.matchId,
      );
      await expect(storage.load(created.matchId)).rejects.toMatchObject({
        code: "stored_match_invalid",
      });
    } finally {
      db?.close();
      storage?.close();
      await rm(dir, { recursive: true, force: true });
    }
  });
});
