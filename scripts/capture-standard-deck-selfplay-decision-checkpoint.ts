import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { hashGameState } from "../packages/engine/src/index";
import type {
  AiDifficulty,
  DeckDefinition,
  DeckPublicMetadata,
  Side,
} from "../packages/shared/src/index";
import {
  AI_DECISION_CHECKPOINT_SCHEMA_VERSION,
  type AiDecisionCheckpointExpectationV1,
  type AiDecisionCheckpointV1,
} from "../packages/ai/src/evaluation/decision-checkpoints/checkpoint-types";
import {
  AI_RUNTIME_CHECKPOINT_SCHEMA_VERSION,
  exportAiRuntimeCheckpoint,
} from "../packages/ai/src/evaluation/decision-checkpoints/runtime-checkpoint";
import { simulateAiGame } from "../packages/ai/src/simulation";
import type { AiSimulationDecisionCheckpointCapture } from "../packages/ai/src/simulation/ai-simulation-config";

type StandardDeck = {
  standardDeckId: string;
  version: string;
  name: string;
  side: Side;
  identityCardId: string;
  cardPoolSnapshotId: string;
  cardPoolVersion: string;
  formatProfileId: string;
  formatProfileVersion: string;
  cards: Array<{ cardId: string; quantity: number }>;
};

type StandardDeckCatalog = {
  decks: StandardDeck[];
};

const args = parseArgs(process.argv.slice(2));
const catalog = JSON.parse(
  readFileSync(resolve(args.catalog), "utf8"),
) as StandardDeckCatalog;
const runner = findDeck(catalog, args.runnerDeckId, "runner");
const corp = findDeck(catalog, args.corpDeckId, "corp");
let captured:
  | {
      snapshot: AiSimulationDecisionCheckpointCapture;
      runtime: ReturnType<typeof exportAiRuntimeCheckpoint>;
    }
  | undefined;
let simulationFailure: unknown;

try {
  simulateAiGame({
    seed: args.seed,
    matchId: args.matchId ?? `selfplay:${args.seed}`,
    maxActions: args.actionIndex + 1,
    runnerDeck: deckDefinition(runner),
    corpDeck: deckDefinition(corp),
    runnerDeckMetadata: deckMetadata(runner, args.runnerDeckHash),
    corpDeckMetadata: deckMetadata(corp, args.corpDeckHash),
    runnerControllerMode: "current_candidate",
    corpControllerMode: "current_candidate",
    runnerDifficulty: args.runnerDifficulty,
    corpDifficulty: args.corpDifficulty,
    testOnlyDecisionCheckpointCapture: {
      actionIndices: [args.actionIndex],
      capture: (snapshot) => {
        const stableSnapshot = structuredClone(snapshot);
        captured = {
          snapshot: stableSnapshot,
          // The simulator callback runs immediately before the selected
          // decision. Capture resident memory here as well; exporting after
          // the simulation would bind the pre-decision state to the selected
          // action's post-decision commitment.
          runtime: exportAiRuntimeCheckpoint(
            stableSnapshot.input,
            stableSnapshot.deckSnapshot.deckSnapshotId,
          ),
        };
      },
    },
  });
} catch (error) {
  simulationFailure = error;
}

if (!captured) {
  if (simulationFailure) throw simulationFailure;
  throw new Error(
    `standard_selfplay_checkpoint_not_reached:${args.actionIndex}`,
  );
}

const expectation = JSON.parse(
  Buffer.from(args.expectationBase64, "base64").toString("utf8"),
) as AiDecisionCheckpointExpectationV1;
const checkpoint = buildCheckpoint(
  captured.snapshot,
  captured.runtime,
  expectation,
);
const outputPath = resolve(args.out);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(checkpoint, null, 2)}\n`, "utf8");
process.stdout.write(
  `${JSON.stringify({
    ok: true,
    checkpointId: checkpoint.checkpointId,
    actionIndex: args.actionIndex,
    stateVersion: checkpoint.engine.stateVersion,
    actor: checkpoint.actor,
    out: outputPath,
    simulationFailure:
      simulationFailure instanceof Error
        ? simulationFailure.message
        : undefined,
  })}\n`,
);

function buildCheckpoint(
  capture: AiSimulationDecisionCheckpointCapture,
  runtime: ReturnType<typeof exportAiRuntimeCheckpoint>,
  expectation: AiDecisionCheckpointExpectationV1,
): AiDecisionCheckpointV1 {
  // Persist the same JSON-safe state that the checkpoint runner will hash
  // after loading the fixture. Hashing the richer in-memory object first can
  // retain explicit undefined fields that JSON necessarily drops.
  const testOnlyGameState = JSON.parse(
    JSON.stringify(capture.state),
  ) as typeof capture.state;
  return {
    schemaVersion: AI_DECISION_CHECKPOINT_SCHEMA_VERSION,
    checkpointId: args.checkpointId,
    source: {
      kind: "captured_selfplay",
      findingId: args.findingId,
      capturedAt: args.capturedAt,
      matchId: capture.state.matchId,
      decisionScopeId: capture.input.decisionId.split(":")[0],
      decisionIndex: capture.actionIndex,
      stateVersion: capture.state.stateVersion,
    },
    compatibility: {
      engineSchemaVersion: capture.state.baseline.engineSchemaVersion,
      aiRuntimeCheckpointVersion: AI_RUNTIME_CHECKPOINT_SCHEMA_VERSION,
    },
    actor: capture.side,
    difficulty: capture.input.difficulty,
    profileId: capture.input.profileId,
    deckSnapshot: capture.deckSnapshot,
    engine: {
      stateVersion: capture.state.stateVersion,
      stateHash: hashGameState(testOnlyGameState),
      testOnlyGameState,
      eventPrefix: capture.input.playerView.publicEvents.map((event) =>
        structuredClone(event),
      ),
    },
    runtime,
    expectation,
  };
}

function findDeck(
  catalog: StandardDeckCatalog,
  deckId: string,
  side: Side,
): StandardDeck {
  const deck = catalog.decks.find(
    (candidate) =>
      candidate.standardDeckId === deckId && candidate.side === side,
  );
  if (!deck) throw new Error(`standard_deck_not_found:${side}:${deckId}`);
  return deck;
}

function deckDefinition(deck: StandardDeck): DeckDefinition {
  return {
    id: `${deck.standardDeckId}_${deck.version}`,
    name: deck.name,
    side: deck.side,
    identity: deck.identityCardId,
    cards: deck.cards.map((card) => ({
      id: card.cardId,
      quantity: card.quantity,
    })),
  };
}

function deckMetadata(
  deck: StandardDeck,
  deckHash: string,
): DeckPublicMetadata {
  return {
    side: deck.side,
    identityCardId: deck.identityCardId,
    deckName: deck.name,
    cardPoolSnapshotId: deck.cardPoolSnapshotId,
    cardPoolVersion: deck.cardPoolVersion,
    formatProfileId: deck.formatProfileId,
    formatProfileVersion: deck.formatProfileVersion,
    deckHash,
  };
}

function parseArgs(values: string[]): {
  catalog: string;
  runnerDeckId: string;
  corpDeckId: string;
  runnerDeckHash: string;
  corpDeckHash: string;
  seed: string;
  matchId?: string;
  actionIndex: number;
  checkpointId: string;
  findingId: string;
  capturedAt: string;
  expectationBase64: string;
  out: string;
  runnerDifficulty: AiDifficulty;
  corpDifficulty: AiDifficulty;
} {
  const value = (name: string): string => {
    const index = values.indexOf(name);
    const result = index >= 0 ? values[index + 1] : undefined;
    if (!result) throw new Error(`missing_argument:${name}`);
    return result;
  };
  const difficulty = (name: string): AiDifficulty => {
    const index = values.indexOf(name);
    const result = index >= 0 ? values[index + 1] : "hard";
    if (result !== "easy" && result !== "normal" && result !== "hard") {
      throw new Error(`invalid_argument:${name}`);
    }
    return result;
  };
  const actionIndex = Number(value("--action-index"));
  if (!Number.isInteger(actionIndex) || actionIndex < 0) {
    throw new Error("invalid_argument:--action-index");
  }
  return {
    catalog: value("--catalog"),
    runnerDeckId: value("--runner-deck-id"),
    corpDeckId: value("--corp-deck-id"),
    runnerDeckHash: value("--runner-deck-hash"),
    corpDeckHash: value("--corp-deck-hash"),
    seed: value("--seed"),
    ...(values.includes("--match-id") ? { matchId: value("--match-id") } : {}),
    actionIndex,
    checkpointId: value("--checkpoint-id"),
    findingId: value("--finding-id"),
    capturedAt: value("--captured-at"),
    expectationBase64: value("--expectation-base64"),
    out: value("--out"),
    runnerDifficulty: difficulty("--runner-difficulty"),
    corpDifficulty: difficulty("--corp-difficulty"),
  };
}
