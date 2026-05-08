import { existsSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { envValue } from "./internet-hardening";
import {
  DEFAULT_SQLITE_STORAGE_PATH,
  DEFAULT_STORAGE_BACKUP_DIR,
  SqliteMatchStorage,
  inspectSqliteStorage,
  restoreSqliteStorageBackup
} from "./storage-sqlite";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const command = process.argv[2] ?? "inspect";
const dbPath = resolve(envValue(process.env, "NETGRID_SQLITE_STORAGE_PATH", "NETRUNNER_SQLITE_STORAGE_PATH") ?? resolve(root, DEFAULT_SQLITE_STORAGE_PATH));
const backupDir = resolve(envValue(process.env, "NETGRID_STORAGE_BACKUP_DIR", "NETRUNNER_STORAGE_BACKUP_DIR") ?? resolve(root, DEFAULT_STORAGE_BACKUP_DIR));

try {
  if (command === "backup") {
    const storage = new SqliteMatchStorage({ dbPath, backupDir, autoImportLegacy: false });
    const result = await storage.backup("manual");
    storage.close();
    console.log(JSON.stringify({ ok: true, backupDir: result.backupDir, manifest: result.manifest }, null, 2));
  } else if (command === "restore") {
    const source = process.argv[3];
    if (!source) throw new Error("Usage: storage-cli restore <backupDir>");
    const result = restoreSqliteStorageBackup({ backupDir: resolve(source), targetPath: dbPath, backupRootDir: backupDir });
    console.log(JSON.stringify({ ok: true, ...result }, null, 2));
  } else if (command === "inspect") {
    if (!existsSync(dbPath)) {
      console.log(JSON.stringify({ ok: true, kind: "sqlite", database: basename(dbPath), matchCount: 0, exists: false }, null, 2));
    } else {
      console.log(JSON.stringify(inspectSqliteStorage(dbPath), null, 2));
    }
  } else if (command === "import-legacy") {
    const storage = new SqliteMatchStorage({ dbPath, backupDir, autoImportLegacy: true });
    const health = await storage.health();
    storage.close();
    console.log(JSON.stringify({ ok: true, storage: health }, null, 2));
  } else {
    throw new Error("Usage: storage-cli <backup|restore|inspect|import-legacy>");
  }
} catch (error) {
  const message = error instanceof Error ? error.message : "Storage-Befehl fehlgeschlagen.";
  console.error(JSON.stringify({ ok: false, error: { code: "storage_admin_failed", message } }, null, 2));
  process.exitCode = 1;
}
