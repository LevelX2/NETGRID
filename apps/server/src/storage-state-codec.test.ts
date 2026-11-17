import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { hashState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";
import { RandomPurposeCode, type RandomPurpose } from "@netgrid/shared";
import { MultiplayerService } from "./multiplayer";
import { decodeStoredGameState, SqliteMatchStorage } from "./storage-sqlite";

describe("SQLite game state codec", () => {
  it("stores the current state once and restores compact card, random and event records", async () => {
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
      const firstCard = Object.values(state.cardInstances)[0]!;
      firstCard.strengthModifier = -2;
      firstCard.agendaPointsSpent = 0;
      firstCard.controller = firstCard.owner === "runner" ? "corp" : "runner";
      const purpose = state.randomDrawRecords[0]!.purpose;
      const aiPurpose: RandomPurpose = [
        RandomPurposeCode.AiTurnPlanSelection,
        0,
        state.stateVersion,
        123456,
      ];
      state.aiTurnPlanRandomCounter = 1;
      state.aiTurnPlanRandomDrawRecords = [
        { domain: "ai_turn_plan_selection", counter: 0, purpose: aiPurpose, value: 0.25 },
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
      expect(stored.cardInstances).toHaveLength(
        Object.keys(state.cardInstances).length,
      );
      expect(stored.cardZones.length).toBeLessThan(stored.cardInstances.length);
      expect(stored.cardZones[0]).toEqual(firstCard.zone);
      expect(stored.corp.identity).toBeGreaterThan(0);
      expect(stored.cardInstances[stored.corp.identity - 1][0]).toBe(
        state.corp.identity,
      );
      expect(
        stored.runner.grip.map((position: number) => stored.cardInstances[position - 1][0]),
      ).toEqual(state.runner.grip);
      expect(stored.cardInstances[0]).toEqual([
        firstCard.instanceId,
        firstCard.definitionId,
        0,
        (firstCard.faceup ? 1 : 0) |
          (firstCard.rezzed ? 2 : 0) |
          (firstCard.owner === "runner" ? 4 : 0) |
          (firstCard.controller === "runner" ? 8 : 0),
        firstCard.advancementCounters,
        -2,
        { agendaPointsSpent: 0 },
      ]);
      expect(stored.randomDrawRecords).toHaveLength(
        state.randomDrawRecords.length,
      );
      expect(stored.randomDrawRecords[0]).toEqual([
        state.randomDrawRecords[0]!.counter,
        purpose,
        state.randomDrawRecords[0]!.value,
      ]);
      expect(stored.aiTurnPlanRandomDrawRecords).toEqual([[0, aiPurpose, 0.25]]);
      expect(stored).not.toHaveProperty("randomPurposes");
      const corruptionCases = [
        [
          "string purpose",
          (value: typeof stored) => {
            value.randomDrawRecords[0][1] = "setup.shuffle.runner.start_stack";
          },
        ],
        [
          "dictionary index",
          (value: typeof stored) => {
            value.randomDrawRecords[0][1] = 0;
          },
        ],
        [
          "unknown purpose",
          (value: typeof stored) => {
            value.randomDrawRecords[0][1] = [9999];
          },
        ],
        [
          "extra purpose argument",
          (value: typeof stored) => {
            value.randomDrawRecords[0][1] = [...purpose, 1];
          },
        ],
        [
          "wrong Engine domain",
          (value: typeof stored) => {
            value.randomDrawRecords[0][1] = aiPurpose;
          },
        ],
        [
          "wrong AI domain",
          (value: typeof stored) => {
            value.aiTurnPlanRandomDrawRecords[0][1] = purpose;
          },
        ],
        [
          "wrong row shape",
          (value: typeof stored) => {
            value.randomDrawRecords[0].push(1);
          },
        ],
        [
          "noncontiguous cursor",
          (value: typeof stored) => {
            value.randomDrawRecords[0][0] = 1;
          },
        ],
        [
          "Engine cursor mismatch",
          (value: typeof stored) => {
            value.randomCounter += 1;
          },
        ],
        [
          "AI cursor mismatch",
          (value: typeof stored) => {
            value.aiTurnPlanRandomCounter += 1;
          },
        ],
        [
          "missing AI rows",
          (value: typeof stored) => {
            delete value.aiTurnPlanRandomDrawRecords;
          },
        ],
        [
          "invalid lower draw bound",
          (value: typeof stored) => {
            value.randomDrawRecords[0][2] = -0.01;
          },
        ],
        [
          "invalid upper draw bound",
          (value: typeof stored) => {
            value.randomDrawRecords[0][2] = 1;
          },
        ],
      ] as const;
      for (const [label, corrupt] of corruptionCases) {
        const invalid = structuredClone(stored);
        corrupt(invalid);
        expect(() => decodeStoredGameState(JSON.stringify(invalid)), label).toThrow(
          expect.objectContaining({ code: "stored_match_invalid" }),
        );
      }

      const events = db
        .prepare(
          `SELECT e.event_id AS eventId, e.public_payload_json AS publicEventJson,
            ee.event_json AS engineEventJson FROM events e
            JOIN engine_events ee USING (match_id, event_id)
            WHERE e.match_id = ? ORDER BY e.event_index`,
        )
        .all(created.matchId) as Array<{
        eventId: number;
        publicEventJson: string;
        engineEventJson: string;
      }>;
      expect(events.map((event) => event.eventId)).toEqual([1]);
      for (const event of events) {
        const publicEvent = JSON.parse(event.publicEventJson);
        expect(publicEvent).not.toHaveProperty("eventId");
        expect(publicEvent).not.toHaveProperty("stateVersionBefore");
        expect(publicEvent).not.toHaveProperty("stateVersionAfter");
        expect(publicEvent).not.toHaveProperty("stateHashAfter");
        expect(JSON.parse(event.engineEventJson)).not.toHaveProperty("eventId");
      }

      storage = new SqliteMatchStorage({ dbPath, backupDir });
      const reopened = await storage.load(created.matchId);
      expect(reopened?.gameState).toEqual(state);
      expect(reopened?.eventLog).toEqual(record.eventLog);
      expect(hashState(reopened!.gameState)).toBe(hashState(state));
      const [candidate] = await storage.listPublicMatchCandidates();
      expect(candidate?.gameState.randomDrawRecords).toEqual(
        state.randomDrawRecords,
      );

      const invalidStates = [
        { ...state, randomCounter: state.randomCounter + 1 },
        {
          ...state,
          randomDrawRecords: state.randomDrawRecords.map((draw, index) =>
            index === 0 ? { ...draw, purpose: aiPurpose } : draw,
          ),
        },
      ];
      for (const gameState of invalidStates) {
        await expect(storage.save({ ...record, gameState })).rejects.toMatchObject({
          code: "stored_match_invalid",
        });
        expect((await storage.load(created.matchId))?.gameState).toEqual(state);
      }

      db.prepare(
        "UPDATE game_states SET game_state_json = json_set(game_state_json, '$.cardInstances[0][1]', ?) WHERE match_id = ?",
      ).run("old_definition", created.matchId);
      await expect(storage.load(created.matchId)).rejects.toMatchObject({
        code: "stored_match_invalid",
      });
      db.prepare(
        "UPDATE game_states SET game_state_json = ? WHERE match_id = ?",
      ).run(row.gameStateJson, created.matchId);

      db.prepare(
        "UPDATE game_states SET game_state_json = json_set(game_state_json, '$.cardInstances[0][2]', -1) WHERE match_id = ?",
      ).run(created.matchId);
      await expect(storage.load(created.matchId)).rejects.toMatchObject({
        code: "stored_match_invalid",
      });
      db.prepare(
        "UPDATE game_states SET game_state_json = ? WHERE match_id = ?",
      ).run(row.gameStateJson, created.matchId);

      db.prepare(
        "UPDATE game_states SET game_state_json = json_set(game_state_json, '$.corp.identity', 0) WHERE match_id = ?",
      ).run(created.matchId);
      await expect(storage.load(created.matchId)).rejects.toMatchObject({
        code: "stored_match_invalid",
      });
      db.prepare(
        "UPDATE game_states SET game_state_json = ? WHERE match_id = ?",
      ).run(row.gameStateJson, created.matchId);

      db.prepare(
        "UPDATE game_states SET game_state_json = json_set(game_state_json, '$.run.runId', ?) WHERE match_id = ?",
      ).run("run_1", created.matchId);
      await expect(storage.load(created.matchId)).rejects.toMatchObject({
        code: "stored_match_invalid",
      });
      db.prepare(
        "UPDATE game_states SET game_state_json = ? WHERE match_id = ?",
      ).run(row.gameStateJson, created.matchId);

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
