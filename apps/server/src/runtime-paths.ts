import {
  NETGRID_DATA_ROOT_ENV,
  resolveNetgridDataRoot,
  resolveNetgridRepositoryRoot,
} from "@netgrid/card-images/paths";
import { runtimeProfileFromEnvironment } from "@netgrid/shared";
import path from "node:path";

export type ServerRuntimePaths = Readonly<{
  dataRoot: string;
  matchSqlitePath: string;
  accountSqlitePath: string;
  storageBackupDir: string;
  connectionAuditLogPath: string;
  maintenanceAuthPath: string;
}>;

export type ServerRuntimePathOptions = {
  env?: NodeJS.ProcessEnv;
  repositoryRoot?: string;
  startDirectory?: string;
};

export class ServerRuntimePathError extends Error {
  readonly name = "ServerRuntimePathError";

  constructor(
    readonly code:
      | "release_data_root_required"
      | "release_runtime_path_must_be_absolute"
      | "runtime_path_too_broad",
    message: string,
  ) {
    super(message);
  }
}

export function resolveServerRuntimePaths(
  options: ServerRuntimePathOptions = {},
): ServerRuntimePaths {
  const env = options.env ?? process.env;
  const profile = runtimeProfileFromEnvironment(env);
  if (profile === "release" && !env[NETGRID_DATA_ROOT_ENV]?.trim())
    throw new ServerRuntimePathError(
      "release_data_root_required",
      `${NETGRID_DATA_ROOT_ENV} ist im Releaseprofil erforderlich.`,
    );

  const dataRoot = resolveNetgridDataRoot({
    env,
    ...(options.repositoryRoot === undefined
      ? {}
      : { repositoryRoot: options.repositoryRoot }),
    ...(options.startDirectory === undefined
      ? {}
      : { startDirectory: options.startDirectory }),
  });
  let repositoryRoot: string | undefined = options.repositoryRoot
    ? path.resolve(options.repositoryRoot)
    : undefined;
  const repositoryBase = () =>
    (repositoryRoot ??= resolveNetgridRepositoryRoot(options.startDirectory));
  const runtimePath = (
    environmentKey: string,
    fallbackSegments: readonly string[],
  ): string => {
    const configured = env[environmentKey]?.trim();
    const resolved = configured
      ? path.isAbsolute(configured)
        ? path.resolve(configured)
        : profile === "release"
          ? failRelativeReleasePath(environmentKey)
          : path.resolve(repositoryBase(), configured)
      : path.join(dataRoot, ...fallbackSegments);
    if (resolved === path.parse(resolved).root)
      throw new ServerRuntimePathError(
        "runtime_path_too_broad",
        `${environmentKey} darf nicht auf eine Dateisystemwurzel zeigen.`,
      );
    return resolved;
  };

  const matchSqlitePath = runtimePath("NETGRID_SQLITE_STORAGE_PATH", [
    "runtime",
    "multiplayer",
    "netgrid.sqlite",
  ]);
  return Object.freeze({
    dataRoot,
    matchSqlitePath,
    accountSqlitePath: env.NETGRID_ACCOUNT_SQLITE_PATH?.trim()
      ? runtimePath("NETGRID_ACCOUNT_SQLITE_PATH", [
          "runtime",
          "multiplayer",
          "netgrid.sqlite",
        ])
      : matchSqlitePath,
    storageBackupDir: runtimePath("NETGRID_STORAGE_BACKUP_DIR", [
      "runtime",
      "backups",
    ]),
    connectionAuditLogPath: runtimePath(
      "NETGRID_CONNECTION_AUDIT_LOG_PATH",
      ["runtime", "logs", "connection-audit.ndjson"],
    ),
    maintenanceAuthPath: runtimePath("NETGRID_MAINTENANCE_AUTH_PATH", [
      "runtime",
      "maintenance",
      "auth.json",
    ]),
  });
}

function failRelativeReleasePath(environmentKey: string): never {
  throw new ServerRuntimePathError(
    "release_runtime_path_must_be_absolute",
    `${environmentKey} muss im Releaseprofil absolut sein.`,
  );
}
