import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { hashGameState } from "../packages/engine/src/index";
import {
  listMatchProgressionBenchmarkDeckSlots,
  simulateAiGame,
} from "../packages/ai/src/simulation";
import { resolveBenchmarkDeckSlot } from "../packages/ai/src/simulation/benchmark-deck-slot-resolver";
import { validateSimulationDeckSupport } from "../packages/ai/src/simulation/deck-support";
import type { AiSimulationDecisionCheckpointCapture } from "../packages/ai/src/simulation/ai-simulation-config";
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

const args = parseArgs(process.argv.slice(2));
const slot = listMatchProgressionBenchmarkDeckSlots().find(
  (candidate) => candidate.slotId === args.slotId,
);
if (!slot) throw new Error(`unknown_baseline_slot:${args.slotId}`);
if (slot.status !== "runnable") {
  throw new Error(`baseline_slot_not_runnable:${args.slotId}:${slot.status}`);
}
const resolved = resolveBenchmarkDeckSlot(slot);
if (!resolved.ok) {
  throw new Error(`baseline_slot_resolution_failed:${resolved.reason}`);
}
const supportErrors = validateSimulationDeckSupport(resolved.config);
if (supportErrors.length > 0) {
  throw new Error(`baseline_slot_support_failed:${supportErrors.join("|")}`);
}

let captured: AiSimulationDecisionCheckpointCapture | undefined;
let capturedRuntime: AiRuntimeCheckpointV1 | undefined;
let summary: ReturnType<typeof simulateAiGame> | undefined;
let simulationFailure: unknown;
try {
  summary = simulateAiGame({
    seed: args.seed,
    maxActions: args.actionIndex + 1,
    runnerControllerMode: "current_candidate",
    corpControllerMode: "current_candidate",
    ...resolved.config,
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
} catch (error) {
  simulationFailure = error;
}

if (!captured || !capturedRuntime) {
  if (simulationFailure) throw simulationFailure;
  throw new Error(
    `baseline_checkpoint_not_reached:${args.slotId}:${args.seed}:${args.actionIndex}:${summary?.actions ?? 0}:${summary?.errors.join("|") ?? "simulation_failed_before_capture"}`,
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
    slotId: args.slotId,
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

function parseArgs(values: string[]): {
  slotId: string;
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
    slotId: value("--slot-id"),
    seed: value("--seed"),
    actionIndex,
    checkpointId: value("--checkpoint-id"),
    findingId: value("--finding-id"),
    expectationBase64: value("--expectation-base64"),
    out: value("--out"),
  };
}
