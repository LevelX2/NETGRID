import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, expect, it } from "vitest";
import { MultiplayerService } from "./multiplayer";
import { SqliteMatchStorage } from "./storage-sqlite";

const handles: Array<{ dir: string; service: MultiplayerService }> = [];
afterEach(async () => {
  for (const { dir, service } of handles.splice(0)) {
    service.closeStorage();
    expect(dirname(resolve(dir))).toBe(resolve(tmpdir()));
    expect(basename(dir)).toMatch(/^netgrid-maintenance-snapshotref-/);
    await rm(dir, { recursive: true, force: true });
  }
});

async function setup() {
  const dir = await mkdtemp(join(tmpdir(), "netgrid-maintenance-snapshotref-"));
  const storage = new SqliteMatchStorage({
    dbPath: join(dir, "match.sqlite"),
    backupDir: join(dir, "backups"),
  });
  const service = new MultiplayerService(storage, {
    tokenSalt: "native-snapshot-reference",
  });
  handles.push({ dir, service });
  const created = await service.createMatch({
    hostSide: "runner",
    mode: "ai_vs_ai",
    aiTraceMode: "detailed",
    seed: "native-snapshot-reference",
  });
  for (let i = 0; i < 2; i += 1) {
    const result = await service.advanceAi({
      matchId: created.matchId,
      side: "runner",
      sessionToken: created.hostSessionToken,
      mode: "single_step",
    });
    expect(result.ok).toBe(true);
  }
  const record = await service.loadForTest(created.matchId);
  expect(record).toBeDefined();
  return {
    storage,
    service,
    record: record!,
    matchId: created.matchId,
    dbPath: join(dir, "match.sqlite"),
  };
}

it("binds both real mulligan decisions to their named snapshots despite duplicate initial StateVersion", async () => {
  const { storage, service, record, matchId } = await setup();
  const initial = record.stateSnapshots.filter((s) => s.stateVersion === 0);
  expect(initial.map((s) => s.snapshotId).sort()).toEqual([
    "snap_before_1",
    "snap_initial",
  ]);
  expect(initial[0]!.stateHash).toBe(initial[1]!.stateHash);
  const source = await storage.maintenanceDecisionAnalysisSource(matchId, 1);
  expect(source?.snapshot?.snapshotId).toBe("snap_before_1");
  for (const index of [1, 2]) {
    const analysis = await service.storageMaintenanceDecisionAnalysis(
      matchId,
      index,
    );
    expect(analysis?.checkpointReplay).toMatchObject({
      provenance: "reconstructed_from_persisted_decision_sources",
    });
    const replay = analysis!.checkpointReplay as {
      validation: Record<string, boolean>;
    };
    expect(Object.values(replay.validation)).toEqual(Array(9).fill(true));
  }
});

it.each([
  [undefined, "snapshot_reference_missing"],
  ["not-a-snapshot", "snapshot_missing"],
  ["snap_before_2", "snapshot_binding_mismatch"],
] as const)(
  "fails closed for invalid persisted snapshot reference %s",
  async (snapshotId, reason) => {
    const { storage, service, record, matchId, dbPath } = await setup();
    const audit = record.aiDecisionTraces![0]!.traceJson.historicalAudit as {
      analysisSnapshot: { snapshotId?: string };
    };
    if (snapshotId === undefined) delete audit.analysisSnapshot.snapshotId;
    else audit.analysisSnapshot.snapshotId = snapshotId;
    // Decision traces are append-only. Corrupt only this owned SQLite fixture
    // to exercise the reader's integrity checks, never the application writer.
    const db = new DatabaseSync(dbPath);
    try {
      db.prepare(
        "UPDATE ai_decision_traces SET trace_json = ? WHERE match_id = ? AND decision_index = 1",
      ).run(JSON.stringify(record.aiDecisionTraces![0]!.traceJson), matchId);
    } finally {
      db.close();
    }
    const source = await storage.maintenanceDecisionAnalysisSource(matchId, 1);
    expect(source?.checkpointReplayContext === undefined).toBe(true);
    const analysis = await service.storageMaintenanceDecisionAnalysis(
      matchId,
      1,
    );
    expect(analysis?.checkpointReplay).toMatchObject({
      provenance: "unavailable",
      reason,
    });
  },
);
