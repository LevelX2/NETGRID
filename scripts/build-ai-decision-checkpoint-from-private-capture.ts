import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { hashGameState } from "../packages/engine/src/index";
import type { AiSimulationDecisionCheckpointCapture } from "../packages/ai/src/simulation/ai-simulation-config";
import {
  AI_DECISION_CHECKPOINT_SCHEMA_VERSION,
  type AiDecisionCheckpointExpectationV1,
  type AiDecisionCheckpointV1,
} from "../packages/ai/src/evaluation/decision-checkpoints/checkpoint-types";
import {
  AI_RUNTIME_CHECKPOINT_SCHEMA_VERSION,
  exportAiRuntimeCheckpoint,
} from "../packages/ai/src/evaluation/decision-checkpoints/runtime-checkpoint";

const args = parseArgs(process.argv.slice(2));
const captures = JSON.parse(
  readFileSync(resolve(args.captureJson), "utf8"),
) as AiSimulationDecisionCheckpointCapture[];
const capture = captures.find(
  (candidate) => candidate.actionIndex === args.actionIndex,
);
if (!capture) {
  throw new Error(`private_capture_not_found:${args.actionIndex}`);
}

const expectation = JSON.parse(
  Buffer.from(args.expectationBase64, "base64").toString("utf8"),
) as AiDecisionCheckpointExpectationV1;
const checkpoint = buildCheckpoint(capture, expectation);
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
  })}\n`,
);

function buildCheckpoint(
  capture: AiSimulationDecisionCheckpointCapture,
  expectation: AiDecisionCheckpointExpectationV1,
): AiDecisionCheckpointV1 {
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
      stateHash: hashGameState(capture.state),
      testOnlyGameState: capture.state,
      eventPrefix: capture.input.playerView.publicEvents.map((event) =>
        structuredClone(event),
      ),
    },
    runtime: exportAiRuntimeCheckpoint(
      capture.input,
      capture.deckSnapshot.deckSnapshotId,
    ),
    expectation,
  };
}

function parseArgs(values: string[]): {
  captureJson: string;
  actionIndex: number;
  checkpointId: string;
  findingId: string;
  capturedAt: string;
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
    captureJson: value("--capture-json"),
    actionIndex,
    checkpointId: value("--checkpoint-id"),
    findingId: value("--finding-id"),
    capturedAt: value("--captured-at"),
    expectationBase64: value("--expectation-base64"),
    out: value("--out"),
  };
}
