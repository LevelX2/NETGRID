import { createHash, randomBytes } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, basename, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { hashState } from "@netgrid/engine";
import type { GameEvent, GameState } from "@netgrid/shared";
import type { AiDecisionTraceRecord, MatchMode, MatchStatus, MultiplayerStorage, StoredMatch } from "./multiplayer";

export const SQLITE_STORAGE_SCHEMA_VERSION = 1;
export const SQLITE_STORAGE_FORMAT = "netgrid_multiplayer_sqlite";
export const DEFAULT_SQLITE_STORAGE_PATH = "data/runtime/multiplayer/netgrid.sqlite";
export const DEFAULT_JSON_STORAGE_PATH = "data/runtime/multiplayer/matches.json";
export const DEFAULT_STORAGE_BACKUP_DIR = "data/runtime/backups";
const PARTIAL_STATE_SNAPSHOTS = Symbol("partialStateSnapshots");

type StoredMatchWithStorageFlags = StoredMatch & {
  [PARTIAL_STATE_SNAPSHOTS]?: boolean;
};

export type StorageKind = "memory" | "json" | "sqlite";

export type StorageHealth = {
  ok: true;
  kind: StorageKind;
  schemaVersion?: number;
  storageFormat?: string;
  matchCount?: number;
  database?: string;
  lastMigrationAt?: string;
};

export type SqliteMatchStorageOptions = {
  dbPath: string;
  backupDir?: string;
};

export type BackupManifest = {
  manifestVersion: 1;
  backupId: string;
  createdAt: string;
  release: "V1.0.8";
  storageKind: "sqlite";
  schemaVersion: number;
  source: "default_sqlite" | "configured_sqlite" | "pre_restore_sqlite";
  files: Array<{ name: string; sizeBytes: number; sha256: string }>;
  matchCount?: number;
  reason?: "manual" | "pre_migration" | "pre_restore" | "pre_cleanup" | "pre_compaction";
};

export type StorageMaintenanceParticipant = {
  side: "runner" | "corp";
  displayName: string;
  connected: boolean;
  lastSeenAt: string;
};

export type StorageMaintenanceTableSize = {
  key: string;
  label: string;
  rowCount: number;
  approximatePayloadBytes: number;
};

export type StorageMaintenanceMatchSizes = {
  matchRecordBytes: number;
  gameStateBytes: number;
  eventPayloadBytes: number;
  stateSnapshotBytes: number;
  deckSnapshotBytes: number;
  approximateTotalBytes: number;
};

export type StorageMaintenanceMatchEntry = {
  matchId: string;
  status: MatchStatus;
  terminal: boolean;
  mode: MatchMode;
  retentionProtected: boolean;
  retentionProtectedAt?: string;
  matchVersion: number;
  stateVersion?: number;
  stateHash?: string;
  createdAt: string;
  updatedAt: string;
  ageSeconds: number;
  participants: StorageMaintenanceParticipant[];
  eventCount: number;
  snapshotCount: number;
  sizes: StorageMaintenanceMatchSizes;
};

export type StorageMaintenanceMatchFilters = {
  status?: MatchStatus;
  terminal?: boolean;
  olderThanDays?: number;
  largerThanBytes?: number;
  mode?: MatchMode;
  limit?: number;
};

export type StorageMaintenanceCleanupFilters = {
  statuses: MatchStatus[];
  olderThanMinutes: number;
  limit?: number;
  includeProtected?: boolean;
};

export type StorageMaintenanceCleanupPolicyInput = {
  enabled: boolean;
  statuses: MatchStatus[];
  olderThanDays: number;
  limit?: number;
  includeProtected?: boolean;
  vacuumAfter?: boolean;
  createBackup?: boolean;
};

export type StorageMaintenanceCleanupPolicyLastRun = {
  startedAt: string;
  finishedAt: string;
  matchedCount: number;
  deletedCount: number;
  approximateBytes: number;
  backupId?: string;
  backupCreated: boolean;
  skippedReason?: "disabled" | "no_matches";
  errorCode?: string;
};

export type StorageMaintenanceCleanupPolicy = StorageMaintenanceCleanupPolicyInput & {
  backendOpsVersion: "Backend 0.5";
  intervalMinutes: 60;
  updatedAt?: string;
  lastRun?: StorageMaintenanceCleanupPolicyLastRun;
};

export type StorageMaintenanceCleanupPolicyRunResult = {
  backendOpsVersion: "Backend 0.5";
  generatedAt: string;
  policy: StorageMaintenanceCleanupPolicy;
  preview?: StorageMaintenanceCleanupPreview;
  applyResult?: StorageMaintenanceCleanupApplyResult;
  skippedReason?: "disabled" | "no_matches";
};

export type StorageMaintenanceCleanupPreview = {
  backendOpsVersion: "Backend 0.5";
  generatedAt: string;
  previewId: string;
  filters: StorageMaintenanceCleanupFilters;
  matchCount: number;
  statusCounts: Partial<Record<MatchStatus, number>>;
  approximateBytes: number;
  oldestUpdatedAt?: string;
  newestUpdatedAt?: string;
  matches: StorageMaintenanceMatchEntry[];
  warnings: string[];
};

export type StorageMaintenanceCleanupApplyInput = {
  filters: StorageMaintenanceCleanupFilters;
  previewId: string;
  createBackup?: boolean;
  vacuumAfter?: boolean;
};

export type StorageMaintenanceCleanupApplyResult = {
  backendOpsVersion: "Backend 0.5";
  generatedAt: string;
  previewId: string;
  filters: StorageMaintenanceCleanupFilters;
  deletedCount: number;
  deletedMatchIds: string[];
  approximateBytes: number;
  backup?: {
    backupDir: string;
    backupId: string;
    createdAt: string;
  };
  backupCreated: boolean;
  integrityCheck: "ok";
  vacuum: {
    requested: boolean;
    performed: boolean;
  };
  database: {
    beforeBytes: number;
    afterDeleteBytes: number;
    afterVacuumBytes?: number;
  };
};

export type StorageMaintenanceSnapshotCompactionResult = {
  backendOpsVersion: "Backend 0.5";
  generatedAt: string;
  backup: {
    backupDir: string;
    backupId: string;
    createdAt: string;
  };
  backupCreated: true;
  matchesScanned: number;
  compactedMatchCount: number;
  engineEventsBackfilled: number;
  recordRowsCompacted: number;
  gameStateRowsCompacted: number;
  stateSnapshotRowsCompacted: number;
  integrityCheck: "ok";
  database: {
    beforeBytes: number;
    afterRewriteBytes: number;
    beforePayloadBytes: number;
    afterPayloadBytes: number;
  };
};

export type StorageMaintenanceSummary = {
  backendOpsVersion: "Backend 0.5";
  generatedAt: string;
  database: {
    fileName: string;
    fileSizeBytes: number;
    pageSize: number;
    pageCount: number;
    freelistCount: number;
  };
  schemaVersion: number;
  storageFormat: string;
  matchCount: number;
  terminalCount: number;
  nonTerminalCount: number;
  matchCountsByStatus: Partial<Record<MatchStatus, number>>;
  matchCountsByMode: Partial<Record<MatchMode, number>>;
  oldestMatchCreatedAt?: string;
  newestMatchUpdatedAt?: string;
  tableSizes: StorageMaintenanceTableSize[];
  largestMatches: StorageMaintenanceMatchEntry[];
};

export type StorageMaintenanceMatchDetail = StorageMaintenanceMatchEntry & {
  tableRows: {
    events: number;
    stateSnapshots: number;
    actionReceipts: number;
    undoSnapshots: number;
    pendingUndo: number;
    startLobbies: number;
    deckSnapshotsRedacted: number;
    aiDecisionTraces: number;
  };
  cleanupAssessment: {
    eligibleInReadOnlySlice: false;
    recommendation: "not_active";
    reason: string;
  };
};

export type StorageMaintenanceAiDecisionTraceMatchEntry = {
  matchId: string;
  status: MatchStatus;
  mode: MatchMode;
  aiTraceMode: "summary" | "detailed";
  traceCount: number;
  createdAt: string;
  updatedAt: string;
  firstTraceAt?: string;
  lastTraceAt?: string;
};

export type StorageMaintenanceAiDecisionTraceIndexEntry = {
  traceId: string;
  matchId: string;
  eventId: string;
  stateVersion: number;
  matchVersion: number;
  side: "runner" | "corp";
  turn: number;
  decisionIndex: number;
  selectedActionId?: string;
  selectedActionType?: string;
  planKind?: string;
  score?: number;
  confidence?: number;
  createdAt: string;
  schemaVersion: string;
  meta: Record<string, unknown>;
};

export type StorageMaintenanceAiDecisionTraceDetail = StorageMaintenanceAiDecisionTraceIndexEntry & {
  detail: Record<string, unknown>;
};

export class StorageError extends Error {
  constructor(
    readonly code:
      | "storage_corrupt"
      | "schema_too_new"
      | "schema_too_old"
      | "schema_missing"
      | "stored_match_invalid"
      | "backup_invalid"
      | "backup_checksum_mismatch"
      | "backup_schema_unsupported",
    message: string
  ) {
    super(message);
    this.name = "StorageError";
  }
}

export class SqliteMatchStorage implements MultiplayerStorage {
  private readonly db: DatabaseSync;
  private readonly dbPath: string;
  private readonly backupDir: string;

  constructor(options: SqliteMatchStorageOptions) {
    this.dbPath = resolve(options.dbPath);
    this.backupDir = resolve(options.backupDir ?? DEFAULT_STORAGE_BACKUP_DIR);
    mkdirSync(dirname(this.dbPath), { recursive: true });
    mkdirSync(this.backupDir, { recursive: true });
    try {
      this.db = new DatabaseSync(this.dbPath);
      this.db.exec("PRAGMA foreign_keys = ON");
      this.db.exec("PRAGMA journal_mode = DELETE");
      this.ensureSchema();
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError("storage_corrupt", "Storage konnte nicht geöffnet werden. Bitte aus einem lokalen Backup wiederherstellen.");
    }
  }

  async load(matchId: string, options: { includeStateSnapshots?: boolean } = {}): Promise<StoredMatch | undefined> {
    const row = this.db.prepare("SELECT record_json FROM matches WHERE match_id = ?").get(matchId) as { record_json?: string } | undefined;
    if (!row?.record_json) return undefined;
    return this.recordFromJson(matchId, row.record_json, options);
  }

  async save(record: StoredMatch): Promise<void> {
    validateStoredMatch(record);
    this.transaction(() => this.saveRecord(record));
  }

  async list(): Promise<StoredMatch[]> {
    const rows = this.db.prepare("SELECT match_id, record_json FROM matches ORDER BY created_at ASC").all() as Array<{ match_id: string; record_json: string }>;
    return rows.map((row) => this.recordFromJson(row.match_id, row.record_json));
  }

  async listOpenMatchCandidates(): Promise<StoredMatch[]> {
    const rows = this.db
      .prepare("SELECT match_id, record_json FROM matches WHERE mode = ? AND status = ? ORDER BY created_at ASC")
      .all("human_vs_human", "pending") as Array<{ match_id: string; record_json: string }>;
    return rows.map((row) => this.recordFromJson(row.match_id, row.record_json));
  }

  async health(): Promise<StorageHealth> {
    const schemaVersion = Number(this.meta("schema_version") ?? SQLITE_STORAGE_SCHEMA_VERSION);
    return {
      ok: true,
      kind: "sqlite",
      schemaVersion,
      storageFormat: this.meta("storage_format") ?? SQLITE_STORAGE_FORMAT,
      matchCount: this.matchCount(),
      database: basename(this.dbPath),
      ...(this.meta("last_migration_at") ? { lastMigrationAt: this.meta("last_migration_at")! } : {})
    };
  }

  async backup(reason: BackupManifest["reason"] = "manual"): Promise<{ backupDir: string; manifest: BackupManifest }> {
    return createSqliteStorageBackup({
      dbPath: this.dbPath,
      backupDir: this.backupDir,
      schemaVersion: Number(this.meta("schema_version") ?? SQLITE_STORAGE_SCHEMA_VERSION),
      matchCount: this.matchCount(),
      reason,
      source: reason === "pre_restore" ? "pre_restore_sqlite" : this.dbPath.endsWith(DEFAULT_SQLITE_STORAGE_PATH) ? "default_sqlite" : "configured_sqlite"
    });
  }

  async maintenanceSummary(now = new Date()): Promise<StorageMaintenanceSummary> {
    const matches = this.maintenanceMatchesInternal({}, now);
    const matchCountsByStatus: Partial<Record<MatchStatus, number>> = {};
    const matchCountsByMode: Partial<Record<MatchMode, number>> = {};
    for (const match of matches) {
      matchCountsByStatus[match.status] = (matchCountsByStatus[match.status] ?? 0) + 1;
      matchCountsByMode[match.mode] = (matchCountsByMode[match.mode] ?? 0) + 1;
    }
    const terminalCount = matches.filter((match) => match.terminal).length;
    const oldestMatchCreatedAt = matches.map((match) => match.createdAt).sort()[0];
    const newestMatchUpdatedAt = matches
      .map((match) => match.updatedAt)
      .sort()
      .at(-1);
    return {
      backendOpsVersion: "Backend 0.5",
      generatedAt: now.toISOString(),
      database: {
        fileName: basename(this.dbPath),
        fileSizeBytes: existsSync(this.dbPath) ? statSync(this.dbPath).size : 0,
        pageSize: this.pragmaNumber("page_size"),
        pageCount: this.pragmaNumber("page_count"),
        freelistCount: this.pragmaNumber("freelist_count")
      },
      schemaVersion: Number(this.meta("schema_version") ?? SQLITE_STORAGE_SCHEMA_VERSION),
      storageFormat: this.meta("storage_format") ?? SQLITE_STORAGE_FORMAT,
      matchCount: matches.length,
      terminalCount,
      nonTerminalCount: matches.length - terminalCount,
      matchCountsByStatus,
      matchCountsByMode,
      ...(oldestMatchCreatedAt ? { oldestMatchCreatedAt } : {}),
      ...(newestMatchUpdatedAt ? { newestMatchUpdatedAt } : {}),
      tableSizes: this.maintenanceTableSizes(),
      largestMatches: [...matches].sort((a, b) => b.sizes.approximateTotalBytes - a.sizes.approximateTotalBytes).slice(0, 8)
    };
  }

  async maintenanceMatches(filters: StorageMaintenanceMatchFilters = {}, now = new Date()): Promise<StorageMaintenanceMatchEntry[]> {
    return this.maintenanceMatchesInternal(filters, now);
  }

  async maintenanceMatchDetail(matchId: string, now = new Date()): Promise<StorageMaintenanceMatchDetail | undefined> {
    const entry = this.maintenanceMatchesInternal({}, now).find((match) => match.matchId === matchId);
    if (!entry) return undefined;
    const rows = this.db
      .prepare(
        `SELECT
          (SELECT COUNT(*) FROM events WHERE match_id = ?) AS events,
          (SELECT COUNT(*) FROM state_snapshots WHERE match_id = ?) AS stateSnapshots,
          (SELECT COUNT(*) FROM action_receipts WHERE match_id = ?) AS actionReceipts,
          (SELECT COUNT(*) FROM undo_snapshots WHERE match_id = ?) AS undoSnapshots,
          (SELECT COUNT(*) FROM pending_undo WHERE match_id = ?) AS pendingUndo,
          (SELECT COUNT(*) FROM start_lobbies WHERE match_id = ?) AS startLobbies,
          (SELECT COUNT(*) FROM private_deck_snapshots WHERE match_id = ?) AS deckSnapshotsRedacted,
          (SELECT COUNT(*) FROM ai_decision_traces WHERE match_id = ?) AS aiDecisionTraces`
      )
      .get(matchId, matchId, matchId, matchId, matchId, matchId, matchId, matchId) as {
      events: number;
      stateSnapshots: number;
      actionReceipts: number;
      undoSnapshots: number;
      pendingUndo: number;
      startLobbies: number;
      deckSnapshotsRedacted: number;
      aiDecisionTraces: number;
    };
    return {
      ...entry,
      tableRows: {
        events: Number(rows.events),
        stateSnapshots: Number(rows.stateSnapshots),
        actionReceipts: Number(rows.actionReceipts),
        undoSnapshots: Number(rows.undoSnapshots),
        pendingUndo: Number(rows.pendingUndo),
        startLobbies: Number(rows.startLobbies),
        deckSnapshotsRedacted: Number(rows.deckSnapshotsRedacted),
        aiDecisionTraces: Number(rows.aiDecisionTraces)
      },
      cleanupAssessment: {
        eligibleInReadOnlySlice: false,
        recommendation: "not_active",
        reason: "Backend 0.5 erster Schnitt ist read-only; echte Löschung bleibt bis Backup-, Dry-Run- und Restore-Tests gesperrt."
      }
    };
  }

  async maintenanceAiDecisionTraceMatches(): Promise<StorageMaintenanceAiDecisionTraceMatchEntry[]> {
    const rows = this.db
      .prepare(
        `SELECT
          m.match_id AS matchId,
          m.status AS status,
          m.mode AS mode,
          m.created_at AS createdAt,
          m.updated_at AS updatedAt,
          m.record_json AS recordJson,
          COUNT(t.trace_id) AS traceCount,
          MIN(t.created_at) AS firstTraceAt,
          MAX(t.created_at) AS lastTraceAt
         FROM matches m
         LEFT JOIN ai_decision_traces t ON t.match_id = m.match_id
         GROUP BY m.match_id
         ORDER BY COALESCE(lastTraceAt, m.updated_at) DESC, m.updated_at DESC`
      )
      .all() as Array<{ matchId: string; status: MatchStatus; mode: MatchMode; createdAt: string; updatedAt: string; recordJson: string; traceCount: number; firstTraceAt?: string; lastTraceAt?: string }>;
    return rows.flatMap((row) => {
      const record = JSON.parse(row.recordJson) as StoredMatch;
      const aiTraceMode = record.match.aiTraceMode === "summary" ? "summary" : record.match.aiTraceMode === "detailed" ? "detailed" : undefined;
      if (!aiTraceMode && Number(row.traceCount) === 0) return [];
      return [{
        matchId: row.matchId,
        status: row.status,
        mode: row.mode,
        aiTraceMode: aiTraceMode ?? "detailed",
        traceCount: Number(row.traceCount),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        ...(row.firstTraceAt ? { firstTraceAt: row.firstTraceAt } : {}),
        ...(row.lastTraceAt ? { lastTraceAt: row.lastTraceAt } : {})
      }];
    });
  }

  async maintenanceAiDecisionTraceIndex(matchId: string, filters: { afterDecisionIndex?: number } = {}): Promise<StorageMaintenanceAiDecisionTraceIndexEntry[]> {
    if (!this.tableExists("ai_decision_traces")) return [];
    return this.aiDecisionTraceRecords(matchId, filters).map((trace) => aiDecisionTraceIndexEntry(trace));
  }

  async maintenanceAiDecisionTraceDetail(traceId: string): Promise<StorageMaintenanceAiDecisionTraceDetail | undefined> {
    if (!this.tableExists("ai_decision_traces")) return undefined;
    const row = this.db.prepare("SELECT match_id AS matchId FROM ai_decision_traces WHERE trace_id = ? LIMIT 1").get(traceId) as { matchId?: string } | undefined;
    if (!row?.matchId) return undefined;
    const trace = this.aiDecisionTraceRecords(row.matchId).find((candidate) => candidate.traceId === traceId);
    return trace ? { ...aiDecisionTraceIndexEntry(trace), detail: trace.traceJson } : undefined;
  }

  async maintenanceCleanupPreview(filters: StorageMaintenanceCleanupFilters, now = new Date()): Promise<StorageMaintenanceCleanupPreview> {
    return this.maintenanceCleanupPreviewInternal(filters, now);
  }

  async maintenanceCleanupApply(input: StorageMaintenanceCleanupApplyInput, now = new Date()): Promise<StorageMaintenanceCleanupApplyResult> {
    const preview = this.maintenanceCleanupPreviewInternal(input.filters, now);
    if (preview.previewId !== input.previewId) throw new Error("maintenance_preview_mismatch");
    if (preview.matchCount === 0) throw new Error("maintenance_no_matches");

    const beforeBytes = this.databaseSizeBytes();
    const backup = input.createBackup === true ? await this.backup("pre_cleanup") : undefined;
    const deletedMatchIds = preview.matches.map((match) => match.matchId);
    const deletedCount = this.deleteWholeMatches(deletedMatchIds);
    const afterDeleteBytes = this.databaseSizeBytes();
    const integrityCheck = this.integrityCheck();
    if (integrityCheck !== "ok") throw new StorageError("storage_corrupt", "Storage-Integritätsprüfung ist fehlgeschlagen.");

    let afterVacuumBytes: number | undefined;
    if (input.vacuumAfter && deletedCount > 0) {
      this.db.exec("VACUUM");
      afterVacuumBytes = this.databaseSizeBytes();
    }

    return {
      backendOpsVersion: "Backend 0.5",
      generatedAt: now.toISOString(),
      previewId: preview.previewId,
      filters: preview.filters,
      deletedCount,
      deletedMatchIds,
      approximateBytes: preview.approximateBytes,
      backupCreated: Boolean(backup),
      ...(backup
        ? {
            backup: {
              backupDir: backup.backupDir,
              backupId: backup.manifest.backupId,
              createdAt: backup.manifest.createdAt
            }
          }
        : {}),
      integrityCheck,
      vacuum: {
        requested: input.vacuumAfter === true,
        performed: input.vacuumAfter === true && deletedCount > 0
      },
      database: {
        beforeBytes,
        afterDeleteBytes,
        ...(afterVacuumBytes !== undefined ? { afterVacuumBytes } : {})
      }
    };
  }

  async maintenanceCompactSnapshots(now = new Date()): Promise<StorageMaintenanceSnapshotCompactionResult> {
    const generatedAt = now.toISOString();
    const beforeBytes = this.databaseSizeBytes();
    const beforePayloadBytes = this.compactionPayloadBytes();
    const backup = await this.backup("pre_compaction");
    const rows = this.db.prepare("SELECT match_id AS matchId, record_json AS recordJson FROM matches ORDER BY created_at ASC").all() as Array<{ matchId: string; recordJson: string }>;
    const result = {
      compactedMatchIds: new Set<string>(),
      engineEventsBackfilled: 0,
      recordRowsCompacted: 0,
      gameStateRowsCompacted: 0,
      stateSnapshotRowsCompacted: 0
    };

    this.transaction(() => {
      const updateMatch = this.db.prepare("UPDATE matches SET record_json = ? WHERE match_id = ?");
      const updateGameState = this.db.prepare("UPDATE game_states SET game_state_json = ? WHERE match_id = ?");
      const updateSnapshot = this.db.prepare("UPDATE state_snapshots SET game_state_json = ? WHERE match_id = ? AND snapshot_id = ?");
      const insertEngineEvent = this.db.prepare(
        `INSERT OR IGNORE INTO engine_events (match_id, event_id, event_index, event_json)
         VALUES (?, ?, ?, ?)`
      );

      for (const row of rows) {
        const record = JSON.parse(row.recordJson) as StoredMatch;
        const gameStateRow = this.db.prepare("SELECT game_state_json AS gameStateJson FROM game_states WHERE match_id = ?").get(row.matchId) as { gameStateJson?: string | null } | undefined;
        const gameState = gameStateRow?.gameStateJson ? (JSON.parse(gameStateRow.gameStateJson) as GameState) : undefined;
        const snapshotRows = this.db
          .prepare("SELECT snapshot_id AS snapshotId, game_state_json AS gameStateJson FROM state_snapshots WHERE match_id = ? ORDER BY state_version ASC")
          .all(row.matchId) as Array<{ snapshotId: string; gameStateJson: string }>;
        const snapshots = snapshotRows.map((snapshot) => ({
          snapshotId: snapshot.snapshotId,
          gameState: JSON.parse(snapshot.gameStateJson) as GameState
        }));

        const engineEventCount = Number((this.db.prepare("SELECT COUNT(*) AS count FROM engine_events WHERE match_id = ?").get(row.matchId) as { count: number }).count);
        if (engineEventCount === 0) {
          const engineEvents = collectLegacyEngineEvents(record, gameState, snapshots.map((snapshot) => snapshot.gameState));
          engineEvents.forEach((event, index) => {
            insertEngineEvent.run(row.matchId, event.eventId, index, JSON.stringify(event));
          });
          result.engineEventsBackfilled += engineEvents.length;
        }

        const compactRecordJson = JSON.stringify(compactRecordForStorage(record));
        if (compactRecordJson !== row.recordJson) {
          updateMatch.run(compactRecordJson, row.matchId);
          result.recordRowsCompacted += 1;
          result.compactedMatchIds.add(row.matchId);
        }

        if (gameState && gameStateRow?.gameStateJson) {
          const compactGameStateJson = JSON.stringify(gameStateForStorage(gameState));
          if (compactGameStateJson !== gameStateRow.gameStateJson) {
            updateGameState.run(compactGameStateJson, row.matchId);
            result.gameStateRowsCompacted += 1;
            result.compactedMatchIds.add(row.matchId);
          }
        }

        for (const snapshot of snapshots) {
          const original = snapshotRows.find((candidate) => candidate.snapshotId === snapshot.snapshotId);
          const compactSnapshotJson = JSON.stringify(gameStateForStorage(snapshot.gameState));
          if (original && compactSnapshotJson !== original.gameStateJson) {
            updateSnapshot.run(compactSnapshotJson, row.matchId, snapshot.snapshotId);
            result.stateSnapshotRowsCompacted += 1;
            result.compactedMatchIds.add(row.matchId);
          }
        }
      }
    });

    const integrityCheck = this.integrityCheck();
    if (integrityCheck !== "ok") throw new StorageError("storage_corrupt", "Storage-Integritätsprüfung ist fehlgeschlagen.");
    return {
      backendOpsVersion: "Backend 0.5",
      generatedAt,
      backup: {
        backupDir: backup.backupDir,
        backupId: backup.manifest.backupId,
        createdAt: backup.manifest.createdAt
      },
      backupCreated: true,
      matchesScanned: rows.length,
      compactedMatchCount: result.compactedMatchIds.size,
      engineEventsBackfilled: result.engineEventsBackfilled,
      recordRowsCompacted: result.recordRowsCompacted,
      gameStateRowsCompacted: result.gameStateRowsCompacted,
      stateSnapshotRowsCompacted: result.stateSnapshotRowsCompacted,
      integrityCheck,
      database: {
        beforeBytes,
        afterRewriteBytes: this.databaseSizeBytes(),
        beforePayloadBytes,
        afterPayloadBytes: this.compactionPayloadBytes()
      }
    };
  }

  async maintenanceCleanupPolicy(): Promise<StorageMaintenanceCleanupPolicy> {
    return this.maintenanceCleanupPolicyInternal();
  }

  async setMaintenanceCleanupPolicy(input: StorageMaintenanceCleanupPolicyInput, now = new Date()): Promise<StorageMaintenanceCleanupPolicy> {
    const current = this.maintenanceCleanupPolicyInternal();
    const policy = normalizeCleanupPolicy(input, now.toISOString(), current.lastRun);
    this.setMeta("maintenance_cleanup_policy_json", JSON.stringify(policy), now.toISOString());
    return policy;
  }

  async runMaintenanceCleanupPolicy(now = new Date()): Promise<StorageMaintenanceCleanupPolicyRunResult> {
    const policy = this.maintenanceCleanupPolicyInternal();
    const startedAt = now.toISOString();
    if (!policy.enabled) {
      const nextPolicy = this.recordCleanupPolicyRun(policy, {
        startedAt,
        finishedAt: startedAt,
        matchedCount: 0,
        deletedCount: 0,
        approximateBytes: 0,
        backupCreated: false,
        skippedReason: "disabled"
      });
      return { backendOpsVersion: "Backend 0.5", generatedAt: startedAt, policy: nextPolicy, skippedReason: "disabled" };
    }

    const filters: StorageMaintenanceCleanupFilters = {
      statuses: policy.statuses,
      olderThanMinutes: policy.olderThanDays * 24 * 60,
      ...(policy.limit !== undefined ? { limit: policy.limit } : {}),
      ...(policy.includeProtected !== undefined ? { includeProtected: policy.includeProtected } : {})
    };
    const preview = this.maintenanceCleanupPreviewInternal(filters, now);
    if (preview.matchCount === 0) {
      const finishedAt = new Date().toISOString();
      const nextPolicy = this.recordCleanupPolicyRun(policy, {
        startedAt,
        finishedAt,
        matchedCount: 0,
        deletedCount: 0,
        approximateBytes: 0,
        backupCreated: false,
        skippedReason: "no_matches"
      });
      return { backendOpsVersion: "Backend 0.5", generatedAt: finishedAt, policy: nextPolicy, preview, skippedReason: "no_matches" };
    }

    try {
      const applyResult = await this.maintenanceCleanupApply({
        filters,
        previewId: preview.previewId,
        createBackup: policy.createBackup === true,
        ...(policy.vacuumAfter === true ? { vacuumAfter: true } : {})
      }, now);
      const finishedAt = new Date().toISOString();
      const nextPolicy = this.recordCleanupPolicyRun(policy, {
        startedAt,
        finishedAt,
        matchedCount: preview.matchCount,
        deletedCount: applyResult.deletedCount,
        approximateBytes: applyResult.approximateBytes,
        backupCreated: applyResult.backupCreated,
        ...(applyResult.backup ? { backupId: applyResult.backup.backupId } : {})
      });
      return { backendOpsVersion: "Backend 0.5", generatedAt: finishedAt, policy: nextPolicy, preview, applyResult };
    } catch (error) {
      const finishedAt = new Date().toISOString();
      const nextPolicy = this.recordCleanupPolicyRun(policy, {
        startedAt,
        finishedAt,
        matchedCount: preview.matchCount,
        deletedCount: 0,
        approximateBytes: preview.approximateBytes,
        backupCreated: false,
        errorCode: error instanceof Error ? error.message : "cleanup_failed"
      });
      return { backendOpsVersion: "Backend 0.5", generatedAt: finishedAt, policy: nextPolicy, preview };
    }
  }

  async maintenanceSetRetentionProtection(matchId: string, protectedValue: boolean, now = new Date()): Promise<StorageMaintenanceMatchDetail | undefined> {
    const record = await this.load(matchId);
    if (!record) return undefined;
    const nowIso = now.toISOString();
    record.match.retentionProtection = protectedValue ? { protected: true, protectedAt: nowIso } : { protected: false };
    record.match.updatedAt = nowIso;
    record.match.matchVersion += 1;
    await this.save(record);
    return this.maintenanceMatchDetail(matchId, now);
  }

  close(): void {
    this.db.close();
  }

  private ensureSchema(): void {
    const hasMeta = this.tableExists("storage_meta");
    if (!hasMeta) {
      if (this.userTableCount() > 0) {
        throw new StorageError("schema_missing", "Storage-Schema konnte nicht sicher erkannt werden.");
      }
      this.createSchema();
      return;
    }
    const version = Number(this.meta("schema_version") ?? 0);
    if (!Number.isInteger(version)) throw new StorageError("schema_missing", "Storage-Schema konnte nicht sicher erkannt werden.");
    if (version > SQLITE_STORAGE_SCHEMA_VERSION) throw new StorageError("schema_too_new", "Storage ist neuer als dieser Servercode.");
    if (version < SQLITE_STORAGE_SCHEMA_VERSION) this.migrate(version);
    this.createSchema();
  }

  private createSchema(): void {
    this.transaction(() => {
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS storage_meta (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS matches (
          match_id TEXT PRIMARY KEY,
          status TEXT NOT NULL,
          mode TEXT NOT NULL,
          match_version INTEGER NOT NULL,
          seed TEXT,
          baseline_json TEXT NOT NULL,
          settings_json TEXT NOT NULL,
          lifecycle_json TEXT,
          record_json TEXT NOT NULL,
          state_version INTEGER,
          state_hash TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sessions (
          match_id TEXT NOT NULL,
          session_id TEXT NOT NULL,
          side TEXT NOT NULL,
          display_name TEXT NOT NULL,
          session_token_hash TEXT NOT NULL,
          reconnect_token_hash TEXT NOT NULL,
          connected INTEGER NOT NULL,
          created_at TEXT NOT NULL,
          last_seen_at TEXT NOT NULL,
          PRIMARY KEY (match_id, session_id),
          FOREIGN KEY (match_id) REFERENCES matches(match_id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS tokens (
          match_id TEXT NOT NULL,
          token_id TEXT NOT NULL,
          kind TEXT NOT NULL,
          allowed_side TEXT NOT NULL,
          token_hash TEXT NOT NULL,
          created_at TEXT NOT NULL,
          expires_at TEXT,
          revoked_at TEXT,
          used_at TEXT,
          PRIMARY KEY (match_id, token_id),
          FOREIGN KEY (match_id) REFERENCES matches(match_id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS game_states (
          match_id TEXT PRIMARY KEY,
          state_version INTEGER,
          state_hash TEXT,
          game_state_json TEXT,
          FOREIGN KEY (match_id) REFERENCES matches(match_id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS events (
          match_id TEXT NOT NULL,
          event_id TEXT NOT NULL,
          event_index INTEGER NOT NULL,
          state_version_before INTEGER NOT NULL,
          state_version_after INTEGER NOT NULL,
          state_hash_after TEXT NOT NULL,
          public_payload_json TEXT NOT NULL,
          private_payload_local_only INTEGER NOT NULL,
          hidden_info_barrier INTEGER NOT NULL,
          PRIMARY KEY (match_id, event_id),
          FOREIGN KEY (match_id) REFERENCES matches(match_id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS engine_events (
          match_id TEXT NOT NULL,
          event_id TEXT NOT NULL,
          event_index INTEGER NOT NULL,
          event_json TEXT NOT NULL,
          PRIMARY KEY (match_id, event_id),
          FOREIGN KEY (match_id) REFERENCES matches(match_id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS ai_decision_traces (
          match_id TEXT NOT NULL,
          trace_id TEXT NOT NULL,
          event_id TEXT NOT NULL,
          state_version INTEGER NOT NULL,
          match_version INTEGER NOT NULL,
          side TEXT NOT NULL,
          turn INTEGER NOT NULL,
          decision_index INTEGER NOT NULL,
          selected_action_id TEXT,
          selected_action_type TEXT,
          plan_kind TEXT,
          score REAL,
          confidence REAL,
          created_at TEXT NOT NULL,
          schema_version TEXT NOT NULL,
          trace_json TEXT NOT NULL,
          PRIMARY KEY (match_id, trace_id),
          FOREIGN KEY (match_id) REFERENCES matches(match_id) ON DELETE CASCADE,
          FOREIGN KEY (match_id, event_id) REFERENCES events(match_id, event_id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_ai_decision_traces_match_decision ON ai_decision_traces(match_id, decision_index);
        CREATE INDEX IF NOT EXISTS idx_ai_decision_traces_trace_id ON ai_decision_traces(trace_id);
        CREATE TABLE IF NOT EXISTS action_receipts (
          match_id TEXT NOT NULL,
          idempotency_key TEXT NOT NULL,
          side TEXT NOT NULL,
          accepted INTEGER NOT NULL,
          state_version_before INTEGER NOT NULL,
          state_version_after INTEGER NOT NULL,
          state_hash_after TEXT NOT NULL,
          error_code TEXT,
          PRIMARY KEY (match_id, idempotency_key, side),
          FOREIGN KEY (match_id) REFERENCES matches(match_id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS state_snapshots (
          match_id TEXT NOT NULL,
          snapshot_id TEXT NOT NULL,
          state_version INTEGER NOT NULL,
          match_version INTEGER NOT NULL,
          state_hash TEXT NOT NULL,
          game_state_json TEXT NOT NULL,
          created_at TEXT NOT NULL,
          hidden_info_barrier INTEGER NOT NULL,
          PRIMARY KEY (match_id, snapshot_id),
          FOREIGN KEY (match_id) REFERENCES matches(match_id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS undo_snapshots (
          match_id TEXT NOT NULL,
          undo_request_id TEXT NOT NULL,
          target_event_id TEXT NOT NULL,
          snapshot_id TEXT NOT NULL,
          requested_by TEXT NOT NULL,
          status TEXT NOT NULL,
          hidden_info_safe INTEGER NOT NULL,
          PRIMARY KEY (match_id, undo_request_id),
          FOREIGN KEY (match_id) REFERENCES matches(match_id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS pending_undo (
          match_id TEXT PRIMARY KEY,
          pending_undo_json TEXT NOT NULL,
          FOREIGN KEY (match_id) REFERENCES matches(match_id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS private_deck_snapshots (
          match_id TEXT PRIMARY KEY,
          private_deck_snapshots_json TEXT NOT NULL,
          FOREIGN KEY (match_id) REFERENCES matches(match_id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS start_lobbies (
          match_id TEXT PRIMARY KEY,
          start_lobby_json TEXT NOT NULL,
          FOREIGN KEY (match_id) REFERENCES matches(match_id) ON DELETE CASCADE
        );
      `);
      const now = new Date().toISOString();
      this.setMeta("schema_version", String(SQLITE_STORAGE_SCHEMA_VERSION), now);
      this.setMeta("storage_format", SQLITE_STORAGE_FORMAT, now);
      if (!this.meta("created_at")) this.setMeta("created_at", now, now);
      if (!this.meta("last_migration_at")) this.setMeta("last_migration_at", now, now);
    });
  }

  private migrate(version: number): void {
    if (version !== 0) throw new StorageError("schema_too_old", "Storage-Schema ist älter als die bekannten Migrationen.");
    createSqliteStorageBackup({
      dbPath: this.dbPath,
      backupDir: this.backupDir,
      schemaVersion: version,
      matchCount: 0,
      reason: "pre_migration",
      source: "configured_sqlite"
    });
    this.createSchema();
  }

  private recordFromJson(matchId: string, recordJson: string, options: { includeStateSnapshots?: boolean } = {}): StoredMatch {
    const record = JSON.parse(recordJson) as StoredMatchWithStorageFlags;
    this.hydrateRecordFromTables(matchId, record, options);
    validateStoredMatch(record);
    return record;
  }

  private hydrateRecordFromTables(matchId: string, record: StoredMatchWithStorageFlags, options: { includeStateSnapshots?: boolean } = {}): void {
    if (!this.tableExists("matches")) return;
    let engineEventLog: GameEvent[] | undefined;

    if (this.tableExists("sessions")) {
      const sessions = this.db
        .prepare("SELECT session_id AS sessionId, side, display_name AS displayName, session_token_hash AS sessionTokenHash, reconnect_token_hash AS reconnectTokenHash, connected, created_at AS createdAt, last_seen_at AS lastSeenAt FROM sessions WHERE match_id = ? ORDER BY created_at ASC")
        .all(matchId) as Array<{
        sessionId: string;
        side: StoredMatch["sessions"][number]["side"];
        displayName: string;
        sessionTokenHash: string;
        reconnectTokenHash: string;
        connected: number;
        createdAt: string;
        lastSeenAt: string;
      }>;
      if (sessions.length > 0) record.sessions = sessions.map((session) => ({ ...session, matchId, connected: session.connected === 1 }));
    }

    if (this.tableExists("tokens")) {
      const tokens = this.db
        .prepare("SELECT token_id AS tokenId, kind, allowed_side AS allowedSide, token_hash AS tokenHash, created_at AS createdAt, expires_at AS expiresAt, revoked_at AS revokedAt, used_at AS usedAt FROM tokens WHERE match_id = ? ORDER BY created_at ASC")
        .all(matchId) as Array<StoredMatch["tokens"][number]>;
      if (tokens.length > 0) record.tokens = tokens.map((token) => ({ ...token, matchId }));
    }

    if (this.tableExists("game_states")) {
      const row = this.db.prepare("SELECT game_state_json AS gameStateJson FROM game_states WHERE match_id = ?").get(matchId) as { gameStateJson?: string | null } | undefined;
      if (row?.gameStateJson) record.gameState = JSON.parse(row.gameStateJson) as StoredMatch["gameState"];
    }

    if (this.tableExists("events")) {
      const events = this.db
        .prepare("SELECT event_id AS eventId, state_version_before AS stateVersionBefore, state_version_after AS stateVersionAfter, state_hash_after AS stateHashAfter, public_payload_json AS publicPayloadJson, private_payload_local_only AS privatePayloadLocalOnly, hidden_info_barrier AS hiddenInfoBarrier FROM events WHERE match_id = ? ORDER BY event_index ASC")
        .all(matchId) as Array<{
        eventId: string;
        stateVersionBefore: number;
        stateVersionAfter: number;
        stateHashAfter: string;
        publicPayloadJson: string;
        privatePayloadLocalOnly: number;
        hiddenInfoBarrier: number;
      }>;
      if (events.length > 0) {
        record.eventLog = events.map((event) => ({
          matchId,
          eventId: event.eventId,
          stateVersionBefore: Number(event.stateVersionBefore),
          stateVersionAfter: Number(event.stateVersionAfter),
          stateHashAfter: event.stateHashAfter,
          publicPayload: JSON.parse(event.publicPayloadJson) as StoredMatch["eventLog"][number]["publicPayload"],
          privatePayloadLocalOnly: event.privatePayloadLocalOnly === 1,
          hiddenInfoBarrier: event.hiddenInfoBarrier === 1
        }));
      }
    }

    if (this.tableExists("engine_events")) {
      const events = this.db
        .prepare("SELECT event_json AS eventJson FROM engine_events WHERE match_id = ? ORDER BY event_index ASC")
        .all(matchId) as Array<{ eventJson: string }>;
      if (events.length > 0) {
        engineEventLog = events.map((event) => JSON.parse(event.eventJson) as GameEvent);
        if (record.gameState) record.gameState.eventLog = engineEventLog;
      }
    }

    if (this.tableExists("ai_decision_traces")) {
      record.aiDecisionTraces = this.aiDecisionTraceRecords(matchId);
    }

    if (this.tableExists("action_receipts")) {
      record.actionReceipts = this.db
        .prepare("SELECT idempotency_key AS idempotencyKey, side, accepted, state_version_before AS stateVersionBefore, state_version_after AS stateVersionAfter, state_hash_after AS stateHashAfter, error_code AS errorCode FROM action_receipts WHERE match_id = ? ORDER BY state_version_after ASC")
        .all(matchId)
        .map((receipt) => {
          const row = receipt as {
            idempotencyKey: string;
            side: StoredMatch["actionReceipts"][number]["side"];
            accepted: number;
            stateVersionBefore: number;
            stateVersionAfter: number;
            stateHashAfter: string;
            errorCode?: string;
          };
          return { ...row, matchId, accepted: row.accepted === 1 };
        });
    }

    if (options.includeStateSnapshots === false) {
      record.stateSnapshots = [];
      record[PARTIAL_STATE_SNAPSHOTS] = true;
    } else if (this.tableExists("state_snapshots")) {
      record.stateSnapshots = this.db
        .prepare("SELECT snapshot_id AS snapshotId, state_version AS stateVersion, match_version AS matchVersion, state_hash AS stateHash, game_state_json AS gameStateJson, created_at AS createdAt, hidden_info_barrier AS hiddenInfoBarrier FROM state_snapshots WHERE match_id = ? ORDER BY state_version ASC")
        .all(matchId)
        .map((snapshot) => {
          const row = snapshot as {
            snapshotId: string;
            stateVersion: number;
            matchVersion: number;
            stateHash: string;
            gameStateJson: string;
            createdAt: string;
            hiddenInfoBarrier: number;
          };
          return {
            snapshotId: row.snapshotId,
            matchId,
            stateVersion: Number(row.stateVersion),
            matchVersion: Number(row.matchVersion),
            stateHash: row.stateHash,
            gameState: hydrateSnapshotGameState(JSON.parse(row.gameStateJson) as StoredMatch["stateSnapshots"][number]["gameState"], engineEventLog),
            createdAt: row.createdAt,
            hiddenInfoBarrier: row.hiddenInfoBarrier === 1
          };
        });
    }

    if (this.tableExists("undo_snapshots")) {
      record.undoSnapshots = this.db
        .prepare("SELECT undo_request_id AS undoRequestId, target_event_id AS targetEventId, snapshot_id AS snapshotId, requested_by AS requestedBy, status, hidden_info_safe AS hiddenInfoSafe FROM undo_snapshots WHERE match_id = ?")
        .all(matchId)
        .map((snapshot) => {
          const row = snapshot as {
            undoRequestId: string;
            targetEventId: string;
            snapshotId: string;
            requestedBy: StoredMatch["undoSnapshots"][number]["requestedBy"];
            status: StoredMatch["undoSnapshots"][number]["status"];
            hiddenInfoSafe: number;
          };
          return { ...row, matchId, hiddenInfoSafe: row.hiddenInfoSafe === 1 };
        });
    }

    if (this.tableExists("pending_undo")) {
      const row = this.db.prepare("SELECT pending_undo_json AS pendingUndoJson FROM pending_undo WHERE match_id = ?").get(matchId) as { pendingUndoJson?: string } | undefined;
      if (row?.pendingUndoJson) {
        const pendingUndo = JSON.parse(row.pendingUndoJson) as StoredMatch["pendingUndo"];
        if (pendingUndo) record.pendingUndo = pendingUndo;
        else delete record.pendingUndo;
      }
      else delete record.pendingUndo;
    }

    if (this.tableExists("private_deck_snapshots")) {
      const row = this.db.prepare("SELECT private_deck_snapshots_json AS privateDeckSnapshotsJson FROM private_deck_snapshots WHERE match_id = ?").get(matchId) as { privateDeckSnapshotsJson?: string } | undefined;
      if (row?.privateDeckSnapshotsJson) {
        const privateDeckSnapshots = JSON.parse(row.privateDeckSnapshotsJson) as StoredMatch["privateDeckSnapshots"];
        if (privateDeckSnapshots) record.privateDeckSnapshots = privateDeckSnapshots;
      }
    }

    if (this.tableExists("start_lobbies")) {
      const row = this.db.prepare("SELECT start_lobby_json AS startLobbyJson FROM start_lobbies WHERE match_id = ?").get(matchId) as { startLobbyJson?: string } | undefined;
      if (row?.startLobbyJson) {
        const startLobby = JSON.parse(row.startLobbyJson) as StoredMatch["startLobby"];
        if (startLobby) record.startLobby = startLobby;
        else delete record.startLobby;
      }
      else delete record.startLobby;
    }
  }

  private saveRecord(record: StoredMatch): void {
    dedupeStateSnapshots(record);
    const matchId = record.match.matchId;
    const stateVersion = record.gameState?.stateVersion ?? null;
    const stateHash = record.gameState ? hashState(record.gameState) : null;
    const partialStateSnapshots = (record as StoredMatchWithStorageFlags)[PARTIAL_STATE_SNAPSHOTS] === true;
    this.db
      .prepare(
        `INSERT INTO matches
          (match_id, status, mode, match_version, seed, baseline_json, settings_json, lifecycle_json, record_json, state_version, state_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          + ` ON CONFLICT(match_id) DO UPDATE SET
            status = excluded.status,
            mode = excluded.mode,
            match_version = excluded.match_version,
            seed = excluded.seed,
            baseline_json = excluded.baseline_json,
            settings_json = excluded.settings_json,
            lifecycle_json = excluded.lifecycle_json,
            record_json = excluded.record_json,
            state_version = excluded.state_version,
            state_hash = excluded.state_hash,
            updated_at = excluded.updated_at`
      )
      .run(
        matchId,
        record.match.status,
        record.match.mode,
        record.match.matchVersion,
        record.match.seed ?? null,
        JSON.stringify(record.match.baseline),
        JSON.stringify(record.match.settings),
        toJson(record.lifecycleResult),
        JSON.stringify(compactRecordForStorage(record)),
        stateVersion,
        stateHash,
        record.match.createdAt,
        record.match.updatedAt
      );

    for (const table of [
      "sessions",
      "tokens",
      "action_receipts",
      "undo_snapshots",
      "pending_undo",
      "private_deck_snapshots",
      "start_lobbies"
    ]) {
      this.db.prepare(`DELETE FROM ${table} WHERE match_id = ?`).run(matchId);
    }

    const insertSession = this.db.prepare(
      `INSERT INTO sessions (match_id, session_id, side, display_name, session_token_hash, reconnect_token_hash, connected, created_at, last_seen_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const session of record.sessions) {
      insertSession.run(matchId, session.sessionId, session.side, session.displayName, session.sessionTokenHash, session.reconnectTokenHash, session.connected ? 1 : 0, session.createdAt, session.lastSeenAt);
    }

    const insertToken = this.db.prepare(
      `INSERT INTO tokens (match_id, token_id, kind, allowed_side, token_hash, created_at, expires_at, revoked_at, used_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const token of record.tokens) {
      insertToken.run(matchId, token.tokenId, token.kind, token.allowedSide, token.tokenHash, token.createdAt, token.expiresAt ?? null, token.revokedAt ?? null, token.usedAt ?? null);
    }

    this.db
      .prepare(
        `INSERT INTO game_states (match_id, state_version, state_hash, game_state_json)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(match_id) DO UPDATE SET
           state_version = excluded.state_version,
           state_hash = excluded.state_hash,
           game_state_json = excluded.game_state_json`
      )
      .run(matchId, stateVersion, stateHash, toJson(gameStateForStorage(record.gameState)));

    this.syncPublicEvents(matchId, record.eventLog);
    this.syncEngineEvents(matchId, record.gameState?.eventLog ?? []);
    this.syncAiDecisionTraces(matchId, record.aiDecisionTraces ?? []);

    const insertReceipt = this.db.prepare(
      `INSERT INTO action_receipts (match_id, idempotency_key, side, accepted, state_version_before, state_version_after, state_hash_after, error_code)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const receipt of record.actionReceipts) {
      insertReceipt.run(matchId, receipt.idempotencyKey, receipt.side, receipt.accepted ? 1 : 0, receipt.stateVersionBefore, receipt.stateVersionAfter, receipt.stateHashAfter, receipt.errorCode ?? null);
    }

    const insertStateSnapshot = this.db.prepare(
      `INSERT INTO state_snapshots (match_id, snapshot_id, state_version, match_version, state_hash, game_state_json, created_at, hidden_info_barrier)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const maxSnapshotStateVersion = record.stateSnapshots.reduce((max, snapshot) => Math.max(max, snapshot.stateVersion), -1);
    if (!partialStateSnapshots) this.db.prepare("DELETE FROM state_snapshots WHERE match_id = ? AND state_version > ?").run(matchId, maxSnapshotStateVersion);
    const existingSnapshotIds = new Set(
      (this.db.prepare("SELECT snapshot_id AS snapshotId FROM state_snapshots WHERE match_id = ?").all(matchId) as Array<{ snapshotId: string }>).map((row) => row.snapshotId)
    );
    for (const snapshot of record.stateSnapshots) {
      if (existingSnapshotIds.has(snapshot.snapshotId)) continue;
      insertStateSnapshot.run(matchId, snapshot.snapshotId, snapshot.stateVersion, snapshot.matchVersion, snapshot.stateHash, JSON.stringify(gameStateForStorage(snapshot.gameState)), snapshot.createdAt, snapshot.hiddenInfoBarrier ? 1 : 0);
    }

    const insertUndoSnapshot = this.db.prepare(
      `INSERT INTO undo_snapshots (match_id, undo_request_id, target_event_id, snapshot_id, requested_by, status, hidden_info_safe)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    for (const snapshot of record.undoSnapshots) {
      insertUndoSnapshot.run(matchId, snapshot.undoRequestId, snapshot.targetEventId, snapshot.snapshotId, snapshot.requestedBy, snapshot.status, snapshot.hiddenInfoSafe ? 1 : 0);
    }

    if (record.pendingUndo) this.db.prepare("INSERT INTO pending_undo (match_id, pending_undo_json) VALUES (?, ?)").run(matchId, JSON.stringify(record.pendingUndo));
    if (record.privateDeckSnapshots) this.db.prepare("INSERT INTO private_deck_snapshots (match_id, private_deck_snapshots_json) VALUES (?, ?)").run(matchId, JSON.stringify(record.privateDeckSnapshots));
    if (record.startLobby) this.db.prepare("INSERT INTO start_lobbies (match_id, start_lobby_json) VALUES (?, ?)").run(matchId, JSON.stringify(record.startLobby));
  }

  private syncPublicEvents(matchId: string, events: StoredMatch["eventLog"]): void {
    const eventIds = events.map((event) => event.eventId);
    this.truncateEventTable("events", matchId, eventIds);
    const prefixLength = this.existingContiguousEventPrefixLength("events", matchId, eventIds);
    this.truncateEventTable("events", matchId, eventIds.slice(0, prefixLength));
    const insertEvent = this.db.prepare(
      `INSERT INTO events
       (match_id, event_id, event_index, state_version_before, state_version_after, state_hash_after, public_payload_json, private_payload_local_only, hidden_info_barrier)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    events.slice(prefixLength).forEach((event, offset) => {
      const index = prefixLength + offset;
      insertEvent.run(matchId, event.eventId, index, event.stateVersionBefore, event.stateVersionAfter, event.stateHashAfter, JSON.stringify(event.publicPayload), event.privatePayloadLocalOnly ? 1 : 0, event.hiddenInfoBarrier ? 1 : 0);
    });
  }

  private syncEngineEvents(matchId: string, events: GameEvent[]): void {
    const eventIds = events.map((event) => event.eventId);
    this.truncateEventTable("engine_events", matchId, eventIds);
    const prefixLength = this.existingContiguousEventPrefixLength("engine_events", matchId, eventIds);
    this.truncateEventTable("engine_events", matchId, eventIds.slice(0, prefixLength));
    const insertEngineEvent = this.db.prepare(
      `INSERT INTO engine_events (match_id, event_id, event_index, event_json)
       VALUES (?, ?, ?, ?)`
    );
    events.slice(prefixLength).forEach((event, offset) => {
      const index = prefixLength + offset;
      insertEngineEvent.run(matchId, event.eventId, index, JSON.stringify(event));
    });
  }

  private syncAiDecisionTraces(matchId: string, traces: AiDecisionTraceRecord[]): void {
    this.db.prepare("DELETE FROM ai_decision_traces WHERE match_id = ?").run(matchId);
    if (traces.length === 0) return;
    const insertTrace = this.db.prepare(
      `INSERT INTO ai_decision_traces
       (match_id, trace_id, event_id, state_version, match_version, side, turn, decision_index, selected_action_id, selected_action_type, plan_kind, score, confidence, created_at, schema_version, trace_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const trace of traces) {
      insertTrace.run(
        matchId,
        trace.traceId,
        trace.eventId,
        trace.stateVersion,
        trace.matchVersion,
        trace.side,
        trace.turn,
        trace.decisionIndex,
        trace.selectedActionId ?? null,
        trace.selectedActionType ?? null,
        trace.planKind ?? null,
        trace.score ?? null,
        trace.confidence ?? null,
        trace.createdAt,
        trace.schemaVersion,
        JSON.stringify(trace.traceJson)
      );
    }
  }

  private aiDecisionTraceRecords(matchId: string, filters: { afterDecisionIndex?: number } = {}): AiDecisionTraceRecord[] {
    if (!this.tableExists("ai_decision_traces")) return [];
    const afterDecisionIndex = Number.isFinite(filters.afterDecisionIndex) ? Math.floor(filters.afterDecisionIndex!) : undefined;
    const rows = this.db
      .prepare(
        `SELECT trace_id AS traceId, event_id AS eventId, state_version AS stateVersion, match_version AS matchVersion, side, turn, decision_index AS decisionIndex,
          selected_action_id AS selectedActionId, selected_action_type AS selectedActionType, plan_kind AS planKind, score, confidence, created_at AS createdAt,
          schema_version AS schemaVersion, trace_json AS traceJson
         FROM ai_decision_traces
         WHERE match_id = ?
           AND (? IS NULL OR decision_index > ?)
         ORDER BY decision_index ASC, created_at ASC`
      )
      .all(matchId, afterDecisionIndex ?? null, afterDecisionIndex ?? null) as Array<{
      traceId: string;
      eventId: string;
      stateVersion: number;
      matchVersion: number;
      side: "runner" | "corp";
      turn: number;
      decisionIndex: number;
      selectedActionId?: string | null;
      selectedActionType?: string | null;
      planKind?: string | null;
      score?: number | null;
      confidence?: number | null;
      createdAt: string;
      schemaVersion: string;
      traceJson: string;
    }>;
    return rows.map((row) => ({
      traceId: row.traceId,
      matchId,
      eventId: row.eventId,
      stateVersion: Number(row.stateVersion),
      matchVersion: Number(row.matchVersion),
      side: row.side,
      turn: Number(row.turn),
      decisionIndex: Number(row.decisionIndex),
      ...(row.selectedActionId ? { selectedActionId: row.selectedActionId } : {}),
      ...(row.selectedActionType ? { selectedActionType: row.selectedActionType } : {}),
      ...(row.planKind ? { planKind: row.planKind } : {}),
      ...(typeof row.score === "number" ? { score: row.score } : {}),
      ...(typeof row.confidence === "number" ? { confidence: row.confidence } : {}),
      createdAt: row.createdAt,
      schemaVersion: row.schemaVersion,
      traceJson: JSON.parse(row.traceJson) as Record<string, unknown>
    }));
  }

  private truncateEventTable(table: "events" | "engine_events", matchId: string, eventIds: string[]): void {
    this.db.prepare(`DELETE FROM ${table} WHERE match_id = ? AND event_index >= ?`).run(matchId, eventIds.length);
  }

  private existingContiguousEventPrefixLength(table: "events" | "engine_events", matchId: string, eventIds: string[]): number {
    const rows = this.db
      .prepare(`SELECT event_id AS eventId, event_index AS eventIndex FROM ${table} WHERE match_id = ? AND event_index < ? ORDER BY event_index ASC`)
      .all(matchId, eventIds.length) as Array<{ eventId: string; eventIndex: number }>;
    let prefixLength = 0;
    for (const row of rows) {
      if (Number(row.eventIndex) !== prefixLength || row.eventId !== eventIds[prefixLength]) break;
      prefixLength += 1;
    }
    return prefixLength;
  }

  private tableExists(name: string): boolean {
    const row = this.db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(name) as { name?: string } | undefined;
    return row?.name === name;
  }

  private userTableCount(): number {
    const row = this.db.prepare("SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").get() as { count: number };
    return Number(row.count);
  }

  private meta(key: string): string | undefined {
    if (!this.tableExists("storage_meta")) return undefined;
    const row = this.db.prepare("SELECT value FROM storage_meta WHERE key = ?").get(key) as { value?: string } | undefined;
    return row?.value;
  }

  private setMeta(key: string, value: string, now: string): void {
    this.db.prepare("INSERT OR REPLACE INTO storage_meta (key, value, updated_at) VALUES (?, ?, ?)").run(key, value, now);
  }

  private matchCount(): number {
    if (!this.tableExists("matches")) return 0;
    const row = this.db.prepare("SELECT COUNT(*) AS count FROM matches").get() as { count: number };
    return Number(row.count);
  }

  private maintenanceCleanupPolicyInternal(): StorageMaintenanceCleanupPolicy {
    const raw = this.meta("maintenance_cleanup_policy_json");
    const lastRun = cleanupPolicyLastRunFromMeta(this.meta("maintenance_cleanup_last_run_json"));
    if (!raw) return defaultCleanupPolicy(lastRun);
    try {
      const parsed = JSON.parse(raw) as Partial<StorageMaintenanceCleanupPolicyInput & { updatedAt?: string }>;
      return normalizeCleanupPolicy(parsed, parsed.updatedAt, lastRun);
    } catch {
      return defaultCleanupPolicy(lastRun);
    }
  }

  private recordCleanupPolicyRun(policy: StorageMaintenanceCleanupPolicy, lastRun: StorageMaintenanceCleanupPolicyLastRun): StorageMaintenanceCleanupPolicy {
    const now = lastRun.finishedAt;
    this.setMeta("maintenance_cleanup_last_run_json", JSON.stringify(lastRun), now);
    return { ...policy, lastRun };
  }

  private maintenanceMatchesInternal(filters: StorageMaintenanceMatchFilters, now: Date): StorageMaintenanceMatchEntry[] {
    if (!this.tableExists("matches")) return [];
    const rows = this.db
      .prepare(
        `WITH
          event_sizes AS (
            SELECT match_id, COUNT(*) AS event_count, COALESCE(SUM(LENGTH(public_payload_json)), 0) AS event_payload_bytes
            FROM events
            GROUP BY match_id
          ),
          snapshot_sizes AS (
            SELECT match_id, COUNT(*) AS snapshot_count, COALESCE(SUM(LENGTH(game_state_json)), 0) AS state_snapshot_bytes
            FROM state_snapshots
            GROUP BY match_id
          ),
          game_state_sizes AS (
            SELECT match_id, COALESCE(LENGTH(game_state_json), 0) AS game_state_bytes
            FROM game_states
          ),
          deck_sizes AS (
            SELECT match_id, COALESCE(LENGTH(private_deck_snapshots_json), 0) AS deck_snapshot_bytes
            FROM private_deck_snapshots
          )
        SELECT
          m.match_id AS matchId,
          m.status AS status,
          m.mode AS mode,
          m.match_version AS matchVersion,
          m.state_version AS stateVersion,
          m.state_hash AS stateHash,
          m.record_json AS recordJson,
          m.created_at AS createdAt,
          m.updated_at AS updatedAt,
          COALESCE(LENGTH(m.record_json), 0) AS matchRecordBytes,
          COALESCE(gs.game_state_bytes, 0) AS gameStateBytes,
          COALESCE(es.event_count, 0) AS eventCount,
          COALESCE(es.event_payload_bytes, 0) AS eventPayloadBytes,
          COALESCE(ss.snapshot_count, 0) AS snapshotCount,
          COALESCE(ss.state_snapshot_bytes, 0) AS stateSnapshotBytes,
          COALESCE(ds.deck_snapshot_bytes, 0) AS deckSnapshotBytes
        FROM matches m
        LEFT JOIN event_sizes es ON es.match_id = m.match_id
        LEFT JOIN snapshot_sizes ss ON ss.match_id = m.match_id
        LEFT JOIN game_state_sizes gs ON gs.match_id = m.match_id
        LEFT JOIN deck_sizes ds ON ds.match_id = m.match_id
        ORDER BY m.updated_at DESC`
      )
      .all() as Array<{
      matchId: string;
      status: MatchStatus;
      mode: MatchMode;
      matchVersion: number;
      stateVersion: number | null;
      stateHash: string | null;
      recordJson: string;
      createdAt: string;
      updatedAt: string;
      matchRecordBytes: number;
      gameStateBytes: number;
      eventCount: number;
      eventPayloadBytes: number;
      snapshotCount: number;
      stateSnapshotBytes: number;
      deckSnapshotBytes: number;
    }>;
    const participants = this.maintenanceParticipantsByMatch();
    const olderThanMs = typeof filters.olderThanDays === "number" && Number.isFinite(filters.olderThanDays) ? Math.max(0, filters.olderThanDays) * 24 * 60 * 60 * 1000 : undefined;
    const largerThanBytes = typeof filters.largerThanBytes === "number" && Number.isFinite(filters.largerThanBytes) ? Math.max(0, filters.largerThanBytes) : undefined;
    const normalizedLimit = typeof filters.limit === "number" && Number.isFinite(filters.limit) ? Math.max(1, Math.min(10_000, Math.floor(filters.limit))) : undefined;
    const nowMs = now.getTime();
    const entries = rows.map((row): StorageMaintenanceMatchEntry => {
      const sizes = this.maintenanceSizes(row);
      const protection = retentionProtectionFromRecordJson(row.recordJson);
      return {
        matchId: row.matchId,
        status: row.status,
        terminal: isTerminalMaintenanceStatus(row.status),
        mode: row.mode,
        retentionProtected: protection.protected,
        ...(protection.protectedAt ? { retentionProtectedAt: protection.protectedAt } : {}),
        matchVersion: Number(row.matchVersion),
        ...(typeof row.stateVersion === "number" ? { stateVersion: row.stateVersion } : {}),
        ...(row.stateHash ? { stateHash: row.stateHash } : {}),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        ageSeconds: Math.max(0, Math.floor((nowMs - new Date(row.updatedAt).getTime()) / 1000)),
        participants: participants.get(row.matchId) ?? [],
        eventCount: Number(row.eventCount),
        snapshotCount: Number(row.snapshotCount),
        sizes
      };
    });
    return entries
      .filter((entry) => (filters.status ? entry.status === filters.status : true))
      .filter((entry) => (typeof filters.terminal === "boolean" ? entry.terminal === filters.terminal : true))
      .filter((entry) => (filters.mode ? entry.mode === filters.mode : true))
      .filter((entry) => (olderThanMs === undefined ? true : nowMs - new Date(entry.updatedAt).getTime() >= olderThanMs))
      .filter((entry) => (largerThanBytes === undefined ? true : entry.sizes.approximateTotalBytes >= largerThanBytes))
      .slice(0, normalizedLimit ?? entries.length);
  }

  private maintenanceParticipantsByMatch(): Map<string, StorageMaintenanceParticipant[]> {
    const result = new Map<string, StorageMaintenanceParticipant[]>();
    if (!this.tableExists("sessions")) return result;
    const rows = this.db
      .prepare("SELECT match_id AS matchId, side, display_name AS displayName, connected, last_seen_at AS lastSeenAt FROM sessions ORDER BY created_at ASC")
      .all() as Array<{ matchId: string; side: "runner" | "corp"; displayName: string; connected: number; lastSeenAt: string }>;
    for (const row of rows) {
      const entries = result.get(row.matchId) ?? [];
      if (!entries.some((entry) => entry.side === row.side && entry.displayName === row.displayName)) {
        entries.push({
          side: row.side,
          displayName: row.displayName,
          connected: row.connected === 1,
          lastSeenAt: row.lastSeenAt
        });
      }
      result.set(row.matchId, entries);
    }
    return result;
  }

  private maintenanceSizes(row: {
    matchRecordBytes: number;
    gameStateBytes: number;
    eventPayloadBytes: number;
    stateSnapshotBytes: number;
    deckSnapshotBytes: number;
  }): StorageMaintenanceMatchSizes {
    const matchRecordBytes = Number(row.matchRecordBytes);
    const gameStateBytes = Number(row.gameStateBytes);
    const eventPayloadBytes = Number(row.eventPayloadBytes);
    const stateSnapshotBytes = Number(row.stateSnapshotBytes);
    const deckSnapshotBytes = Number(row.deckSnapshotBytes);
    return {
      matchRecordBytes,
      gameStateBytes,
      eventPayloadBytes,
      stateSnapshotBytes,
      deckSnapshotBytes,
      approximateTotalBytes: matchRecordBytes + gameStateBytes + eventPayloadBytes + stateSnapshotBytes + deckSnapshotBytes
    };
  }

  private maintenanceTableSizes(): StorageMaintenanceTableSize[] {
    const definitions = [
      { key: "matches", label: "Matches", table: "matches", expression: "COALESCE(SUM(LENGTH(record_json) + LENGTH(baseline_json) + LENGTH(settings_json) + COALESCE(LENGTH(lifecycle_json), 0)), 0)" },
      { key: "state_snapshots", label: "State Snapshots", table: "state_snapshots", expression: "COALESCE(SUM(LENGTH(game_state_json)), 0)" },
      { key: "game_states", label: "Aktuelle GameStates", table: "game_states", expression: "COALESCE(SUM(LENGTH(game_state_json)), 0)" },
      { key: "events", label: "Events", table: "events", expression: "COALESCE(SUM(LENGTH(public_payload_json)), 0)" },
      { key: "engine_events", label: "Engine Events", table: "engine_events", expression: "COALESCE(SUM(LENGTH(event_json)), 0)" },
      { key: "ai_decision_traces", label: "KI-Entscheidungstraces", table: "ai_decision_traces", expression: "COALESCE(SUM(LENGTH(trace_json)), 0)" },
      { key: "sessions", label: "Sessions (redigiert)", table: "sessions", expression: "COALESCE(SUM(LENGTH(display_name)), 0)" },
      { key: "action_receipts", label: "Action Receipts", table: "action_receipts", expression: "COALESCE(SUM(LENGTH(COALESCE(error_code, ''))), 0)" },
      { key: "undo_snapshots", label: "Undo Snapshots", table: "undo_snapshots", expression: "COUNT(*) * 64" },
      { key: "pending_undo", label: "Pending Undo", table: "pending_undo", expression: "COALESCE(SUM(LENGTH(pending_undo_json)), 0)" },
      { key: "deck_snapshots_redacted", label: "Deck-Snapshots (Inhalt redigiert)", table: "private_deck_snapshots", expression: "COALESCE(SUM(LENGTH(private_deck_snapshots_json)), 0)" },
      { key: "start_lobbies", label: "Start-Lobbys", table: "start_lobbies", expression: "COALESCE(SUM(LENGTH(start_lobby_json)), 0)" }
    ] as const;
    return definitions
      .filter((definition) => this.tableExists(definition.table))
      .map((definition) => {
        const rowCount = this.db.prepare(`SELECT COUNT(*) AS count FROM ${definition.table}`).get() as { count: number };
        const payload = this.db.prepare(`SELECT ${definition.expression} AS bytes FROM ${definition.table}`).get() as { bytes: number | bigint | null };
        return {
          key: definition.key,
          label: definition.label,
          rowCount: Number(rowCount.count),
          approximatePayloadBytes: Number(payload.bytes ?? 0)
        };
      });
  }

  private compactionPayloadBytes(): number {
    const recordBytes = this.tableExists("matches") ? scalarNumber(this.db.prepare("SELECT COALESCE(SUM(LENGTH(record_json)), 0) AS value FROM matches").get()) : 0;
    const gameStateBytes = this.tableExists("game_states") ? scalarNumber(this.db.prepare("SELECT COALESCE(SUM(LENGTH(game_state_json)), 0) AS value FROM game_states").get()) : 0;
    const snapshotBytes = this.tableExists("state_snapshots") ? scalarNumber(this.db.prepare("SELECT COALESCE(SUM(LENGTH(game_state_json)), 0) AS value FROM state_snapshots").get()) : 0;
    const engineEventBytes = this.tableExists("engine_events") ? scalarNumber(this.db.prepare("SELECT COALESCE(SUM(LENGTH(event_json)), 0) AS value FROM engine_events").get()) : 0;
    return recordBytes + gameStateBytes + snapshotBytes + engineEventBytes;
  }

  private maintenanceCleanupPreviewInternal(filters: StorageMaintenanceCleanupFilters, now: Date): StorageMaintenanceCleanupPreview {
    const normalized = normalizeCleanupFilters(filters);
    const statuses = new Set(normalized.statuses);
    const olderThanSeconds = normalized.olderThanMinutes * 60;
    const matches = this.maintenanceMatchesInternal({ limit: normalized.limit ?? 500 }, now)
      .filter((match) => statuses.has(match.status))
      .filter((match) => match.ageSeconds >= olderThanSeconds)
      .filter((match) => normalized.includeProtected === true || !match.retentionProtected)
      .slice(0, normalized.limit ?? 500);
    const statusCounts: Partial<Record<MatchStatus, number>> = {};
    for (const match of matches) statusCounts[match.status] = (statusCounts[match.status] ?? 0) + 1;
    const updatedAtValues = matches.map((match) => match.updatedAt).sort();
    const warnings: string[] = [];
    if (normalized.statuses.includes("active")) warnings.push("Aktive Matches werden nur anhand ihres Alters ausgewählt. Laufende Partien können davon betroffen sein.");
    if (normalized.statuses.includes("finished")) warnings.push("Finished-Matches sind Replay-/Analyseartefakte und sollten nur bewusst ausgewählt werden.");
    if (normalized.includeProtected === true) warnings.push("Geschützte Matches sind in dieser Vorschau ausdrücklich eingeschlossen.");
    if (matches.length === 0) warnings.push("Keine Matches erfüllen die aktuellen Löschfilter.");
    return {
      backendOpsVersion: "Backend 0.5",
      generatedAt: now.toISOString(),
      previewId: cleanupPreviewId(normalized, matches),
      filters: normalized,
      matchCount: matches.length,
      statusCounts,
      approximateBytes: matches.reduce((sum, match) => sum + match.sizes.approximateTotalBytes, 0),
      ...(updatedAtValues[0] ? { oldestUpdatedAt: updatedAtValues[0] } : {}),
      ...(updatedAtValues.at(-1) ? { newestUpdatedAt: updatedAtValues.at(-1)! } : {}),
      matches,
      warnings
    };
  }

  private deleteWholeMatches(matchIds: string[]): number {
    if (matchIds.length === 0) return 0;
    let deleted = 0;
    this.transaction(() => {
      const statement = this.db.prepare("DELETE FROM matches WHERE match_id = ?");
      for (const matchId of matchIds) {
        const result = statement.run(matchId) as { changes?: number | bigint };
        deleted += Number(result.changes ?? 0);
      }
      this.integrityCheck();
    });
    return deleted;
  }

  private integrityCheck(): "ok" {
    const integrity = this.db.prepare("PRAGMA integrity_check").get() as { integrity_check?: string };
    if (integrity.integrity_check !== "ok") throw new StorageError("storage_corrupt", "Storage-Integritätsprüfung ist fehlgeschlagen.");
    return "ok";
  }

  private databaseSizeBytes(): number {
    return existsSync(this.dbPath) ? statSync(this.dbPath).size : 0;
  }

  private pragmaNumber(name: "page_size" | "page_count" | "freelist_count"): number {
    const row = this.db.prepare(`PRAGMA ${name}`).get() as Record<string, number | bigint | undefined>;
    return Number(row[name] ?? 0);
  }

  private transaction(work: () => void): void {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      work();
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
}

function isTerminalMaintenanceStatus(status: MatchStatus): boolean {
  return status === "finished" || status === "forfeited" || status === "abandoned" || status === "cancelled";
}

const CLEANUP_STATUSES: MatchStatus[] = [
  "pending",
  "waiting_for_runner",
  "waiting_for_corp",
  "waiting_for_joiner_decks",
  "ready_check",
  "countdown",
  "active",
  "cancelled",
  "abandoned",
  "forfeited",
  "finished"
];

function normalizeCleanupFilters(filters: StorageMaintenanceCleanupFilters): StorageMaintenanceCleanupFilters {
  const statuses: MatchStatus[] = [];
  for (const status of filters.statuses ?? []) {
    if (CLEANUP_STATUSES.includes(status) && !statuses.includes(status)) statuses.push(status);
  }
  const olderThanMinutes = Number.isFinite(filters.olderThanMinutes) ? Math.max(1, Math.floor(filters.olderThanMinutes)) : 60;
  const limit = Number.isFinite(filters.limit) ? Math.max(1, Math.min(500, Math.floor(filters.limit ?? 500))) : 500;
  return { statuses, olderThanMinutes, limit, includeProtected: filters.includeProtected === true };
}

function defaultCleanupPolicy(lastRun?: StorageMaintenanceCleanupPolicyLastRun): StorageMaintenanceCleanupPolicy {
  return {
    backendOpsVersion: "Backend 0.5",
    intervalMinutes: 60,
    enabled: false,
    statuses: CLEANUP_STATUSES,
    olderThanDays: 3,
    limit: 500,
    includeProtected: false,
    vacuumAfter: false,
    createBackup: false,
    ...(lastRun ? { lastRun } : {})
  };
}

function normalizeCleanupPolicy(input: Partial<StorageMaintenanceCleanupPolicyInput>, updatedAt?: string, lastRun?: StorageMaintenanceCleanupPolicyLastRun): StorageMaintenanceCleanupPolicy {
  const statuses: MatchStatus[] = [];
  for (const status of input.statuses ?? CLEANUP_STATUSES) {
    if (CLEANUP_STATUSES.includes(status) && !statuses.includes(status)) statuses.push(status);
  }
  return {
    backendOpsVersion: "Backend 0.5",
    intervalMinutes: 60,
    enabled: input.enabled === true,
    statuses: statuses.length > 0 ? statuses : CLEANUP_STATUSES,
    olderThanDays: Number.isFinite(input.olderThanDays) ? Math.max(1, Math.min(3650, Math.floor(input.olderThanDays ?? 3))) : 3,
    limit: Number.isFinite(input.limit) ? Math.max(1, Math.min(500, Math.floor(input.limit ?? 500))) : 500,
    includeProtected: input.includeProtected === true,
    vacuumAfter: input.vacuumAfter === true,
    createBackup: input.createBackup === true,
    ...(updatedAt ? { updatedAt } : {}),
    ...(lastRun ? { lastRun } : {})
  };
}

function cleanupPolicyLastRunFromMeta(raw: string | undefined): StorageMaintenanceCleanupPolicyLastRun | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as Partial<StorageMaintenanceCleanupPolicyLastRun>;
    if (typeof parsed.startedAt !== "string" || typeof parsed.finishedAt !== "string") return undefined;
    return {
      startedAt: parsed.startedAt,
      finishedAt: parsed.finishedAt,
      matchedCount: finiteNonNegative(parsed.matchedCount),
      deletedCount: finiteNonNegative(parsed.deletedCount),
      approximateBytes: finiteNonNegative(parsed.approximateBytes),
      backupCreated: parsed.backupCreated === true,
      ...(parsed.backupId ? { backupId: String(parsed.backupId) } : {}),
      ...(parsed.skippedReason === "disabled" || parsed.skippedReason === "no_matches" ? { skippedReason: parsed.skippedReason } : {}),
      ...(parsed.errorCode ? { errorCode: String(parsed.errorCode) } : {})
    };
  } catch {
    return undefined;
  }
}

function finiteNonNegative(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

function retentionProtectionFromRecordJson(recordJson: string): { protected: boolean; protectedAt?: string } {
  try {
    const record = JSON.parse(recordJson) as { match?: { retentionProtection?: { protected?: unknown; protectedAt?: unknown } } };
    const protection = record.match?.retentionProtection;
    if (protection?.protected !== true) return { protected: false };
    return {
      protected: true,
      ...(typeof protection.protectedAt === "string" ? { protectedAt: protection.protectedAt } : {})
    };
  } catch {
    return { protected: false };
  }
}

function cleanupPreviewId(filters: StorageMaintenanceCleanupFilters, matches: StorageMaintenanceMatchEntry[]): string {
  const selectedMatches = matches
    .map((match) => ({
      matchId: match.matchId,
      status: match.status,
      updatedAt: match.updatedAt,
      retentionProtected: match.retentionProtected,
      approximateBytes: match.sizes.approximateTotalBytes
    }))
    .sort((a, b) => a.matchId.localeCompare(b.matchId));
  return createHash("sha256").update(JSON.stringify({ filters, matches: selectedMatches })).digest("hex").slice(0, 16);
}

function dedupeStateSnapshots(record: StoredMatch): void {
  const seen = new Set<string>();
  const unique: typeof record.stateSnapshots = [];
  for (const snapshot of record.stateSnapshots) {
    if (seen.has(snapshot.snapshotId)) continue;
    seen.add(snapshot.snapshotId);
    unique.push(snapshot);
  }
  if (unique.length !== record.stateSnapshots.length) record.stateSnapshots = unique;
}

export function createSqliteStorageBackup(input: {
  dbPath?: string;
  backupDir: string;
  schemaVersion: number;
  matchCount?: number;
  reason: BackupManifest["reason"];
  source: BackupManifest["source"];
}): { backupDir: string; manifest: BackupManifest } {
  mkdirSync(input.backupDir, { recursive: true });
  const backupId = `netgrid-storage-${timestampId()}-${randomBytes(3).toString("hex")}`;
  const targetDir = join(input.backupDir, backupId);
  mkdirSync(targetDir, { recursive: true });

  const files: BackupManifest["files"] = [];
  if (input.dbPath && existsSync(input.dbPath)) {
    const targetName = "netgrid.sqlite";
    copyFileSync(input.dbPath, join(targetDir, targetName));
    files.push(fileManifestEntry(targetDir, targetName));
  }
  if (files.length === 0) throw new StorageError("backup_invalid", "Backup konnte keine gültigen Storage-Dateien sichern.");

  const manifest: BackupManifest = {
    manifestVersion: 1,
    backupId,
    createdAt: new Date().toISOString(),
    release: "V1.0.8",
    storageKind: "sqlite",
    schemaVersion: input.schemaVersion,
    source: input.source,
    files,
    ...(typeof input.matchCount === "number" ? { matchCount: input.matchCount } : {}),
    ...(input.reason ? { reason: input.reason } : {})
  };
  writeFileSync(join(targetDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return { backupDir: targetDir, manifest };
}

export function restoreSqliteStorageBackup(input: { backupDir: string; targetPath: string; backupRootDir: string }): { preRestoreBackupDir?: string; restoredPath: string } {
  const manifestPath = join(input.backupDir, "manifest.json");
  if (!existsSync(manifestPath)) throw new StorageError("backup_invalid", "Backup-Manifest fehlt oder ist unvollständig.");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as BackupManifest;
  if (manifest.manifestVersion !== 1 || manifest.storageKind !== "sqlite") throw new StorageError("backup_invalid", "Backup-Manifest ist nicht gültig.");
  if (manifest.schemaVersion > SQLITE_STORAGE_SCHEMA_VERSION) throw new StorageError("backup_schema_unsupported", "Backup nutzt ein neueres Storage-Schema.");
  for (const file of manifest.files) {
    const fullPath = join(input.backupDir, file.name);
    if (!existsSync(fullPath)) throw new StorageError("backup_invalid", "Backup ist unvollständig.");
    if (sha256File(fullPath) !== file.sha256) throw new StorageError("backup_checksum_mismatch", "Backup-Prüfsumme stimmt nicht.");
  }
  const sqliteFile = manifest.files.find((file) => file.name.endsWith(".sqlite"));
  if (!sqliteFile) throw new StorageError("backup_invalid", "Backup enthält keine SQLite-Datei.");
  assertSqliteBackupUsable(join(input.backupDir, sqliteFile.name));

  let preRestoreBackupDir: string | undefined;
  if (existsSync(input.targetPath)) {
    preRestoreBackupDir = createSqliteStorageBackup({
      dbPath: input.targetPath,
      backupDir: input.backupRootDir,
      schemaVersion: SQLITE_STORAGE_SCHEMA_VERSION,
      reason: "pre_restore",
      source: "pre_restore_sqlite"
    }).backupDir;
  }
  mkdirSync(dirname(input.targetPath), { recursive: true });
  copyFileSync(join(input.backupDir, sqliteFile.name), input.targetPath);
  return { ...(preRestoreBackupDir ? { preRestoreBackupDir } : {}), restoredPath: input.targetPath };
}

export function inspectSqliteStorage(dbPath: string): StorageHealth {
  const db = new DatabaseSync(resolve(dbPath), { open: true, readOnly: true });
  try {
    const integrity = db.prepare("PRAGMA integrity_check").get() as { integrity_check?: string };
    if (integrity.integrity_check !== "ok") throw new StorageError("storage_corrupt", "Storage-Integritätsprüfung ist fehlgeschlagen.");
    const meta = (key: string): string | undefined => (db.prepare("SELECT value FROM storage_meta WHERE key = ?").get(key) as { value?: string } | undefined)?.value;
    const count = (db.prepare("SELECT COUNT(*) AS count FROM matches").get() as { count: number }).count;
    const storageFormat = meta("storage_format");
    return {
      ok: true,
      kind: "sqlite",
      schemaVersion: Number(meta("schema_version") ?? 0),
      matchCount: Number(count),
      database: basename(dbPath),
      ...(storageFormat ? { storageFormat } : {}),
      ...(meta("last_migration_at") ? { lastMigrationAt: meta("last_migration_at")! } : {})
    };
  } finally {
    db.close();
  }
}

export function validateStoredMatch(value: unknown): asserts value is StoredMatch {
  if (!value || typeof value !== "object") throw new StorageError("stored_match_invalid", "Match-Record ist strukturell ungültig.");
  const record = value as Partial<StoredMatch>;
  const match = record.match as Partial<StoredMatch["match"]> | undefined;
  if (!match || typeof match.matchId !== "string" || match.matchId.length === 0) throw new StorageError("stored_match_invalid", "Match-Record ist strukturell ungültig.");
  if (typeof match.matchVersion !== "number" || !Number.isFinite(match.matchVersion) || match.matchVersion < 1) throw new StorageError("stored_match_invalid", "Match-Record ist strukturell ungültig.");
  if (!isMatchStatus(match.status) || !isMatchMode(match.mode)) throw new StorageError("stored_match_invalid", "Match-Record ist strukturell ungültig.");
  if (!Array.isArray(record.sessions) || !Array.isArray(record.tokens) || !Array.isArray(record.eventLog) || !Array.isArray(record.actionReceipts) || !Array.isArray(record.undoSnapshots) || !Array.isArray(record.stateSnapshots)) {
    throw new StorageError("stored_match_invalid", "Match-Record ist strukturell ungültig.");
  }
  for (const session of record.sessions) {
    if (session.matchId !== match.matchId || !isSha256Hash(session.sessionTokenHash) || !isSha256Hash(session.reconnectTokenHash)) throw new StorageError("stored_match_invalid", "Match-Record ist strukturell ungültig.");
  }
  for (const token of record.tokens) {
    if (token.matchId !== match.matchId || !isSha256Hash(token.tokenHash)) throw new StorageError("stored_match_invalid", "Match-Record ist strukturell ungültig.");
  }
  for (const event of record.eventLog) {
    if (event.matchId !== match.matchId || "privatePayload" in (event as Record<string, unknown>)) throw new StorageError("stored_match_invalid", "Match-Record ist strukturell ungültig.");
  }
  if (record.gameState && record.gameState.matchId !== match.matchId) throw new StorageError("stored_match_invalid", "Match-Record ist strukturell ungültig.");
  rejectClearTokenKeys(record);
}

function assertSqliteBackupUsable(dbPath: string): void {
  let db: DatabaseSync | undefined;
  try {
    db = new DatabaseSync(dbPath, { open: true, readOnly: true });
    const integrity = db.prepare("PRAGMA integrity_check").get() as { integrity_check?: string };
    if (integrity.integrity_check !== "ok") throw new StorageError("storage_corrupt", "Storage-Integritätsprüfung ist fehlgeschlagen.");
    const row = db.prepare("SELECT value FROM storage_meta WHERE key = 'schema_version'").get() as { value?: string } | undefined;
    const schemaVersion = Number(row?.value ?? 0);
    if (schemaVersion > SQLITE_STORAGE_SCHEMA_VERSION) throw new StorageError("backup_schema_unsupported", "Backup nutzt ein neueres Storage-Schema.");
  } catch (error) {
    if (error instanceof StorageError) throw error;
    throw new StorageError("backup_invalid", "Backup-SQLite-Datei ist nicht lesbar.");
  } finally {
    db?.close();
  }
}

function rejectClearTokenKeys(value: unknown): void {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (/^(sessionToken|reconnectToken|joinToken|hostSessionToken|hostReconnectToken)$/.test(key)) {
      throw new StorageError("stored_match_invalid", "Match-Record enthält unzulässige Token-Felder.");
    }
    rejectClearTokenKeys(child);
  }
}

function isMatchStatus(value: unknown): value is MatchStatus {
  return (
    value === "pending" ||
    value === "waiting_for_runner" ||
    value === "waiting_for_corp" ||
    value === "waiting_for_joiner_decks" ||
    value === "ready_check" ||
    value === "countdown" ||
    value === "active" ||
    value === "cancelled" ||
    value === "abandoned" ||
    value === "forfeited" ||
    value === "finished"
  );
}

function isMatchMode(value: unknown): value is MatchMode {
  return value === "human_vs_human" || value === "human_runner_vs_corp_ai" || value === "human_corp_vs_runner_ai";
}

function isSha256Hash(value: unknown): boolean {
  return typeof value === "string" && /^sha256:[a-f0-9]{64}$/.test(value);
}

function fileManifestEntry(dir: string, name: string): BackupManifest["files"][number] {
  const fullPath = join(dir, name);
  return { name, sizeBytes: statSync(fullPath).size, sha256: sha256File(fullPath) };
}

function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function timestampId(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}-${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;
}

function toJson(value: unknown): string | null {
  return value === undefined ? null : JSON.stringify(value);
}

function gameStateForStorage<T extends GameState | undefined>(state: T): T {
  if (!state) return state;
  return { ...state, eventLog: [] } as T;
}

function hydrateSnapshotGameState(state: GameState, eventLog: GameEvent[] | undefined): GameState {
  if (!eventLog) return state;
  return {
    ...state,
    eventLog: eventLog.filter((event) => event.stateVersionAfter <= state.stateVersion)
  };
}

function collectLegacyEngineEvents(record: StoredMatch, gameState: GameState | undefined, snapshots: GameState[]): GameEvent[] {
  const events = new Map<string, GameEvent>();
  const add = (eventLog: GameEvent[] | undefined): void => {
    for (const event of eventLog ?? []) {
      if (typeof event.eventId === "string" && !events.has(event.eventId)) events.set(event.eventId, event);
    }
  };
  add(record.gameState?.eventLog);
  add(gameState?.eventLog);
  for (const snapshot of snapshots) add(snapshot.eventLog);
  return [...events.values()].sort((left, right) => left.stateVersionAfter - right.stateVersionAfter || left.eventId.localeCompare(right.eventId));
}

function compactRecordForStorage(record: StoredMatch): StoredMatch {
  return {
    ...record,
    gameState: gameStateForStorage(record.gameState),
    eventLog: [],
    actionReceipts: [],
    undoSnapshots: [],
    stateSnapshots: [],
    aiDecisionTraces: []
  };
}

function aiDecisionTraceIndexEntry(trace: AiDecisionTraceRecord): StorageMaintenanceAiDecisionTraceIndexEntry {
  return {
    traceId: trace.traceId,
    matchId: trace.matchId,
    eventId: trace.eventId,
    stateVersion: trace.stateVersion,
    matchVersion: trace.matchVersion,
    side: trace.side,
    turn: trace.turn,
    decisionIndex: trace.decisionIndex,
    ...(trace.selectedActionId ? { selectedActionId: trace.selectedActionId } : {}),
    ...(trace.selectedActionType ? { selectedActionType: trace.selectedActionType } : {}),
    ...(trace.planKind ? { planKind: trace.planKind } : {}),
    ...(trace.score !== undefined ? { score: trace.score } : {}),
    ...(trace.confidence !== undefined ? { confidence: trace.confidence } : {}),
    createdAt: trace.createdAt,
    schemaVersion: trace.schemaVersion,
    meta: traceMeta(trace.traceJson)
  };
}

function traceMeta(traceJson: Record<string, unknown>): Record<string, unknown> {
  const meta: Record<string, unknown> = {};
  for (const key of ["schemaVersion", "debugSchemaVersion", "actor", "aiLevel", "summary", "planKind", "selectedActionType", "score", "confidence", "fallbackUsed", "timeoutUsed"] as const) {
    const value = traceJson[key];
    if (value !== undefined) meta[key] = value;
  }
  for (const key of ["visibleReasons", "warnings", "longTermPlan"] as const) {
    const value = traceJson[key];
    if (Array.isArray(value)) meta[key] = value.slice(0, 6);
  }
  return meta;
}

function clone<T>(value: T): T {
  return structuredClone(value) as T;
}

function scalarNumber(row: unknown): number {
  const value = (row as { value?: number | bigint | null } | undefined)?.value;
  return Number(value ?? 0);
}
