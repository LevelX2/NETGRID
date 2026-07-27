import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { SqliteAccountDeckStorage } from "./account-decks";
import { SqliteAccountStorage } from "./account-session";
import { SqliteAccountStatisticsStorage } from "./account-statistics";
import { MultiplayerService } from "./multiplayer";
import {
  SQLITE_BUSY_TIMEOUT_MS,
  SqliteMatchStorage,
  StorageError,
} from "./storage-sqlite";

type StorageConnection = { db: DatabaseSync };

function databaseFor(storage: object): DatabaseSync {
  return (storage as StorageConnection).db;
}

function pragmaValue(database: DatabaseSync, name: string): string | number {
  const row = database.prepare(`PRAGMA ${name}`).get() as Record<
    string,
    string | number
  >;
  return Object.values(row)[0] ?? "";
}

describe("SQLite locking resilience", () => {
  it("uses WAL and a short common timeout, survives a reader overlap, and recovers after a writer lock", async () => {
    const dir = await mkdtemp(join(tmpdir(), "netgrid-sqlite-locking-"));
    const dbPath = join(dir, "netgrid.sqlite");
    const backupDir = join(dir, "backups");
    const storage = new SqliteMatchStorage({ dbPath, backupDir });
    const accounts = new SqliteAccountStorage({ dbPath, backupDir });
    const decks = new SqliteAccountDeckStorage({ dbPath, backupDir });
    const statistics = new SqliteAccountStatisticsStorage({
      dbPath,
      backupDir,
    });
    const service = new MultiplayerService(storage, {
      tokenSalt: "sqlite-locking-test",
    });
    let reader: DatabaseSync | undefined;
    let writer: DatabaseSync | undefined;
    try {
      for (const connection of [storage, accounts, decks, statistics].map(
        databaseFor,
      ))
        expect(pragmaValue(connection, "busy_timeout")).toBe(
          SQLITE_BUSY_TIMEOUT_MS,
        );
      expect(pragmaValue(databaseFor(storage), "journal_mode")).toBe("wal");

      reader = new DatabaseSync(dbPath, { readOnly: true });
      reader.exec("BEGIN");
      reader.prepare("SELECT COUNT(*) FROM storage_meta").get();
      await expect(
        service.createMatch({ hostSide: "runner", seed: "reader-overlap" }),
      ).resolves.toMatchObject({ matchId: expect.any(String) });
      reader.exec("ROLLBACK");
      reader.close();
      reader = undefined;

      writer = new DatabaseSync(dbPath);
      writer.exec("BEGIN IMMEDIATE");
      await expect(
        service.createMatch({ hostSide: "runner", seed: "writer-lock" }),
      ).rejects.toMatchObject({
        name: "StorageError",
        code: "storage_temporarily_unavailable",
      } satisfies Partial<StorageError>);
      expect(await storage.list()).toHaveLength(1);

      writer.exec("ROLLBACK");
      writer.close();
      writer = undefined;
      await expect(
        service.createMatch({ hostSide: "runner", seed: "writer-released" }),
      ).resolves.toMatchObject({ matchId: expect.any(String) });
      expect(await storage.list()).toHaveLength(2);

      const backup = await storage.backup();
      expect(
        backup.manifest.files.some((file) => file.name === "netgrid.sqlite"),
      ).toBe(true);
      const backupDb = new DatabaseSync(
        join(backup.backupDir, "netgrid.sqlite"),
        {
          readOnly: true,
        },
      );
      try {
        expect(pragmaValue(backupDb, "integrity_check")).toBe("ok");
      } finally {
        backupDb.close();
      }
    } finally {
      reader?.close();
      writer?.close();
      statistics.close();
      decks.close();
      accounts.close();
      storage.close();
      await rm(dir, { recursive: true, force: true });
    }
  });
});
