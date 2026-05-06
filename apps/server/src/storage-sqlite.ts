import { createHash, randomBytes } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, basename, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { hashState } from "@netrunner/engine";
import type { MatchMode, MatchStatus, MultiplayerStorage, StoredMatch } from "./multiplayer";

export const SQLITE_STORAGE_SCHEMA_VERSION = 1;
export const SQLITE_STORAGE_FORMAT = "netrunner_multiplayer_sqlite";
export const DEFAULT_SQLITE_STORAGE_PATH = "data/runtime/multiplayer/netrunner.sqlite";
export const DEFAULT_LEGACY_MATCH_STORAGE_PATH = "data/runtime/multiplayer/matches.json";
export const DEFAULT_STORAGE_BACKUP_DIR = "data/runtime/backups";

export type StorageKind = "memory" | "json" | "sqlite";

export type StorageHealth = {
  ok: true;
  kind: StorageKind;
  schemaVersion?: number;
  storageFormat?: string;
  matchCount?: number;
  legacyImport?: "not_applicable" | "pending" | "completed";
  database?: string;
  lastMigrationAt?: string;
  lastLegacyImportAt?: string;
};

export type SqliteMatchStorageOptions = {
  dbPath: string;
  legacyJsonPath?: string;
  backupDir?: string;
  autoImportLegacy?: boolean;
};

export type BackupManifest = {
  manifestVersion: 1;
  backupId: string;
  createdAt: string;
  release: "V1.0.8";
  storageKind: "sqlite";
  schemaVersion: number;
  source: "default_sqlite" | "configured_sqlite" | "legacy_json_import" | "pre_restore_sqlite";
  files: Array<{ name: string; sizeBytes: number; sha256: string }>;
  matchCount?: number;
  reason?: "manual" | "pre_migration" | "pre_restore";
};

export class StorageError extends Error {
  constructor(
    readonly code:
      | "storage_corrupt"
      | "schema_too_new"
      | "schema_too_old"
      | "schema_missing"
      | "legacy_import_invalid"
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
  private readonly legacyJsonPath: string;
  private readonly backupDir: string;
  private legacyImportState: NonNullable<StorageHealth["legacyImport"]> = "not_applicable";

  constructor(options: SqliteMatchStorageOptions) {
    this.dbPath = resolve(options.dbPath);
    this.legacyJsonPath = resolve(options.legacyJsonPath ?? DEFAULT_LEGACY_MATCH_STORAGE_PATH);
    this.backupDir = resolve(options.backupDir ?? DEFAULT_STORAGE_BACKUP_DIR);
    mkdirSync(dirname(this.dbPath), { recursive: true });
    mkdirSync(this.backupDir, { recursive: true });
    try {
      this.db = new DatabaseSync(this.dbPath);
      this.db.exec("PRAGMA foreign_keys = ON");
      this.db.exec("PRAGMA journal_mode = DELETE");
      this.ensureSchema();
      if (options.autoImportLegacy !== false) this.importLegacyIfNeeded();
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError("storage_corrupt", "Storage konnte nicht geöffnet werden. Bitte aus einem lokalen Backup wiederherstellen.");
    }
  }

  async load(matchId: string): Promise<StoredMatch | undefined> {
    const row = this.db.prepare("SELECT record_json FROM matches WHERE match_id = ?").get(matchId) as { record_json?: string } | undefined;
    if (!row?.record_json) return undefined;
    const record = JSON.parse(row.record_json) as StoredMatch;
    validateStoredMatch(record);
    return clone(record);
  }

  async save(record: StoredMatch): Promise<void> {
    validateStoredMatch(record);
    this.transaction(() => this.saveRecord(record));
  }

  async list(): Promise<StoredMatch[]> {
    const rows = this.db.prepare("SELECT record_json FROM matches ORDER BY created_at ASC").all() as Array<{ record_json: string }>;
    return rows.map((row) => {
      const record = JSON.parse(row.record_json) as StoredMatch;
      validateStoredMatch(record);
      return clone(record);
    });
  }

  async health(): Promise<StorageHealth> {
    const schemaVersion = Number(this.meta("schema_version") ?? SQLITE_STORAGE_SCHEMA_VERSION);
    return {
      ok: true,
      kind: "sqlite",
      schemaVersion,
      storageFormat: this.meta("storage_format") ?? SQLITE_STORAGE_FORMAT,
      matchCount: this.matchCount(),
      legacyImport: this.legacyImportState,
      database: basename(this.dbPath),
      ...(this.meta("last_migration_at") ? { lastMigrationAt: this.meta("last_migration_at")! } : {}),
      ...(this.meta("last_legacy_import_at") ? { lastLegacyImportAt: this.meta("last_legacy_import_at")! } : {})
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

  private importLegacyIfNeeded(): void {
    if (!existsSync(this.legacyJsonPath)) {
      this.legacyImportState = "not_applicable";
      return;
    }
    if (this.meta("last_legacy_import_at")) {
      this.legacyImportState = "completed";
      return;
    }
    if (this.matchCount() > 0) {
      this.legacyImportState = "pending";
      return;
    }
    const content = readFileSync(this.legacyJsonPath, "utf8");
    let records: StoredMatch[];
    try {
      const parsed = JSON.parse(content) as { matches?: unknown };
      if (!Array.isArray(parsed.matches)) throw new Error("matches_missing");
      records = parsed.matches.map((record) => {
        const normalized = normalizeLegacyStoredMatch(record);
        validateStoredMatch(normalized);
        return normalized;
      });
    } catch {
      throw new StorageError("legacy_import_invalid", "Legacy-JSON konnte nicht sicher importiert werden.");
    }

    createSqliteStorageBackup({
      ...(existsSync(this.dbPath) ? { dbPath: this.dbPath } : {}),
      legacyJsonPath: this.legacyJsonPath,
      backupDir: this.backupDir,
      schemaVersion: SQLITE_STORAGE_SCHEMA_VERSION,
      matchCount: 0,
      reason: "pre_migration",
      source: "legacy_json_import"
    });

    this.transaction(() => {
      for (const record of records) this.saveRecord(record);
      const now = new Date().toISOString();
      this.setMeta("last_legacy_import_at", now, now);
      this.setMeta("legacy_import_source_hash", sha256File(this.legacyJsonPath), now);
    });
    this.legacyImportState = "completed";
  }

  private saveRecord(record: StoredMatch): void {
    const matchId = record.match.matchId;
    const stateVersion = record.gameState?.stateVersion ?? null;
    const stateHash = record.gameState ? hashState(record.gameState) : null;
    this.db
      .prepare(
        `INSERT OR REPLACE INTO matches
          (match_id, status, mode, match_version, seed, baseline_json, settings_json, lifecycle_json, record_json, state_version, state_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
        JSON.stringify(record),
        stateVersion,
        stateHash,
        record.match.createdAt,
        record.match.updatedAt
      );

    for (const table of [
      "sessions",
      "tokens",
      "game_states",
      "events",
      "action_receipts",
      "state_snapshots",
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

    this.db.prepare("INSERT INTO game_states (match_id, state_version, state_hash, game_state_json) VALUES (?, ?, ?, ?)").run(matchId, stateVersion, stateHash, toJson(record.gameState));

    const insertEvent = this.db.prepare(
      `INSERT INTO events
       (match_id, event_id, event_index, state_version_before, state_version_after, state_hash_after, public_payload_json, private_payload_local_only, hidden_info_barrier)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    record.eventLog.forEach((event, index) => {
      insertEvent.run(matchId, event.eventId, index, event.stateVersionBefore, event.stateVersionAfter, event.stateHashAfter, JSON.stringify(event.publicPayload), event.privatePayloadLocalOnly ? 1 : 0, event.hiddenInfoBarrier ? 1 : 0);
    });

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
    for (const snapshot of record.stateSnapshots) {
      insertStateSnapshot.run(matchId, snapshot.snapshotId, snapshot.stateVersion, snapshot.matchVersion, snapshot.stateHash, JSON.stringify(snapshot.gameState), snapshot.createdAt, snapshot.hiddenInfoBarrier ? 1 : 0);
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

export function createSqliteStorageBackup(input: {
  dbPath?: string;
  legacyJsonPath?: string;
  backupDir: string;
  schemaVersion: number;
  matchCount?: number;
  reason: BackupManifest["reason"];
  source: BackupManifest["source"];
}): { backupDir: string; manifest: BackupManifest } {
  mkdirSync(input.backupDir, { recursive: true });
  const backupId = `netrunner-storage-${timestampId()}-${randomBytes(3).toString("hex")}`;
  const targetDir = join(input.backupDir, backupId);
  mkdirSync(targetDir, { recursive: true });

  const files: BackupManifest["files"] = [];
  if (input.dbPath && existsSync(input.dbPath)) {
    const targetName = "netrunner.sqlite";
    copyFileSync(input.dbPath, join(targetDir, targetName));
    files.push(fileManifestEntry(targetDir, targetName));
  }
  if (input.legacyJsonPath && existsSync(input.legacyJsonPath)) {
    const targetName = "legacy-matches.json";
    copyFileSync(input.legacyJsonPath, join(targetDir, targetName));
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
      legacyImport: meta("last_legacy_import_at") ? "completed" : "not_applicable",
      database: basename(dbPath),
      ...(storageFormat ? { storageFormat } : {}),
      ...(meta("last_migration_at") ? { lastMigrationAt: meta("last_migration_at")! } : {}),
      ...(meta("last_legacy_import_at") ? { lastLegacyImportAt: meta("last_legacy_import_at")! } : {})
    };
  } finally {
    db.close();
  }
}

export function validateStoredMatch(value: unknown): asserts value is StoredMatch {
  if (!value || typeof value !== "object") throw new StorageError("legacy_import_invalid", "Match-Record ist strukturell ungültig.");
  const record = value as Partial<StoredMatch>;
  const match = record.match as Partial<StoredMatch["match"]> | undefined;
  if (!match || typeof match.matchId !== "string" || match.matchId.length === 0) throw new StorageError("legacy_import_invalid", "Match-Record ist strukturell ungültig.");
  if (typeof match.matchVersion !== "number" || !Number.isFinite(match.matchVersion) || match.matchVersion < 1) throw new StorageError("legacy_import_invalid", "Match-Record ist strukturell ungültig.");
  if (!isMatchStatus(match.status) || !isMatchMode(match.mode)) throw new StorageError("legacy_import_invalid", "Match-Record ist strukturell ungültig.");
  if (!Array.isArray(record.sessions) || !Array.isArray(record.tokens) || !Array.isArray(record.eventLog) || !Array.isArray(record.actionReceipts) || !Array.isArray(record.undoSnapshots) || !Array.isArray(record.stateSnapshots)) {
    throw new StorageError("legacy_import_invalid", "Match-Record ist strukturell ungültig.");
  }
  for (const session of record.sessions) {
    if (session.matchId !== match.matchId || !isSha256Hash(session.sessionTokenHash) || !isSha256Hash(session.reconnectTokenHash)) throw new StorageError("legacy_import_invalid", "Match-Record ist strukturell ungültig.");
  }
  for (const token of record.tokens) {
    if (token.matchId !== match.matchId || !isSha256Hash(token.tokenHash)) throw new StorageError("legacy_import_invalid", "Match-Record ist strukturell ungültig.");
  }
  for (const event of record.eventLog) {
    if (event.matchId !== match.matchId || "privatePayload" in (event as Record<string, unknown>)) throw new StorageError("legacy_import_invalid", "Match-Record ist strukturell ungültig.");
  }
  if (record.gameState && record.gameState.matchId !== match.matchId) throw new StorageError("legacy_import_invalid", "Match-Record ist strukturell ungültig.");
  rejectClearTokenKeys(record);
}

export function normalizeLegacyStoredMatch(value: unknown): StoredMatch {
  if (!value || typeof value !== "object") throw new StorageError("legacy_import_invalid", "Match-Record ist strukturell ungültig.");
  const record = clone(value as StoredMatch);
  if (!record.match || typeof record.match !== "object") throw new StorageError("legacy_import_invalid", "Match-Record ist strukturell ungültig.");
  if (!record.match.mode) {
    record.match.mode = record.match.aiControllers?.runner?.type === "ai" ? "human_corp_vs_runner_ai" : record.match.aiControllers?.corp?.type === "ai" ? "human_runner_vs_corp_ai" : "human_vs_human";
  }
  return record;
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
      throw new StorageError("legacy_import_invalid", "Match-Record enthält unzulässige Token-Felder.");
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

function clone<T>(value: T): T {
  return structuredClone(value) as T;
}
