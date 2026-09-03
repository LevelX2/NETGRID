import { existsSync } from "node:fs";
import { basename, resolve } from "node:path";
import {
  SqliteMatchStorage,
  inspectSqliteStorage,
  restoreSqliteStorageBackup,
} from "./storage-sqlite";
import { resolveServerRuntimePaths } from "./runtime-paths";

const command = process.argv[2] ?? "inspect";
const { matchSqlitePath: dbPath, storageBackupDir: backupDir } =
  resolveServerRuntimePaths();

try {
  if (command === "backup") {
    const storage = new SqliteMatchStorage({ dbPath, backupDir });
    try {
      const result = await storage.backup("manual");
      console.log(
        JSON.stringify(
          { ok: true, backupDir: result.backupDir, manifest: result.manifest },
          null,
          2,
        ),
      );
    } finally {
      storage.close();
    }
  } else if (command === "optimize") {
    const storage = new SqliteMatchStorage({ dbPath, backupDir });
    try {
      const result = await storage.maintenanceOptimize();
      console.log(JSON.stringify({ ok: true, ...result }, null, 2));
    } finally {
      storage.close();
    }
  } else if (command === "restore") {
    const source = process.argv[3];
    if (!source) throw new Error("Usage: storage-cli restore <backupDir>");
    const result = restoreSqliteStorageBackup({
      backupDir: resolve(source),
      targetPath: dbPath,
      backupRootDir: backupDir,
    });
    console.log(JSON.stringify({ ok: true, ...result }, null, 2));
  } else if (command === "inspect") {
    if (!existsSync(dbPath)) {
      console.log(
        JSON.stringify(
          {
            ok: true,
            kind: "sqlite",
            database: basename(dbPath),
            matchCount: 0,
            exists: false,
          },
          null,
          2,
        ),
      );
    } else {
      console.log(JSON.stringify(inspectSqliteStorage(dbPath), null, 2));
    }
  } else {
    throw new Error("Usage: storage-cli <backup|restore|inspect|optimize>");
  }
} catch (error) {
  const message =
    error instanceof Error ? error.message : "Storage-Befehl fehlgeschlagen.";
  console.error(
    JSON.stringify(
      { ok: false, error: { code: "storage_admin_failed", message } },
      null,
      2,
    ),
  );
  process.exitCode = 1;
}
