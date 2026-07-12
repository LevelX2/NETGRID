import { DatabaseSync } from "node:sqlite";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  hashGameState,
  redactPublicEventForSide,
} from "../packages/engine/src/index";
import type {
  AiDifficulty,
  GameState,
  PublicGameEvent,
  Side,
} from "../packages/shared/src/index";
import {
  buildAiDecisionInput,
  chooseAiAction,
  type AiDeckStrategyDeckSnapshot,
} from "../packages/ai/src/index";
import {
  AI_DECISION_CHECKPOINT_SCHEMA_VERSION,
  type AiDecisionCheckpointExpectationV1,
  type AiDecisionCheckpointV1,
} from "../packages/ai/src/evaluation/decision-checkpoints/checkpoint-types";
import {
  AI_RUNTIME_CHECKPOINT_SCHEMA_VERSION,
  exportAiRuntimeCheckpoint,
} from "../packages/ai/src/evaluation/decision-checkpoints/runtime-checkpoint";
import { resetTacticalPlanMemory } from "../packages/ai/src/plans/plan-memory";

type TraceRow = {
  state_version: number;
  decision_index: number;
  side: Side;
  selected_action_id: string;
  trace_json: string;
};

const args = parseArgs(process.argv.slice(2));
const db = new DatabaseSync(resolve(args.db), { readOnly: true });
const target = db
  .prepare(
    `select state_version, decision_index, side, selected_action_id, trace_json
     from ai_decision_traces where match_id = ? and decision_index = ?`,
  )
  .get(args.matchId, args.decisionIndex) as TraceRow | undefined;
if (!target) throw new Error("checkpoint_target_trace_not_found");
const targetTrace = JSON.parse(target.trace_json) as Record<string, unknown>;
const actor = target.side;
const targetState = stateAt(target.state_version);
const deckSnapshot = deckSnapshotFor(targetState, actor);
const profileId = String(targetTrace.profileId ?? `${actor}-ai-v0.9-hard`);
const difficulty = difficultyFor(targetTrace.aiLevel);
const allEvents = loadAllEvents();

resetTacticalPlanMemory();
const warmup = db
  .prepare(
    `select state_version, decision_index, side, selected_action_id, trace_json
     from ai_decision_traces
     where match_id = ? and side = ? and decision_index < ?
     order by decision_index`,
  )
  .all(args.matchId, actor, args.decisionIndex) as TraceRow[];
for (const row of warmup) {
  const state = stateAt(row.state_version);
  const input = inputFor(state, eventPrefixFor(row.state_version, actor));
  const decision = chooseAiAction(input);
  if (decision.actionId !== row.selected_action_id) {
    throw new Error(
      `warmup_behavior_drift:decision=${row.decision_index}:expected=${row.selected_action_id}:actual=${decision.actionId}`,
    );
  }
}

const targetInput = inputFor(
  targetState,
  eventPrefixFor(target.state_version, actor),
);
const runtime = exportAiRuntimeCheckpoint(
  targetInput,
  deckSnapshot.deckSnapshotId,
);
const expectation = JSON.parse(
  Buffer.from(args.expectationBase64, "base64").toString("utf8"),
) as AiDecisionCheckpointExpectationV1;
const fixture: AiDecisionCheckpointV1 = {
  schemaVersion: AI_DECISION_CHECKPOINT_SCHEMA_VERSION,
  checkpointId: args.checkpointId,
  source: {
    kind: "captured_match",
    findingId: args.findingId,
    capturedAt: new Date().toISOString(),
    matchId: args.matchId,
    decisionIndex: args.decisionIndex,
    stateVersion: target.state_version,
  },
  compatibility: {
    engineSchemaVersion: targetState.baseline.engineSchemaVersion,
    aiRuntimeCheckpointVersion: AI_RUNTIME_CHECKPOINT_SCHEMA_VERSION,
  },
  actor,
  difficulty,
  profileId,
  deckSnapshot,
  engine: {
    stateVersion: target.state_version,
    stateHash: hashGameState(targetState),
    testOnlyGameState: targetState,
    eventPrefix: eventPrefixFor(target.state_version, actor),
  },
  runtime,
  expectation,
};
mkdirSync(dirname(resolve(args.out)), { recursive: true });
writeFileSync(resolve(args.out), `${JSON.stringify(fixture, null, 2)}\n`, "utf8");
process.stdout.write(
  `${JSON.stringify({
    ok: true,
    out: resolve(args.out),
    checkpointId: fixture.checkpointId,
    warmupDecisions: warmup.length,
    eventPrefix: fixture.engine.eventPrefix.length,
    runtime: {
      tacticalPlan: Boolean(runtime.tacticalPlan),
      planPortfolio: Boolean(runtime.planPortfolio),
      strategicIntent: Boolean(runtime.strategicIntent),
      runnerRunPlan: Boolean(runtime.runnerRunPlan),
    },
  })}\n`,
);

function stateAt(stateVersion: number): GameState {
  const row = db
    .prepare(
      `select game_state_json from state_snapshots
       where match_id = ? and state_version = ?`,
    )
    .get(args.matchId, stateVersion) as { game_state_json: string } | undefined;
  if (!row) throw new Error(`checkpoint_state_not_found:${stateVersion}`);
  return JSON.parse(row.game_state_json) as GameState;
}

function eventPrefixFor(stateVersion: number, side: Side): PublicGameEvent[] {
  return allEvents
    .filter((event) => event.stateVersionAfter <= stateVersion)
    .map((event) => redactPublicEventForSide(event, side));
}

function inputFor(state: GameState, eventPrefix: PublicGameEvent[]) {
  return buildAiDecisionInput(state, actor, {
    difficulty,
    profileId,
    decisionId: `${args.matchId}:${state.stateVersion}:${actor}`,
    actionNumber: state.stateVersion,
    ownDeckSnapshot: deckSnapshot,
    eventTail: eventPrefix,
  });
}

function deckSnapshotFor(
  state: GameState,
  side: Side,
): AiDeckStrategyDeckSnapshot {
  const identityDefinitionId =
    state.cardInstances[side === "corp" ? state.corp.identity : state.runner.identity]
      ?.definitionId;
  const counts = new Map<string, number>();
  for (const card of Object.values(state.cardInstances)) {
    if (card.owner !== side || card.definitionId === identityDefinitionId) continue;
    counts.set(card.definitionId, (counts.get(card.definitionId) ?? 0) + 1);
  }
  const metadata = state.deckMetadata?.[side];
  return {
    deckSnapshotId: `${metadata?.deckHash ?? args.matchId}:${side}`,
    ...(metadata?.deckName ? { sourceDeckId: metadata.deckName } : {}),
    side,
    ...(metadata?.cardPoolSnapshotId
      ? { cardPoolSnapshotId: metadata.cardPoolSnapshotId }
      : {}),
    ...(metadata?.formatProfileId
      ? { formatProfileId: metadata.formatProfileId }
      : {}),
    ...(metadata?.deckHash ? { deckHash: metadata.deckHash } : {}),
    cards: [...counts.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([cardId, quantity]) => ({ cardId, quantity })),
  };
}

function loadAllEvents(): PublicGameEvent[] {
  const rows = db
    .prepare(
      `select public_payload_json from events
       where match_id = ? order by event_index`,
    )
    .all(args.matchId) as Array<{ public_payload_json: string }>;
  return rows.map((row) => {
    const event = JSON.parse(row.public_payload_json) as PublicGameEvent;
    const {
      aiDecisionDebug: _debug,
      aiExplanation: _explanation,
      aiReasonCode: _reason,
      aiConfidence: _confidence,
      ...publicPayload
    } = event.publicPayload;
    return { ...event, publicPayload };
  });
}

function difficultyFor(value: unknown): AiDifficulty {
  if (value === 2 || value === "hard") return "hard";
  if (value === 0 || value === "easy") return "easy";
  return "normal";
}

function parseArgs(values: string[]): {
  db: string;
  matchId: string;
  decisionIndex: number;
  checkpointId: string;
  findingId: string;
  expectationBase64: string;
  out: string;
} {
  const value = (name: string): string => {
    const index = values.indexOf(name);
    const result = index >= 0 ? values[index + 1] : undefined;
    if (!result) throw new Error(`missing_argument:${name}`);
    return result;
  };
  const decisionIndex = Number(value("--decision-index"));
  if (!Number.isInteger(decisionIndex) || decisionIndex <= 0) {
    throw new Error("invalid_argument:--decision-index");
  }
  return {
    db: value("--db"),
    matchId: value("--match-id"),
    decisionIndex,
    checkpointId: value("--checkpoint-id"),
    findingId: value("--finding-id"),
    expectationBase64: value("--expectation-base64"),
    out: value("--out"),
  };
}
