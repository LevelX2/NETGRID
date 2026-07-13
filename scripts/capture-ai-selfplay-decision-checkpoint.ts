import { DatabaseSync } from "node:sqlite";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { hashGameState } from "../packages/engine/src/index";
import type {
  DeckDefinition,
  DeckPublicMetadata,
  Side,
} from "../packages/shared/src/index";
import { simulateAiGame } from "../packages/ai/src/simulation";
import {
  AI_DECISION_CHECKPOINT_SCHEMA_VERSION,
  type AiDecisionCheckpointExpectationV1,
  type AiDecisionCheckpointV1,
} from "../packages/ai/src/evaluation/decision-checkpoints/checkpoint-types";
import {
  AI_RUNTIME_CHECKPOINT_SCHEMA_VERSION,
  exportAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "../packages/ai/src/evaluation/decision-checkpoints/runtime-checkpoint";
import type { AiSimulationDecisionCheckpointCapture } from "../packages/ai/src/simulation/ai-simulation-config";

type StoredDeckSnapshot = {
  deckSnapshotId: string;
  sourceDeckId?: string;
  name: string;
  side: Side;
  identityCardId: string;
  cards: Array<{ cardId: string; quantity: number }>;
  publicMetadata?: DeckPublicMetadata;
};

type PrivateDeckSnapshots = {
  runner: StoredDeckSnapshot;
  corp: StoredDeckSnapshot;
};

const args = parseArgs(process.argv.slice(2));
const snapshots = readDeckSnapshots(args.sqlite, args.sourceMatchId);
let captured: AiSimulationDecisionCheckpointCapture | undefined;
let capturedRuntime: AiRuntimeCheckpointV1 | undefined;
const summary = simulateAiGame({
  seed: args.seed,
  maxActions: args.actionIndex + 1,
  runnerDeck: deckDefinition(snapshots.runner),
  corpDeck: deckDefinition(snapshots.corp),
  ...(snapshots.runner.publicMetadata
    ? { runnerDeckMetadata: snapshots.runner.publicMetadata }
    : {}),
  ...(snapshots.corp.publicMetadata
    ? { corpDeckMetadata: snapshots.corp.publicMetadata }
    : {}),
  runnerControllerMode: "current_candidate",
  corpControllerMode: "current_candidate",
  testOnlyDecisionCheckpointCapture: {
    actionIndices: [args.actionIndex],
    capture: (snapshot) => {
      captured = snapshot;
      capturedRuntime = exportAiRuntimeCheckpoint(
        snapshot.input,
        snapshot.deckSnapshot.deckSnapshotId,
      );
    },
  },
});

if (!captured || !capturedRuntime) {
  throw new Error(
    `selfplay_checkpoint_not_reached:${args.seed}:${args.actionIndex}:${summary.actions}:${summary.errors.join("|")}`,
  );
}

const checkpoint = buildCheckpoint(captured, capturedRuntime);
const outputPath = resolve(args.out);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(checkpoint, null, 2)}\n`, "utf8");
process.stdout.write(
  `${JSON.stringify({
    ok: true,
    out: outputPath,
    checkpointId: checkpoint.checkpointId,
    sourceMatchId: args.sourceMatchId,
    simulationMatchId: checkpoint.source.matchId,
    seed: args.seed,
    actionIndex: args.actionIndex,
    stateVersion: checkpoint.engine.stateVersion,
    actor: checkpoint.actor,
    legalActions: captured.input.legalActions.map((action) => ({
      actionId: action.actionId,
      type: action.type,
      source: action.source,
      payload: action.payload,
    })),
    runtime: {
      tacticalPlan: Boolean(checkpoint.runtime.tacticalPlan),
      planPortfolio: Boolean(checkpoint.runtime.planPortfolio),
      strategicIntent: Boolean(checkpoint.runtime.strategicIntent),
      runnerRunPlan: Boolean(checkpoint.runtime.runnerRunPlan),
    },
  })}\n`,
);

function buildCheckpoint(
  snapshot: AiSimulationDecisionCheckpointCapture,
  runtime: AiRuntimeCheckpointV1,
): AiDecisionCheckpointV1 {
  const expectation = JSON.parse(
    Buffer.from(args.expectationBase64, "base64").toString("utf8"),
  ) as AiDecisionCheckpointExpectationV1;
  const eventPrefix = snapshot.input.playerView.publicEvents.map((event) =>
    structuredClone(event),
  );
  return {
    schemaVersion: AI_DECISION_CHECKPOINT_SCHEMA_VERSION,
    checkpointId: args.checkpointId,
    source: {
      kind: "captured_selfplay",
      findingId: args.findingId,
      capturedAt: new Date().toISOString(),
      matchId: snapshot.state.matchId,
      decisionIndex: snapshot.actionIndex,
      stateVersion: snapshot.state.stateVersion,
    },
    compatibility: {
      engineSchemaVersion: snapshot.state.baseline.engineSchemaVersion,
      aiRuntimeCheckpointVersion: AI_RUNTIME_CHECKPOINT_SCHEMA_VERSION,
    },
    actor: snapshot.side,
    difficulty: snapshot.input.difficulty,
    profileId: snapshot.input.profileId,
    deckSnapshot: snapshot.deckSnapshot,
    engine: {
      stateVersion: snapshot.state.stateVersion,
      stateHash: hashGameState(snapshot.state),
      testOnlyGameState: snapshot.state,
      eventPrefix,
    },
    runtime,
    expectation,
  };
}

function readDeckSnapshots(
  sqlite: string,
  matchId: string,
): PrivateDeckSnapshots {
  const db = new DatabaseSync(resolve(sqlite), { readOnly: true });
  try {
    const row = db
      .prepare(
        "select private_deck_snapshots_json as snapshots from private_deck_snapshots where match_id = ?",
      )
      .get(matchId) as { snapshots?: string } | undefined;
    if (!row?.snapshots) {
      throw new Error(`selfplay_checkpoint_decks_not_found:${matchId}`);
    }
    return JSON.parse(row.snapshots) as PrivateDeckSnapshots;
  } finally {
    db.close();
  }
}

function deckDefinition(snapshot: StoredDeckSnapshot): DeckDefinition {
  return {
    id: snapshot.sourceDeckId ?? snapshot.deckSnapshotId,
    name: snapshot.name,
    side: snapshot.side,
    identity: snapshot.identityCardId,
    cards: snapshot.cards.map((card) => ({
      id: card.cardId,
      quantity: card.quantity,
    })),
  };
}

function parseArgs(values: string[]): {
  sqlite: string;
  sourceMatchId: string;
  seed: string;
  actionIndex: number;
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
  const actionIndex = Number(value("--action-index"));
  if (!Number.isInteger(actionIndex) || actionIndex < 0) {
    throw new Error("invalid_argument:--action-index");
  }
  return {
    sqlite: value("--sqlite"),
    sourceMatchId: value("--source-match-id"),
    seed: value("--seed"),
    actionIndex,
    checkpointId: value("--checkpoint-id"),
    findingId: value("--finding-id"),
    expectationBase64: value("--expectation-base64"),
    out: value("--out"),
  };
}
