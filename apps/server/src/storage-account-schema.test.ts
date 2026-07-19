import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { SqliteAccountStorage } from "./account-session";
import { SQLITE_STORAGE_SCHEMA_VERSION, SqliteMatchStorage } from "./storage-sqlite";

describe("SQLite account schema migration", () => {
  it("migrates schema 1 to the shared schema 3 and creates a pre-migration backup", async () => {
    const dir = await mkdtemp(join(tmpdir(), "netgrid-account-schema-"));
    const dbPath = join(dir, "netgrid.sqlite");
    const backupDir = join(dir, "backups");
    let accountStorage: SqliteAccountStorage | undefined;
    let db: DatabaseSync | undefined;
    try {
      const initial = new SqliteMatchStorage({ dbPath, backupDir });
      initial.close();
      db = new DatabaseSync(dbPath);
      db.exec("PRAGMA foreign_keys = OFF");
      for (const table of [
        "account_decks",
        "account_reset_tokens",
        "account_invites",
        "account_sessions",
        "account_credentials",
        "account_password_credentials",
        "accounts",
      ]) {
        db.exec(`DROP TABLE IF EXISTS ${table}`);
      }
      db.prepare("UPDATE storage_meta SET value = '1' WHERE key = 'schema_version'").run();
      db.close();
      db = undefined;

      accountStorage = new SqliteAccountStorage({ dbPath, backupDir });
      db = new DatabaseSync(dbPath, { readOnly: true });
      const schemaVersion = Number((db.prepare("SELECT value FROM storage_meta WHERE key = 'schema_version'").get() as { value: string }).value);
      const tables = new Set((db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as Array<{ name: string }>).map((row) => row.name));

      expect(schemaVersion).toBe(SQLITE_STORAGE_SCHEMA_VERSION);
      for (const table of [
        "accounts",
        "account_password_credentials",
        "account_sessions",
        "account_invites",
        "account_reset_tokens",
        "account_decks",
        "account_match_participants",
        "account_game_results",
        "account_series_results",
      ]) {
        expect(tables.has(table), table).toBe(true);
      }
      expect(
        (db.prepare("SELECT value FROM storage_meta WHERE key = 'account_statistics_since'").get() as { value?: string } | undefined)?.value,
      ).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(await readdir(backupDir)).toHaveLength(1);
    } finally {
      db?.close();
      accountStorage?.close();
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("migrates schema 2 to schema 3 without attributing historical matches", async () => {
    const dir = await mkdtemp(join(tmpdir(), "netgrid-account-statistics-schema-"));
    const dbPath = join(dir, "netgrid.sqlite");
    const backupDir = join(dir, "backups");
    let reopened: SqliteMatchStorage | undefined;
    let db: DatabaseSync | undefined;
    try {
      const initial = new SqliteMatchStorage({ dbPath, backupDir });
      initial.close();
      db = new DatabaseSync(dbPath);
      for (const table of ["account_series_results", "account_game_results", "account_match_participants"]) {
        db.exec(`DROP TABLE ${table}`);
      }
      db.prepare("DELETE FROM storage_meta WHERE key = 'account_statistics_since'").run();
      db.prepare("UPDATE storage_meta SET value = '2' WHERE key = 'schema_version'").run();
      db.close();
      db = undefined;

      reopened = new SqliteMatchStorage({ dbPath, backupDir });
      reopened.close();
      reopened = undefined;
      db = new DatabaseSync(dbPath, { readOnly: true });

      expect(Number((db.prepare("SELECT value FROM storage_meta WHERE key = 'schema_version'").get() as { value: string }).value)).toBe(3);
      expect(Number((db.prepare("SELECT COUNT(*) AS count FROM account_match_participants").get() as { count: number }).count)).toBe(0);
      expect(Number((db.prepare("SELECT COUNT(*) AS count FROM account_game_results").get() as { count: number }).count)).toBe(0);
      expect(Number((db.prepare("SELECT COUNT(*) AS count FROM account_series_results").get() as { count: number }).count)).toBe(0);
      expect(await readdir(backupDir)).toHaveLength(1);
    } finally {
      db?.close();
      reopened?.close();
      await rm(dir, { recursive: true, force: true });
    }
  });
});
