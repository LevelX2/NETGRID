import { execFileSync, spawn } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { availableParallelism, tmpdir } from "node:os";
import { basename, dirname, join, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import {
  listMatchProgressionBenchmarkDeckSlots,
  type AiBenchmarkDeckSlotDefinition,
  type AiSelfplayTraceMiningResult,
} from "../packages/ai/src/simulation";
import {
  compareAiBehaviorBaselines,
  createAiBehaviorBaseline,
  formatAiBehaviorBaselineReport,
  type AiBehaviorBaselineResult,
  type AiBehaviorBaselineSlotDescriptor,
  type AiBehaviorBaselineSlotResult,
} from "../packages/ai/src/simulation/ai-behavior-baseline";
import { runAiBehaviorBaselineSlot } from "./ai-behavior-baseline-slot";
import { mapWithConcurrencyInOrder } from "./ordered-worker-pool";

const DEFAULT_SLOT_IDS = [
  "progression_tuning_origin_rig_vs_tax",
  "progression_tuning_origin_pressure_vs_tax",
  "snapshot_holdout_origin_pressure_vs_tag_ops",
  "strategy_panel_fast_advance_chrome_rush",
  "strategy_panel_net_damage_black_ice",
  "strategy_panel_hybrid_score_punish_cheap_bag",
] as const;
const DEFAULT_SEEDS = Array.from(
  { length: 10 },
  (_, index) => `ai-behavior-baseline-v1-${String(index + 1).padStart(2, "0")}`,
);
const DEFAULT_WORKERS = Math.max(1, Math.min(4, availableParallelism()));

const repoRoot = findRepoRoot(process.cwd());
const args = parseArgs(process.argv.slice(2));

if (args.listSlots) {
  console.log(
    JSON.stringify(
      listMatchProgressionBenchmarkDeckSlots().map((slot) => ({
        slotId: slot.slotId,
        label: slot.label,
        status: slot.status,
        runnerArchetype: slot.runnerArchetype,
        corpArchetype: slot.corpArchetype,
      })),
      null,
      2,
    ),
  );
  process.exit(0);
}

if (!args.outJson || !args.outMd || !args.rawOut) {
  throw new Error(
    "Missing --out-json, --out-md, or --raw-out. All three outputs are required.",
  );
}

const availableSlots = listMatchProgressionBenchmarkDeckSlots();
const requestedSlotIds = args.full
  ? availableSlots
      .filter((slot) => slot.status === "runnable")
      .map((slot) => slot.slotId)
  : (args.slotIds ?? [...DEFAULT_SLOT_IDS]);
const slots = requestedSlotIds.map((slotId) => {
  const slot = availableSlots.find((candidate) => candidate.slotId === slotId);
  if (!slot) throw new Error(`Unknown AI behavior baseline slot: ${slotId}`);
  if (slot.status !== "runnable")
    throw new Error(`AI behavior baseline slot ${slotId} is ${slot.status}.`);
  return slot;
});
const seeds = args.seeds ?? DEFAULT_SEEDS;
const workerDirectory = mkdtempSync(
  join(tmpdir(), "netgrid-ai-behavior-baseline-"),
);
try {
  const requestedWorkers =
    args.workersExplicit || slots.length >= 4 ? args.workers : 1;
  const effectiveWorkers = Math.min(requestedWorkers, slots.length);
  const workerSlots =
    effectiveWorkers === 1
      ? slots.map((slot, index) =>
          runSlotLocally({
            slot,
            seeds,
            maxActions: args.maxActions,
            maxFindings: args.maxFindings,
            workerDirectory,
            index,
          }),
        )
      : await mapWithConcurrencyInOrder({
          values: slots,
          concurrency: effectiveWorkers,
          run: (slot, index) =>
            runSlotWorker({
              slotId: slot.slotId,
              seeds,
              maxActions: args.maxActions,
              maxFindings: args.maxFindings,
              workerDirectory,
              index,
            }),
        });
  const resultSlots = workerSlots.map((worker) => worker.result);
  const result = createAiBehaviorBaseline({
    generatedAt: new Date().toISOString(),
    gitHead: git(["rev-parse", "--short", "HEAD"]),
    config: {
      seeds,
      maxActions: args.maxActions,
      runnerControllerMode: "current_candidate",
      corpControllerMode: "current_candidate",
      slotIds: slots.map((slot) => slot.slotId),
    },
    slots: resultSlots,
  });
  const baseline = args.baseline
    ? (JSON.parse(
        readFileSync(resolve(repoRoot, args.baseline), "utf8"),
      ) as AiBehaviorBaselineResult)
    : undefined;
  const comparison = baseline
    ? compareAiBehaviorBaselines(baseline, result)
    : undefined;
  const rawSlots = workerSlots.map(
    (worker) =>
      JSON.parse(readFileSync(worker.rawPath, "utf8")) as {
        descriptor: AiBehaviorBaselineSlotDescriptor;
        trace: AiSelfplayTraceMiningResult;
      },
  );

  writeJson(args.outJson, result);
  writeJson(args.rawOut, {
    schemaVersion: "ai-behavior-baseline-v1-raw",
    result,
    slots: rawSlots,
  });
  writeText(args.outMd, formatAiBehaviorBaselineReport(result, comparison));

  console.log(
    JSON.stringify(
      {
        outJson: resolve(repoRoot, args.outJson),
        outMd: resolve(repoRoot, args.outMd),
        rawOut: resolve(repoRoot, args.rawOut),
        workers: effectiveWorkers,
        games: result.aggregate.games,
        decisions: result.aggregate.decisions,
        accepted: result.gate.accepted,
        hardFailures: result.gate.hardFailures,
        ...(comparison ? { comparableToBaseline: comparison.comparable } : {}),
      },
      null,
      2,
    ),
  );
} finally {
  removeWorkerDirectory(workerDirectory);
}

function parseArgs(argv: string[]): {
  outJson?: string;
  outMd?: string;
  rawOut?: string;
  baseline?: string;
  slotIds?: string[];
  seeds?: string[];
  maxActions: number;
  maxFindings: number;
  workers: number;
  workersExplicit: boolean;
  full: boolean;
  listSlots: boolean;
} {
  let outJson: string | undefined;
  let outMd: string | undefined;
  let rawOut: string | undefined;
  let baseline: string | undefined;
  let slotIds: string[] | undefined;
  let seeds: string[] | undefined;
  let maxActions = 480;
  let maxFindings = 100;
  let workers = DEFAULT_WORKERS;
  let workersExplicit = false;
  let full = false;
  let listSlots = false;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--out-json" && next) {
      outJson = next;
      index += 1;
      continue;
    }
    if (arg === "--out-md" && next) {
      outMd = next;
      index += 1;
      continue;
    }
    if (arg === "--raw-out" && next) {
      rawOut = next;
      index += 1;
      continue;
    }
    if (arg === "--baseline" && next) {
      baseline = next;
      index += 1;
      continue;
    }
    if (arg === "--slot-ids" && next) {
      slotIds = splitValues(next);
      index += 1;
      continue;
    }
    if (arg === "--seeds" && next) {
      seeds = splitValues(next);
      index += 1;
      continue;
    }
    if (arg === "--max-actions" && next) {
      maxActions = Number.parseInt(next, 10);
      index += 1;
      continue;
    }
    if (arg === "--max-findings" && next) {
      maxFindings = Number.parseInt(next, 10);
      index += 1;
      continue;
    }
    if (arg === "--workers" && next) {
      workers = Number.parseInt(next, 10);
      workersExplicit = true;
      index += 1;
      continue;
    }
    if (arg === "--full") {
      full = true;
      continue;
    }
    if (arg === "--list-slots") {
      listSlots = true;
      continue;
    }
  }
  if (!Number.isInteger(maxActions) || maxActions <= 0)
    throw new Error("--max-actions must be a positive integer.");
  if (!Number.isInteger(maxFindings) || maxFindings <= 0)
    throw new Error("--max-findings must be a positive integer.");
  if (!Number.isInteger(workers) || workers < 1 || workers > 32)
    throw new Error("--workers must be an integer from 1 to 32.");
  if (full && slotIds)
    throw new Error("--full and --slot-ids cannot be combined.");
  return {
    ...(outJson ? { outJson } : {}),
    ...(outMd ? { outMd } : {}),
    ...(rawOut ? { rawOut } : {}),
    ...(baseline ? { baseline } : {}),
    ...(slotIds ? { slotIds } : {}),
    ...(seeds ? { seeds } : {}),
    maxActions,
    maxFindings,
    workers,
    workersExplicit,
    full,
    listSlots,
  };
}

type BaselineWorkerSlotResult = {
  rawPath: string;
  result: AiBehaviorBaselineSlotResult;
};

function runSlotLocally(params: {
  slot: AiBenchmarkDeckSlotDefinition;
  seeds: string[];
  maxActions: number;
  maxFindings: number;
  workerDirectory: string;
  index: number;
}): BaselineWorkerSlotResult {
  const run = runAiBehaviorBaselineSlot(params);
  const prefix = String(params.index).padStart(3, "0");
  const rawPath = join(params.workerDirectory, `${prefix}.raw.json`);
  writeFileSync(
    rawPath,
    `${JSON.stringify({ descriptor: run.descriptor, trace: run.trace })}\n`,
    "utf8",
  );
  return { rawPath, result: run.result };
}

function runSlotWorker(params: {
  slotId: string;
  seeds: string[];
  maxActions: number;
  maxFindings: number;
  workerDirectory: string;
  index: number;
}): Promise<BaselineWorkerSlotResult> {
  const prefix = String(params.index).padStart(3, "0");
  const rawPath = join(params.workerDirectory, `${prefix}.raw.json`);
  const resultPath = join(params.workerDirectory, `${prefix}.result.json`);
  const workerScript = resolve(
    repoRoot,
    "scripts/run-ai-behavior-baseline-worker.ts",
  );
  const tsxLoader = pathToFileURL(
    resolve(repoRoot, "apps/server/node_modules/tsx/dist/loader.mjs"),
  ).href;
  const child = spawn(
    process.execPath,
    [
      "--import",
      tsxLoader,
      workerScript,
      "--slot-id",
      params.slotId,
      "--seeds",
      params.seeds.join(","),
      "--max-actions",
      String(params.maxActions),
      "--max-findings",
      String(params.maxFindings),
      "--raw-out",
      rawPath,
      "--result-out",
      resultPath,
    ],
    {
      cwd: repoRoot,
      stdio: ["ignore", "ignore", "pipe"],
      windowsHide: true,
    },
  );
  child.stderr.setEncoding("utf8");
  let stderr = "";
  child.stderr.on("data", (chunk: string) => {
    stderr = `${stderr}${chunk}`.slice(-20_000);
  });
  return new Promise((resolveWorker, rejectWorker) => {
    let settled = false;
    child.once("error", (error) => {
      if (settled) return;
      settled = true;
      rejectWorker(error);
    });
    child.once("exit", (code, signal) => {
      if (settled) return;
      settled = true;
      if (code !== 0) {
        rejectWorker(
          new Error(
            `AI behavior baseline worker ${params.slotId} failed (${signal ?? `exit ${code ?? "unknown"}`}): ${stderr.trim() || "no stderr"}`,
          ),
        );
        return;
      }
      try {
        resolveWorker({
          rawPath,
          result: JSON.parse(
            readFileSync(resultPath, "utf8"),
          ) as AiBehaviorBaselineSlotResult,
        });
      } catch (error) {
        rejectWorker(
          new Error(
            `AI behavior baseline worker ${params.slotId} produced no valid result.`,
            { cause: error },
          ),
        );
      }
    });
  });
}

function removeWorkerDirectory(path: string): void {
  const resolvedPath = resolve(path);
  const resolvedTempRoot = resolve(tmpdir());
  if (
    !resolvedPath.startsWith(`${resolvedTempRoot}${sep}`) ||
    !basename(resolvedPath).startsWith("netgrid-ai-behavior-baseline-")
  ) {
    throw new Error(`Refusing to remove unexpected worker directory: ${path}`);
  }
  rmSync(resolvedPath, { recursive: true, force: true });
}

function splitValues(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function writeJson(path: string, value: unknown): void {
  const output = resolve(repoRoot, path);
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeText(path: string, value: string): void {
  const output = resolve(repoRoot, path);
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${value}\n`, "utf8");
}

function git(args: string[]): string {
  return execFileSync("git", args, { cwd: repoRoot, encoding: "utf8" }).trim();
}

function findRepoRoot(start: string): string {
  let current = resolve(start);
  for (;;) {
    try {
      const packageJson = JSON.parse(
        readFileSync(join(current, "package.json"), "utf8"),
      ) as { name?: string };
      if (packageJson.name === "netgrid-app") return current;
    } catch {
      // Keep walking to the workspace root.
    }
    const parent = dirname(current);
    if (parent === current)
      throw new Error(`Could not find NETGRID repo root from ${start}`);
    current = parent;
  }
}
