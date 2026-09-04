import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SqliteMatchStorage } from "./storage-sqlite";

describe("installed-product cleanup initialization", () => {
  it("sets the selected initial policy once and preserves later policy ownership", async () => {
    const root = await mkdtemp(join(tmpdir(), "netgrid-cleanup-initial-"));
    const dbPath = join(root, "netgrid.sqlite");
    const backupDir = join(root, "backups");
    try {
      const initial = new SqliteMatchStorage({
        dbPath,
        backupDir,
        initialCleanupPolicy: { enabled: true, olderThanDays: 90 },
      });
      expect(await initial.maintenanceCleanupPolicy()).toMatchObject({
        enabled: true,
        olderThanDays: 90,
        includeProtected: false,
        createBackup: false,
      });
      await initial.setMaintenanceCleanupPolicy({
        enabled: false,
        statuses: ["abandoned"],
        olderThanDays: 365,
        includeProtected: false,
        createBackup: false,
      });
      initial.close();

      const reopened = new SqliteMatchStorage({
        dbPath,
        backupDir,
        initialCleanupPolicy: { enabled: true, olderThanDays: 7 },
      });
      expect(await reopened.maintenanceCleanupPolicy()).toMatchObject({
        enabled: false,
        olderThanDays: 365,
      });
      reopened.close();
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
