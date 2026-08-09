import type { GameState, StateHash } from "@netgrid/shared";
import { createCurrentCardRegistryRulesContext } from "./card-registry-rules-context";

export function hashStateSnapshot(state: GameState): StateHash {
  const rulesContext = createCurrentCardRegistryRulesContext({
    cardPoolSnapshotId: cardPoolSnapshotIdentityForState(state),
    // CS06 replaces the empty CardSpec migration boundary with resolved IDs.
    matchCardPoolDefinitionIds: [],
  });
  return hashStateSnapshotWithRulesContext(state, rulesContext.fingerprint);
}

export function hashStateSnapshotWithRulesContext(
  state: GameState,
  rulesContextFingerprint: string,
): StateHash {
  const canonical = stableStringifyForHash({
    state: stripEventLogForHash(state),
    rulesContextFingerprint,
  });
  let hash = 0x811c9dc5;
  for (let index = 0; index < canonical.length; index += 1) {
    hash ^= canonical.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function cardPoolSnapshotIdentityForState(state: GameState): string {
  if (!state.deckMetadata) return "pre-deck-metadata";
  return stableStringifyForHash({
    corp: state.deckMetadata.corp.cardPoolSnapshotId,
    runner: state.deckMetadata.runner.cardPoolSnapshotId,
  });
}

export function stripEventLogForHash(state: GameState): unknown {
  const {
    cardTextSource: _cardTextSource,
    cardTextSnapshotId: _cardTextSnapshotId,
    ...mechanicalBaseline
  } = state.baseline;
  return { ...state, baseline: mechanicalBaseline, eventLog: [] };
}

export function stableStringifyForHash(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value))
    return `[${value.map(stableStringifyForHash).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map(
      (key) => `${JSON.stringify(key)}:${stableStringifyForHash(record[key])}`,
    )
    .join(",")}}`;
}
