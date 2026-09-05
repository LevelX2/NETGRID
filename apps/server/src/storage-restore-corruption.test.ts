import { mkdtemp, readFile, rm, writeFile, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, expect, it } from "vitest";
import {
  SqliteMatchStorage,
  restoreSqliteStorageBackup,
} from "./storage-sqlite";
import { preserveStoppedSqliteTarget } from "./storage-restore-snapshot";

const directories: string[] = [];
afterEach(async () => {
  for (const directory of directories.splice(0)) {
    await rm(directory, { recursive: true, force: true });
  }
});

it("restores a verified update backup even when the stopped target database is corrupt", async () => {
  const directory = await mkdtemp(join(tmpdir(), "netgrid-restore-corrupt-"));
  directories.push(directory);
  const targetPath = join(directory, "netgrid.sqlite");
  const backupRootDir = join(directory, "backups");
  const storage = new SqliteMatchStorage({
    dbPath: targetPath,
    backupDir: backupRootDir,
  });
  const backup = await storage.backup("pre_update");
  storage.close();
  await writeFile(targetPath, "deliberately corrupt disposable test database");
  await writeFile(`${targetPath}-wal`, "stale WAL from failed test version");
  await writeFile(
    `${targetPath}-shm`,
    "stale shared memory from failed test version",
  );

  const result = restoreSqliteStorageBackup({
    backupDir: backup.backupDir,
    targetPath,
    backupRootDir,
  });
  expect(result.preRestoreSnapshotDir).toBeTruthy();
  expect(
    await readFile(
      join(result.preRestoreSnapshotDir!, "database.sqlite-wal"),
      "utf8",
    ),
  ).toBe("stale WAL from failed test version");
  await expect(access(`${targetPath}-wal`)).rejects.toThrow();
  await expect(access(`${targetPath}-shm`)).rejects.toThrow();
  expect(
    await readFile(
      join(result.preRestoreSnapshotDir!, "database.sqlite"),
      "utf8",
    ),
  ).toBe("deliberately corrupt disposable test database");
  expect(
    JSON.parse(
      await readFile(
        join(result.preRestoreSnapshotDir!, "snapshot.json"),
        "utf8",
      ),
    ),
  ).toMatchObject({
    schemaVersion: "netgrid-pre-restore-files-v1",
    sqliteHealth: "not-asserted",
  });

  expect(await readFile(targetPath)).toEqual(
    await readFile(join(backup.backupDir, "netgrid.sqlite")),
  );
  const restored = new DatabaseSync(targetPath, { readOnly: true });
  try {
    expect(
      restored.prepare("PRAGMA integrity_check").get()?.integrity_check,
    ).toBe("ok");
  } finally {
    restored.close();
  }
});

it("rejects a changed target before discarding any preserved SQLite sidecar", async () => {
  const directory = await mkdtemp(join(tmpdir(), "netgrid-restore-corrupt-"));
  directories.push(directory);
  const targetPath = join(directory, "netgrid.sqlite");
  await writeFile(targetPath, "stopped target");
  await writeFile(`${targetPath}-wal`, "original WAL");
  const preserved = preserveStoppedSqliteTarget(
    targetPath,
    join(directory, "backups"),
  );
  await writeFile(targetPath, "unexpected concurrent writer");
  expect(() => preserved.discardPreservedSidecars()).toThrow(
    "restore_target_changed_after_snapshot",
  );
  expect(await readFile(`${targetPath}-wal`, "utf8")).toBe("original WAL");
});

it("rejects a newly created target after an initially empty restore preflight", async () => {
  const directory = await mkdtemp(join(tmpdir(), "netgrid-restore-corrupt-"));
  directories.push(directory);
  const targetPath = join(directory, "netgrid.sqlite");
  const preserved = preserveStoppedSqliteTarget(
    targetPath,
    join(directory, "backups"),
  );
  await writeFile(targetPath, "unexpected concurrent writer");
  expect(() => preserved.discardPreservedSidecars()).toThrow(
    "restore_target_changed_after_snapshot",
  );
});
