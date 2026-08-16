import {
  DEFAULT_TRACE_RULES_PROFILE,
  type GameState,
  type StateHash,
} from "@netgrid/shared";
import { cardSpecRuntimeDefinitionIds } from "@netgrid/cards/engine";
import { createCurrentCardRegistryRulesContext } from "./card-registry-rules-context";

export function hashStateSnapshot(state: GameState): StateHash {
  const rulesContext = createCurrentCardRegistryRulesContext({
    cardPoolSnapshotId: cardPoolSnapshotIdentityForState(state),
    matchCardPoolDefinitionIds: matchCardSpecDefinitionIdsForState(state),
  });
  return hashStateSnapshotWithRulesContext(state, rulesContext.fingerprint);
}

const activeCardSpecDefinitionIds = new Set<string>(
  cardSpecRuntimeDefinitionIds(),
);

export class StateHashCardPoolError extends Error {
  readonly name = "StateHashCardPoolError";
  readonly code = "missing_card_instances" as const;

  constructor() {
    super(
      "GameState.cardInstances must be present to derive the rules context",
    );
  }
}

export function matchCardSpecDefinitionIdsForState(state: GameState): string[] {
  if (
    state.cardInstances === null ||
    typeof state.cardInstances !== "object" ||
    Array.isArray(state.cardInstances)
  )
    throw new StateHashCardPoolError();
  return [
    ...new Set(
      Object.values(state.cardInstances)
        .map((card) => card.definitionId)
        .filter((definitionId) =>
          activeCardSpecDefinitionIds.has(definitionId),
        ),
    ),
  ].sort();
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
    traceRulesProfile,
    trace,
    baseline,
    eventLog: _eventLog,
    ...stateWithoutTraceProfile
  } = state;
  const {
    cardTextSource: _cardTextSource,
    cardTextSnapshotId: _cardTextSnapshotId,
    ...mechanicalBaseline
  } = baseline;
  const normalizedProfile = traceRulesProfile ?? DEFAULT_TRACE_RULES_PROFILE;
  const canonicalTrace = trace
    ? canonicalTraceForHash(trace, normalizedProfile)
    : undefined;
  return {
    ...stateWithoutTraceProfile,
    ...(normalizedProfile !== DEFAULT_TRACE_RULES_PROFILE
      ? { traceRulesProfile: normalizedProfile }
      : {}),
    ...(canonicalTrace ? { trace: canonicalTrace } : {}),
    baseline: mechanicalBaseline,
    eventLog: [],
  };
}

function canonicalTraceForHash(
  trace: NonNullable<GameState["trace"]>,
  matchProfile: NonNullable<GameState["traceRulesProfile"]>,
): unknown {
  const { traceRulesProfile, bidsRevealed, ...traceWithoutDefaultProfile } =
    trace;
  const normalizedProfile = traceRulesProfile ?? matchProfile;
  return {
    ...traceWithoutDefaultProfile,
    ...(normalizedProfile !== DEFAULT_TRACE_RULES_PROFILE
      ? {
          traceRulesProfile: normalizedProfile,
          ...(bidsRevealed !== undefined ? { bidsRevealed } : {}),
        }
      : {}),
  };
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
