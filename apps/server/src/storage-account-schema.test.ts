import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import {
  openSqliteAccountDatabase,
  SqliteMatchStorage,
} from "./storage-sqlite";

describe("SQLite schema contract", () => {
  it("rejects the previous match schema without writing it and can open its account tables separately", async () => {
    const dir = await mkdtemp(join(tmpdir(), "netgrid-split-sqlite-"));
    const oldPath = join(dir, "previous.sqlite");
    const newPath = join(dir, "matches.sqlite");
    const backupDir = join(dir, "backups");
    try {
      new SqliteMatchStorage({ dbPath: oldPath, backupDir }).close();
      const oldDb = new DatabaseSync(oldPath);
      try {
        oldDb.exec("PRAGMA journal_mode = DELETE");
        oldDb.exec(
          "UPDATE storage_meta SET value = '3' WHERE key = 'schema_version'",
        );
      } finally {
        oldDb.close();
      }
      const before = await readFile(oldPath);
      expect(
        () => new SqliteMatchStorage({ dbPath: oldPath, backupDir }),
      ).toThrow(/aktuelle Schema/);
      expect(await readFile(oldPath)).toEqual(before);
      new SqliteMatchStorage({ dbPath: newPath, backupDir }).close();
      const accountDb = openSqliteAccountDatabase({
        dbPath: oldPath,
        backupDir,
      });
      try {
        expect(
          accountDb.prepare("SELECT COUNT(*) AS count FROM accounts").get(),
        ).toEqual({ count: 0 });
        expect(
          accountDb
            .prepare(
              "SELECT value FROM storage_meta WHERE key = 'schema_version'",
            )
            .get(),
        ).toEqual({ value: "3" });
      } finally {
        accountDb.close();
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("rejects schema 9 before mutating an existing match database", async () => {
    const dir = await mkdtemp(join(tmpdir(), "netgrid-current-rng-schema-"));
    const dbPath = join(dir, "previous.sqlite");
    const backupDir = join(dir, "backups");
    try {
      new SqliteMatchStorage({ dbPath, backupDir }).close();
      const db = new DatabaseSync(dbPath);
      try {
        db.exec("PRAGMA journal_mode = DELETE");
        db.prepare(
          "UPDATE storage_meta SET value = ? WHERE key = 'schema_version'",
        ).run("9");
      } finally {
        db.close();
      }
      const before = await readFile(dbPath);
      expect(() => new SqliteMatchStorage({ dbPath, backupDir })).toThrow(
        /aktuelle Schema/,
      );
      expect(await readFile(dbPath)).toEqual(before);
      expect(await readdir(backupDir)).toEqual([]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

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
        "account_match_start_preferences",
        "account_reset_tokens",
        "account_invites",
        "account_sessions",
        "account_credentials",
        "account_password_credentials",
        "accounts",
      ]) {
        db.exec(`DROP TABLE IF EXISTS ${table}`);
      }
      db.prepare(
        "UPDATE storage_meta SET value = '1' WHERE key = 'schema_version'",
      ).run();
      db.close();
      db = undefined;

      expect(() => new SqliteMatchStorage({ dbPath, backupDir })).toThrow(
        /aktuelle Schema/,
      );
      expect(await readdir(backupDir)).toHaveLength(0);
    } finally {
      db?.close();
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("rejects schema 2 without creating a migration backup", async () => {
    const dir = await mkdtemp(
      join(tmpdir(), "netgrid-account-statistics-schema-"),
    );
    const dbPath = join(dir, "netgrid.sqlite");
    const backupDir = join(dir, "backups");
    let db: DatabaseSync | undefined;
    try {
      const initial = new SqliteMatchStorage({ dbPath, backupDir });
      initial.close();
      db = new DatabaseSync(dbPath);
      for (const table of [
        "account_series_results",
        "account_game_results",
        "account_match_participants",
      ]) {
        db.exec(`DROP TABLE ${table}`);
      }
      db.prepare(
        "DELETE FROM storage_meta WHERE key = 'account_statistics_since'",
      ).run();
      db.prepare(
        "UPDATE storage_meta SET value = '2' WHERE key = 'schema_version'",
      ).run();
      db.close();
      db = undefined;

      expect(() => new SqliteMatchStorage({ dbPath, backupDir })).toThrow(
        /aktuelle Schema/,
      );
      expect(await readdir(backupDir)).toHaveLength(0);
    } finally {
      db?.close();
      await rm(dir, { recursive: true, force: true });
    }
  });
});
