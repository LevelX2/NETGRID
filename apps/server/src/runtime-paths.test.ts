import path from "node:path";
import { describe, expect, it } from "vitest";

import { resolveServerRuntimePaths } from "./runtime-paths";

describe("server runtime paths", () => {
  it("keeps repository-relative defaults in the development profile", () => {
    const repositoryRoot = path.resolve("C:/netgrid-source");
    const paths = resolveServerRuntimePaths({ env: {}, repositoryRoot });

    expect(paths.matchSqlitePath).toBe(
      path.join(repositoryRoot, "data", "runtime", "multiplayer", "netgrid.sqlite"),
    );
    expect(paths.accountSqlitePath).toBe(paths.matchSqlitePath);
    expect(paths.storageBackupDir).toBe(
      path.join(repositoryRoot, "data", "runtime", "backups"),
    );
  });

  it("binds every default beneath an explicit external data root", () => {
    const dataRoot = path.resolve("C:/ProgramData/NETGRID");
    const paths = resolveServerRuntimePaths({
      env: { NETGRID_DATA_ROOT: dataRoot },
      repositoryRoot: path.resolve("C:/netgrid-source"),
    });

    expect(paths).toEqual({
      dataRoot,
      matchSqlitePath: path.join(
        dataRoot,
        "runtime",
        "multiplayer",
        "netgrid.sqlite",
      ),
      accountSqlitePath: path.join(
        dataRoot,
        "runtime",
        "multiplayer",
        "netgrid.sqlite",
      ),
      storageBackupDir: path.join(dataRoot, "runtime", "backups"),
      connectionAuditLogPath: path.join(
        dataRoot,
        "runtime",
        "logs",
        "connection-audit.ndjson",
      ),
      maintenanceAuthPath: path.join(
        dataRoot,
        "runtime",
        "maintenance",
        "auth.json",
      ),
    });
  });

  it("requires an external data root and absolute overrides in release", () => {
    expect(() =>
      resolveServerRuntimePaths({ env: { NETGRID_RUNTIME_PROFILE: "release" } }),
    ).toThrowError(
      expect.objectContaining({ code: "release_data_root_required" }),
    );
    expect(() =>
      resolveServerRuntimePaths({
        env: {
          NETGRID_RUNTIME_PROFILE: "release",
          NETGRID_DATA_ROOT: path.resolve("C:/ProgramData/NETGRID"),
          NETGRID_STORAGE_BACKUP_DIR: "relative/backups",
        },
      }),
    ).toThrowError(
      expect.objectContaining({
        code: "release_runtime_path_must_be_absolute",
      }),
    );
  });

  it("allows two completely isolated release roots", () => {
    const first = resolveServerRuntimePaths({
      env: {
        NETGRID_RUNTIME_PROFILE: "release",
        NETGRID_DATA_ROOT: path.resolve("C:/ProgramData/NETGRID-A"),
      },
    });
    const second = resolveServerRuntimePaths({
      env: {
        NETGRID_RUNTIME_PROFILE: "release",
        NETGRID_DATA_ROOT: path.resolve("C:/ProgramData/NETGRID-B"),
      },
    });

    for (const value of Object.values(first))
      expect(value.startsWith(first.dataRoot)).toBe(true);
    for (const value of Object.values(second))
      expect(value.startsWith(second.dataRoot)).toBe(true);
    expect(first.matchSqlitePath).not.toBe(second.matchSqlitePath);
  });
});
