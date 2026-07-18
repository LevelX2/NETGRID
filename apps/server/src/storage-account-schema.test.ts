import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { SqliteAccountStorage } from "./account-session";
import { SQLITE_STORAGE_SCHEMA_VERSION, SqliteMatchStorage } from "./storage-sqlite";

describe("SQLite account schema migration", () => {
  it("migrates schema 1 to the shared schema 2 and creates a pre-migration backup", async () => {
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
      for (const table of ["accounts", "account_password_credentials", "account_sessions", "account_invites", "account_reset_tokens", "account_decks"]) {
        expect(tables.has(table), table).toBe(true);
      }
      expect(await readdir(backupDir)).toHaveLength(1);
    } finally {
      db?.close();
      accountStorage?.close();
      await rm(dir, { recursive: true, force: true });
    }
  });
});
