import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { SqliteMatchStorage } from "./storage-sqlite";

describe("SQLite schema contract", () => {
  it("rejects schema 1 without creating a migration backup", async () => {
    const dir = await mkdtemp(join(tmpdir(), "netgrid-account-schema-"));
    const dbPath = join(dir, "netgrid.sqlite");
    const backupDir = join(dir, "backups");
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

      expect(() => new SqliteMatchStorage({ dbPath, backupDir })).toThrow(/aktuelle Schema/);
      expect(await readdir(backupDir)).toHaveLength(0);
    } finally {
      db?.close();
      await rm(dir, { recursive: true, force: true });
    }
  });
});
