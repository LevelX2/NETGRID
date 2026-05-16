import type { GameState, StateHash } from "@netgrid/shared";

export function hashStateSnapshot(state: GameState): StateHash {
  const canonical = stableStringifyForHash(stripEventLogForHash(state));
  let hash = 0x811c9dc5;
  for (let index = 0; index < canonical.length; index += 1) {
    hash ^= canonical.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function stripEventLogForHash(state: GameState): unknown {
  const copy = structuredClone(state) as GameState;
  copy.eventLog = [];
  return copy;
}

export function stableStringifyForHash(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringifyForHash).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringifyForHash(record[key])}`)
    .join(",")}}`;
}
