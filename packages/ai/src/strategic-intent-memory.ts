import type { AiDecisionInput, Side } from "@netgrid/shared";
import type { DeckDoctrineV2Diagnostic } from "./deck-doctrine-strategy";
import {
  STRATEGIC_INTENT_STATE_SCHEMA_VERSION,
  type StrategicIntentState,
} from "./strategic-intent-state";

export const STRATEGIC_INTENT_MEMORY_SCHEMA_VERSION =
  "strategic-intent-memory-v1" as const;

export type StrategicIntentMemorySnapshot = {
  schemaVersion: typeof STRATEGIC_INTENT_MEMORY_SCHEMA_VERSION;
  memoryId: string;
  side: Side;
  deckSnapshotId: string;
  profileId: string;
  primaryStrategyId: string;
  phase: StrategicIntentState["phase"];
  transitionStatus: StrategicIntentState["transition"]["status"];
  decisionsCommitted: number;
  blockerIds: string[];
  ttlDecisionsRemaining: number;
  updatedAtStateVersion: number;
  state: StrategicIntentState;
  evidence: string[];
};

type StrategicIntentInputMetadata = {
  ownDeckDoctrineV2Diagnostic?: DeckDoctrineV2Diagnostic;
};

const strategicIntentMemoryByKey = new Map<
  string,
  StrategicIntentMemorySnapshot
>();

export function getStrategicIntentMemorySnapshot(
  input: AiDecisionInput,
  deckSnapshotId?: string,
): StrategicIntentMemorySnapshot | undefined {
  const key = strategicIntentMemoryKey(input, deckSnapshotId);
  if (input.playerView.winner !== null) {
    strategicIntentMemoryByKey.delete(key);
    return undefined;
  }
  const snapshot = strategicIntentMemoryByKey.get(key);
  if (!snapshot) return undefined;
  if (snapshot.side !== input.side || snapshot.deckSnapshotId !== deckId(input, deckSnapshotId)) {
    strategicIntentMemoryByKey.delete(key);
    return undefined;
  }
  if (snapshot.ttlDecisionsRemaining <= 0) {
    strategicIntentMemoryByKey.delete(key);
    return undefined;
  }
  return snapshot;
}

export function rememberStrategicIntentState(
  input: AiDecisionInput,
  state: StrategicIntentState,
  deckSnapshotId?: string,
): StrategicIntentMemorySnapshot | undefined {
  const key = strategicIntentMemoryKey(input, deckSnapshotId);
  if (input.playerView.winner !== null) {
    strategicIntentMemoryByKey.delete(key);
    return undefined;
  }
  if (state.side !== input.side) return undefined;
  const previous = strategicIntentMemoryByKey.get(key);
  const snapshot = createStrategicIntentMemorySnapshot({
    input,
    state,
    deckSnapshotId: deckId(input, deckSnapshotId),
    ...(previous ? { previous } : {}),
  });
  strategicIntentMemoryByKey.set(key, snapshot);
  return snapshot;
}

export function resetStrategicIntentMemory(): void {
  strategicIntentMemoryByKey.clear();
}

export function redactedStrategicIntentMemoryFacts(
  snapshot: StrategicIntentMemorySnapshot,
): string[] {
  return [
    `strategic_intent_memory:${snapshot.primaryStrategyId}`,
    `strategic_intent_memory_phase:${snapshot.phase}`,
    `strategic_intent_memory_transition:${snapshot.transitionStatus}`,
    `strategic_intent_memory_decisions:${snapshot.decisionsCommitted}`,
    `strategic_intent_memory_ttl:${snapshot.ttlDecisionsRemaining}`,
    `strategic_intent_memory_blockers:${snapshot.blockerIds.join("|") || "none"}`,
    `strategic_intent_memory_deck:${snapshot.deckSnapshotId}`,
  ];
}

function createStrategicIntentMemorySnapshot(params: {
  input: AiDecisionInput;
  state: StrategicIntentState;
  deckSnapshotId: string;
  previous?: StrategicIntentMemorySnapshot;
}): StrategicIntentMemorySnapshot {
  const ttlDecisionsRemaining = nextTtl(params.state, params.previous);
  return {
    schemaVersion: STRATEGIC_INTENT_MEMORY_SCHEMA_VERSION,
    memoryId: strategicIntentMemoryKey(params.input, params.deckSnapshotId),
    side: params.state.side,
    deckSnapshotId: params.deckSnapshotId,
    profileId: params.input.profileId,
    primaryStrategyId: params.state.primaryStrategy.strategyId,
    phase: params.state.phase,
    transitionStatus: params.state.transition.status,
    decisionsCommitted: params.state.commitment.decisionsCommitted,
    blockerIds: params.state.blockers.map((blocker) => blocker.blockerId).sort(),
    ttlDecisionsRemaining,
    updatedAtStateVersion: params.input.playerView.stateVersion,
    state: params.state,
    evidence: [
      "strategic_intent_memory:player_view_only",
      `strategic_intent_state_schema:${STRATEGIC_INTENT_STATE_SCHEMA_VERSION}`,
      `memory_key:${strategicIntentMemoryKey(params.input, params.deckSnapshotId)}`,
      `deck_snapshot:${params.deckSnapshotId}`,
      `primary_strategy:${params.state.primaryStrategy.strategyId}`,
      `phase:${params.state.phase}`,
      `transition:${params.state.transition.status}`,
      `decisions_committed:${params.state.commitment.decisionsCommitted}`,
    ],
  };
}

function nextTtl(
  state: StrategicIntentState,
  previous: StrategicIntentMemorySnapshot | undefined,
): number {
  if (state.transition.status === "abandoned") return 0;
  if (state.blockers.some((blocker) => blocker.severity === "hard")) return 1;
  if (state.transition.status === "continued") {
    return Math.min(4, (previous?.ttlDecisionsRemaining ?? 2) + 1);
  }
  if (state.transition.status === "paused") return 1;
  return 2;
}

function strategicIntentMemoryKey(
  input: AiDecisionInput,
  deckSnapshotId?: string,
): string {
  return [
    strategicIntentMemoryContextId(input),
    input.side,
    input.profileId,
    deckId(input, deckSnapshotId),
  ].join(":");
}

function strategicIntentMemoryContextId(input: AiDecisionInput): string {
  const [decisionScope] = input.decisionId.split(":");
  if (decisionScope && decisionScope.length > 0) return decisionScope;
  return input.seed;
}

function deckId(input: AiDecisionInput, deckSnapshotId?: string): string {
  if (deckSnapshotId) return deckSnapshotId;
  return (
    (input as StrategicIntentInputMetadata).ownDeckDoctrineV2Diagnostic
      ?.deckSnapshotId ?? "no_deck_snapshot"
  );
}
