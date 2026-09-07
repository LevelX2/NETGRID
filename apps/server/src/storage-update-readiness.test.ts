import { afterEach, describe, expect, it } from "vitest";
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { DatabaseSync } from "node:sqlite";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { MultiplayerService } from "./multiplayer";
import {
  SqliteMatchStorage,
  inspectSqliteUpdateReadiness,
} from "./storage-sqlite";
import type { ApiMatchStatus } from "@netgrid/shared";

const roots: string[] = [];
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "netgrid-offline-readiness-"));
  roots.push(root);
  return {
    root,
    dbPath: join(root, "matches.sqlite"),
    backupDir: join(root, "backups"),
  };
}
afterEach(() => {
  for (const root of roots.splice(0)) {
    if (!root.startsWith(join(tmpdir(), "netgrid-offline-readiness-")))
      throw new Error("fixture_scope_invalid");
    rmSync(root, { recursive: true });
  }
});

describe("offline installer readiness", () => {
  it("exposes the read-only CLI command without creating a database or authentication store", () => {
    const { root, dbPath } = fixture();
    const env = Object.fromEntries(
      Object.entries(process.env).filter(
        ([key]) =>
          !key.startsWith("NETGRID_") &&
          key !== "NODE_OPTIONS" &&
          key !== "NODE_PATH",
      ),
    );
    const result = spawnSync(
      process.execPath,
      [
        "--import",
        "tsx",
        fileURLToPath(new URL("./storage-cli.ts", import.meta.url)),
        "update-readiness",
      ],
      {
        env: {
          ...env,
          NETGRID_RUNTIME_PROFILE: "release",
          NETGRID_DATA_ROOT: root,
          NETGRID_SQLITE_STORAGE_PATH: dbPath,
        },
        encoding: "utf8",
        timeout: 30_000,
        windowsHide: true,
      },
    );
    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout.trim()).toBe(
      '{"ok":true,"updateAllowed":true,"activeMatchCount":0}',
    );
    expect(readdirSync(root)).toEqual([]);
  }, 35_000);

  it("does not initialize a never-created database", () => {
    const { root, dbPath } = fixture();
    expect(inspectSqliteUpdateReadiness(dbPath)).toEqual({
      ok: true,
      updateAllowed: true,
      activeMatchCount: 0,
    });
    expect(readdirSync(root)).toEqual([]);
  });

  it("uses the existing maintenance terminal policy for all persisted statuses, without writes", async () => {
    const options = fixture();
    const cases = {
      pending: false,
      waiting_for_runner: false,
      waiting_for_corp: false,
      waiting_for_joiner_decks: false,
      ready_check: false,
      countdown: false,
      active: false,
      cancelled: true,
      abandoned: true,
      forfeited: true,
      finished: true,
    } satisfies Record<ApiMatchStatus, boolean>;
    const storage = new SqliteMatchStorage(options);
    const service = new MultiplayerService(storage, {
      tokenSalt: "offline-readiness-fixture",
    });
    try {
      const match = await service.createMatch({
        hostSide: "runner",
        seed: "offline-readiness-fixture",
      });
      const record = (await storage.load(match.matchId))!;
      for (const [status, allowed] of Object.entries(cases)) {
        record.match.status = status as ApiMatchStatus;
        await storage.save(record);
        const summary = await storage.maintenanceSummary();
        const actual = inspectSqliteUpdateReadiness(options.dbPath);
        expect(actual.activeMatchCount).toBe(summary.nonTerminalCount);
        expect(actual.updateAllowed).toBe(allowed);
      }
    } finally {
      storage.close();
    }
    for (const [status, allowed] of Object.entries(cases)) {
      // Isolate each artificial status, not an assertion of legal transitions.
      const db = new DatabaseSync(options.dbPath);
      db.prepare("UPDATE matches SET status = ?").run(status);
      db.close();
      const before = readFileSync(options.dbPath);
      const result = inspectSqliteUpdateReadiness(options.dbPath);
      expect(result.updateAllowed, status).toBe(allowed);
      expect(readFileSync(options.dbPath)).toEqual(before);
    }
    const invalidStatus = new DatabaseSync(options.dbPath);
    invalidStatus.prepare("UPDATE matches SET status = 'unknown-status'").run();
    invalidStatus.close();
    expect(() => inspectSqliteUpdateReadiness(options.dbPath)).toThrow(
      "Spielstatus",
    );
  }, 30_000);

  it("rejects corruption, missing schema and unknown storage format", () => {
    const options = fixture();
    writeFileSync(options.dbPath, "not a SQLite database");
    expect(() => inspectSqliteUpdateReadiness(options.dbPath)).toThrow();
    rmSync(options.dbPath);
    let db = new DatabaseSync(options.dbPath);
    db.close();
    expect(() => inspectSqliteUpdateReadiness(options.dbPath)).toThrow();
    rmSync(options.dbPath);
    const storage = new SqliteMatchStorage(options);
    storage.close();
    db = new DatabaseSync(options.dbPath);
    db.prepare(
      "UPDATE storage_meta SET value = 'unknown' WHERE key = 'storage_format'",
    ).run();
    db.close();
    expect(() => inspectSqliteUpdateReadiness(options.dbPath)).toThrow(
      "Speicherformat",
    );
  });
});
