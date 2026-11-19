import type {
  AiDecisionInputWithDeckCapabilities,
  AiRuntimeCheckpointV1,
} from "@netgrid/ai";
import { MessageChannel, Worker } from "node:worker_threads";
import {
  AI_DECISION_WORKER_ROLE,
  transferableAiDecisionError,
  type AiDecisionWorkerJob,
  type AiDecisionWorkerMessage,
  type AiDecisionWorkerResult,
  type LiveAiQuoteRequest,
  type LiveAiQuotes,
} from "./ai-decision-worker";

type QueuedDecision = {
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
  quotes: LiveAiQuotes;
  persistTacticalPlanMemory: boolean;
  resolve: (result: AiDecisionWorkerResult) => void;
  reject: (error: unknown) => void;
};

type Slot = {
  worker: Worker;
  fail?: (error: unknown) => void;
};

/** Workers get side-filtered input and live memory. Only the main process
 * holds the authoritative state, produces rule quotes, and commits moves. */
export class AiDecisionWorkerPool {
  readonly #slots = new Set<Slot>();
  readonly #pending: QueuedDecision[] = [];
  #closed = false;

  constructor(private readonly size: number) {
    if (!Number.isSafeInteger(size) || size < 1)
      throw new Error("invalid_ai_decision_worker_count");
  }

  choose(
    input: AiDecisionInputWithDeckCapabilities,
    runtime: AiRuntimeCheckpointV1,
    quotes: LiveAiQuotes,
    persistTacticalPlanMemory = true,
  ): Promise<AiDecisionWorkerResult> {
    return new Promise((resolve, reject) => {
      if (this.#closed)
        return reject(new Error("ai_decision_worker_pool_closed"));
      this.#pending.push({
        input,
        runtime,
        quotes,
        persistTacticalPlanMemory,
        resolve,
        reject,
      });
      this.dispatch();
    });
  }

  close(): void {
    this.#closed = true;
    const error = new Error("ai_decision_worker_pool_closed");
    for (const job of this.#pending.splice(0)) job.reject(error);
    for (const slot of this.#slots) {
      slot.fail?.(error);
      void slot.worker.terminate();
    }
    this.#slots.clear();
  }

  private dispatch(): void {
    while (!this.#closed && this.#pending.length > 0) {
      let slot = Array.from(this.#slots).find((candidate) => !candidate.fail);
      if (!slot) {
        if (this.#slots.size === this.size) return;
        try {
          slot = this.startWorker();
        } catch (error) {
          this.#pending.shift()!.reject(error);
          continue;
        }
      }
      this.run(slot, this.#pending.shift()!);
    }
  }

  private startWorker(): Slot {
    let entry = new URL(import.meta.url);
    // Source workers load the full TypeScript graph through the workspace
    // loader. The Windows bundle itself serves as its worker entrypoint.
    if (entry.pathname.endsWith(".ts")) {
      const loader = import.meta.resolve("tsx/esm/api");
      const source = new URL("./index.ts", entry).href;
      const bootstrap = `import { tsImport } from ${JSON.stringify(loader)};
await tsImport(${JSON.stringify(source)}, ${JSON.stringify(source)});`;
      entry = new URL(`data:text/javascript,${encodeURIComponent(bootstrap)}`);
    }
    const worker = new Worker(entry, {
      execArgv: [],
      workerData: AI_DECISION_WORKER_ROLE,
    });
    const slot: Slot = { worker };
    const remove = (error: unknown) => {
      if (!this.#slots.delete(slot)) return;
      slot.fail?.(error);
      this.dispatch();
    };
    worker.on("error", remove);
    worker.once("exit", (code) =>
      remove(new Error(`ai_decision_worker_exit:${code}`)),
    );
    this.#slots.add(slot);
    return slot;
  }

  private run(slot: Slot, job: QueuedDecision): void {
    const { port1, port2 } = new MessageChannel();
    const signal = new Int32Array(
      new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT),
    );
    const finish = (
      message: Extract<AiDecisionWorkerMessage, { kind: "result" | "error" }>,
    ) => {
      if (!slot.fail) return;
      delete slot.fail;
      port1.close();
      slot.worker.unref();
      if (message.kind === "result") job.resolve(message.value);
      else job.reject(message.error);
      this.dispatch();
    };
    slot.fail = (error) => finish({ kind: "error", error });
    // Ignore events from a finished job if this slot has already been reused.
    const fail = slot.fail;
    port1.once("close", () => {
      if (slot.fail === fail)
        fail(new Error("ai_decision_worker_channel_closed"));
    });
    port1.on("message", (message: AiDecisionWorkerMessage) => {
      if (slot.fail !== fail) return;
      if (message.kind !== "quote") return finish(message);
      try {
        port1.postMessage({
          kind: "quote-result",
          value: getQuote(job.quotes, message),
        });
      } catch (error) {
        port1.postMessage({
          kind: "quote-error",
          error: transferableAiDecisionError(error),
        });
      } finally {
        Atomics.store(signal, 0, 1);
        Atomics.notify(signal, 0);
      }
    });
    slot.worker.ref();
    try {
      slot.worker.postMessage(
        {
          input: job.input,
          runtime: job.runtime,
          port: port2,
          signal: signal.buffer,
          persistTacticalPlanMemory: job.persistTacticalPlanMemory,
        } satisfies AiDecisionWorkerJob,
        [port2],
      );
    } catch (error) {
      port2.close();
      fail(error);
    }
  }
}

function getQuote(quotes: LiveAiQuotes, request: LiveAiQuoteRequest) {
  switch (request.name) {
    case "quoteCorpPunishRoute":
      return quotes.quoteCorpPunishRoute(request.input);
    case "quoteRandomizedIceInstallSelection":
      return quotes.quoteRandomizedIceInstallSelection(request.input);
    case "quoteRandomizedTurnPlanSelection":
      return quotes.quoteRandomizedTurnPlanSelection(request.input);
    case "quoteRandomizedTraceBidSelection":
      return quotes.quoteRandomizedTraceBidSelection(request.input);
  }
}
