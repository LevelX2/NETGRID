import type { CorpServer, ServerId } from "@netgrid/shared";

const CANONICAL_REMOTE_SERVER_ID = /^remote_([1-9]\d*)$/;

export function canonicalRemoteServerNumber(
  serverId: string,
): number | undefined {
  const match = CANONICAL_REMOTE_SERVER_ID.exec(serverId);
  if (!match) return undefined;
  const value = Number(match[1]);
  return Number.isSafeInteger(value) && value > 0 ? value : undefined;
}

export function corpServerIdsAreCanonicalAndUnique(
  servers: readonly CorpServer[],
): boolean {
  const ids = new Set<string>();
  for (const server of servers) {
    if (ids.has(server.id)) return false;
    ids.add(server.id);
    if (
      server.kind === "remote" &&
      canonicalRemoteServerNumber(server.id) === undefined
    )
      return false;
    if (
      server.kind !== "remote" &&
      (server.id !== server.kind ||
        (server.kind !== "hq" &&
          server.kind !== "rd" &&
          server.kind !== "archives"))
    )
      return false;
  }
  return true;
}

export function nextCanonicalRemoteServerId(
  servers: readonly CorpServer[],
): Exclude<ServerId, "new_remote"> | undefined {
  if (!corpServerIdsAreCanonicalAndUnique(servers)) return undefined;
  let maximum = 0;
  for (const server of servers) {
    if (server.kind !== "remote") continue;
    const value = canonicalRemoteServerNumber(server.id);
    if (value === undefined) return undefined;
    maximum = Math.max(maximum, value);
  }
  if (maximum >= Number.MAX_SAFE_INTEGER) return undefined;
  return `remote_${maximum + 1}`;
}
