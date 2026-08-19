import { existsSync } from "node:fs";
import path from "node:path";

export const NETGRID_DATA_ROOT_ENV = "NETGRID_DATA_ROOT";

export type NetgridPathConfigErrorCode =
  | "repository_root_not_found"
  | "data_root_must_be_absolute"
  | "data_root_too_broad";

export class NetgridPathConfigError extends Error {
  constructor(
    readonly code: NetgridPathConfigErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "NetgridPathConfigError";
  }
}

export type NetgridPathOptions = {
  env?: NodeJS.ProcessEnv;
  startDirectory?: string;
  repositoryRoot?: string;
};

export function resolveNetgridRepositoryRoot(
  startDirectory = process.cwd(),
): string {
  let candidate = path.resolve(startDirectory);
  while (true) {
    if (isNetgridRepositoryRoot(candidate)) return candidate;
    const parent = path.dirname(candidate);
    if (parent === candidate) break;
    candidate = parent;
  }
  throw new NetgridPathConfigError(
    "repository_root_not_found",
    `NETGRID-Projektwurzel konnte aus ${path.resolve(startDirectory)} nicht ermittelt werden.`,
  );
}

export function resolveNetgridDataRoot(
  options: NetgridPathOptions = {},
): string {
  const configured = configuredDataRoot(options.env ?? process.env);
  if (configured) return configured;
  return path.join(repositoryRoot(options), "data");
}

export function resolveNetgridCardImageRoot(
  options: NetgridPathOptions = {},
): string {
  const configured = configuredDataRoot(options.env ?? process.env);
  if (configured) return path.join(configured, "card-images");
  return path.join(
    repositoryRoot(options),
    "data",
    "local-assets",
    "card-images",
  );
}

export function resolveNetgridManagedCardImageRoot(
  options: NetgridPathOptions = {},
): string {
  return path.join(resolveNetgridCardImageRoot(options), "managed");
}

export function resolveNetgridCardImagePackRoot(
  options: NetgridPathOptions = {},
): string {
  return path.join(
    path.dirname(resolveNetgridCardImageRoot(options)),
    "card-image-packs",
  );
}

export function resolveNetgridCardImagePackSourceRoot(
  options: NetgridPathOptions = {},
): string {
  return path.join(resolveNetgridCardImagePackRoot(options), "source");
}

export function resolveNetgridCardImagePackBuildRoot(
  options: NetgridPathOptions = {},
): string {
  return path.join(resolveNetgridCardImagePackRoot(options), "build");
}

function configuredDataRoot(env: NodeJS.ProcessEnv): string | undefined {
  const value = env[NETGRID_DATA_ROOT_ENV]?.trim();
  if (!value) return undefined;
  if (!path.isAbsolute(value)) {
    throw new NetgridPathConfigError(
      "data_root_must_be_absolute",
      `${NETGRID_DATA_ROOT_ENV} muss ein absoluter Pfad sein.`,
    );
  }
  const resolved = path.resolve(value);
  if (resolved === path.parse(resolved).root) {
    throw new NetgridPathConfigError(
      "data_root_too_broad",
      `${NETGRID_DATA_ROOT_ENV} darf nicht auf eine Dateisystemwurzel zeigen.`,
    );
  }
  return resolved;
}

function repositoryRoot(options: NetgridPathOptions): string {
  if (options.repositoryRoot) return path.resolve(options.repositoryRoot);
  return resolveNetgridRepositoryRoot(options.startDirectory);
}

function isNetgridRepositoryRoot(candidate: string): boolean {
  return (
    existsSync(path.join(candidate, "package.json")) &&
    existsSync(path.join(candidate, "data", "card-import"))
  );
}
