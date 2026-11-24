import {
  chooseAiAction,
  exportAiRuntimeCheckpoint,
  releaseAiMatchRuntime,
  restoreAiRuntimeCheckpoint,
  type AiDecisionInputWithDeckCapabilities,
  type AiRuntimeCheckpointV1,
} from "@netgrid/ai";
import type { AiDecision } from "@netgrid/shared";
import {
  parentPort,
  receiveMessageOnPort,
  type MessagePort,
} from "node:worker_threads";

export const AI_DECISION_WORKER_ROLE = "netgrid-ai-decision";
export const AI_DECISION_WORKER_READY = "netgrid-ai-decision-ready";

type RuntimeOptions = NonNullable<Parameters<typeof chooseAiAction>[1]>;
export type LiveAiQuotes = Required<
  Pick<
    RuntimeOptions,
    | "quoteCorpPunishRoute"
    | "quoteRandomizedIceInstallSelection"
    | "quoteRandomizedTurnPlanSelection"
    | "quoteRandomizedTraceBidSelection"
  >
>;

export type LiveAiQuoteRequest = {
  [Name in keyof LiveAiQuotes]: {
    kind: "quote";
    name: Name;
    input: Parameters<LiveAiQuotes[Name]>[0];
  };
}[keyof LiveAiQuotes];

export type AiDecisionWorkerJob = {
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
  port: MessagePort;
  signal: SharedArrayBuffer;
  persistTacticalPlanMemory: boolean;
};

export type AiDecisionWorkerResult = {
  decision: AiDecision;
  runtime: AiRuntimeCheckpointV1;
};

export type AiDecisionWorkerMessage =
  | LiveAiQuoteRequest
  | { kind: "result"; value: AiDecisionWorkerResult }
  | { kind: "error"; error: unknown };

export function runAiDecisionWorker(): void {
  if (!parentPort) throw new Error("ai_decision_worker_parent_missing");
  parentPort.on("message", (job: AiDecisionWorkerJob) => runJob(job));
  parentPort.postMessage(AI_DECISION_WORKER_READY);
}

export function transferableAiDecisionError(error: unknown): unknown {
  // Structured cloning of Error retains its message but drops the fields
  // used by the private plan-resolution diagnostic.
  const details =
    error instanceof Error
      ? { ...error, name: error.name, message: error.message }
      : error;
  try {
    return structuredClone(details);
  } catch {
    return {
      name: "AiDecisionWorkerProtocolError",
      message: "ai_decision_error_not_serializable",
    };
  }
}

function runJob(job: AiDecisionWorkerJob): void {
  const { input, runtime, port } = job;
  const signal = new Int32Array(job.signal);
  const request = <Name extends keyof LiveAiQuotes>(
    name: Name,
    input: Parameters<LiveAiQuotes[Name]>[0],
  ): ReturnType<LiveAiQuotes[Name]> => {
    // Quotes run against the admitted state held by the server. The live
    // planner uses synchronous quotes, so only this worker waits here.
    Atomics.store(signal, 0, 0);
    port.postMessage({ kind: "quote", name, input });
    Atomics.wait(signal, 0, 0);
    const reply = receiveMessageOnPort(port)?.message as
      | { kind: "quote-result"; value: ReturnType<LiveAiQuotes[Name]> }
      | { kind: "quote-error"; error: unknown }
      | undefined;
    if (!reply) throw new Error("ai_decision_worker_quote_missing");
    if (reply.kind === "quote-error") throw reply.error;
    return reply.value;
  };
  try {
    const deckSnapshotId = input.ownDeckSnapshot?.deckSnapshotId;
    if (!deckSnapshotId)
      throw new Error("ai_decision_worker_deck_snapshot_missing");
    restoreAiRuntimeCheckpoint(input, deckSnapshotId, runtime, {
      preserveLiveCommitment: true,
    });
    const decision = chooseAiAction(input, {
      persistTacticalPlanMemory: job.persistTacticalPlanMemory,
      quoteCorpPunishRoute: (input) => request("quoteCorpPunishRoute", input),
      quoteRandomizedIceInstallSelection: (input) =>
        request("quoteRandomizedIceInstallSelection", input),
      quoteRandomizedTurnPlanSelection: (input) =>
        request("quoteRandomizedTurnPlanSelection", input),
      quoteRandomizedTraceBidSelection: (input) =>
        request("quoteRandomizedTraceBidSelection", input),
    });
    const value: AiDecisionWorkerResult = {
      decision,
      runtime: exportAiRuntimeCheckpoint(input, deckSnapshotId),
    };
    port.postMessage({
      kind: "result",
      value,
    } satisfies AiDecisionWorkerMessage);
  } catch (error) {
    port.postMessage({
      kind: "error",
      error: transferableAiDecisionError(error),
    } satisfies AiDecisionWorkerMessage);
  } finally {
    if (input.matchId) releaseAiMatchRuntime(input.matchId);
    port.close();
  }
}
