import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import {
  listMatchProgressionBenchmarkDeckSlots,
  runAiSelfplayTraceMining,
  summarizeMatchProgressionMetrics,
  type AiBenchmarkDeckSlotDefinition,
  type AiSelfplayTraceMiningResult,
} from "../packages/ai/src/simulation";
import {
  compareAiBehaviorBaselines,
  createAiBehaviorBaseline,
  createAiBehaviorBaselineSlotResult,
  formatAiBehaviorBaselineReport,
  type AiBehaviorBaselineResult,
  type AiBehaviorBaselineSlotDescriptor,
} from "../packages/ai/src/simulation/ai-behavior-baseline";
import { resolveBenchmarkDeckSlot } from "../packages/ai/src/simulation/benchmark-deck-slot-resolver";
import { validateSimulationDeckSupport } from "../packages/ai/src/simulation/deck-support";

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
const rawSlots: Array<{
  descriptor: AiBehaviorBaselineSlotDescriptor;
  trace: AiSelfplayTraceMiningResult;
}> = [];
const resultSlots = slots.map((slot) => {
  const resolved = resolveBenchmarkDeckSlot(slot);
  if (!resolved.ok) {
    throw new Error(`Cannot resolve ${slot.slotId}: ${resolved.reason}`);
  }
  const supportErrors = validateSimulationDeckSupport(resolved.config);
  if (supportErrors.length > 0) {
    throw new Error(`${slot.slotId}: ${supportErrors.join(" | ")}`);
  }
  const descriptor = createDescriptor(slot, resolved.config);
  const trace = runAiSelfplayTraceMining({
    seeds,
    maxActions: args.maxActions,
    runnerControllerMode: "current_candidate",
    corpControllerMode: "current_candidate",
    ...resolved.config,
    maxFindings: args.maxFindings,
  });
  rawSlots.push({ descriptor, trace });
  const progression = summarizeMatchProgressionMetrics(trace.summaries);
  return createAiBehaviorBaselineSlotResult({
    descriptor,
    progression,
    decisions: trace.aggregate.decisions,
    findings: trace.aggregate.findings,
    findingsByDetector: trace.aggregate.findingsByDetector,
    illegalActions: trace.aggregate.illegalActions,
    replayFailures: trace.aggregate.replayFailures,
    actionLimitGames: trace.aggregate.actionLimitReached,
    fallbackActions: trace.summaries.reduce(
      (count, summary) =>
        count +
        summary.actionSequence.filter((entry) => entry.fallbackUsed === true)
          .length,
      0,
    ),
    timeoutActions: trace.summaries.reduce(
      (count, summary) =>
        count +
        summary.actionSequence.filter((entry) => entry.timeoutUsed === true)
          .length,
      0,
    ),
    runtimeErrors: trace.summaries.reduce(
      (count, summary) => count + summary.errors.length,
      0,
    ),
    redactionSafe: trace.aggregate.redactionSafe,
    games: trace.summaries.map((summary) => ({
      seed: summary.seed,
      winner: summary.winner,
      ...(summary.gameEndReason
        ? { gameEndReason: summary.gameEndReason }
        : {}),
      actions: summary.actions,
      turns: summary.turns,
      runnerAgendaPoints: summary.finalAgendaPoints.runner,
      corpAgendaPoints: summary.finalAgendaPoints.corp,
      finalStateHash: summary.finalStateHash,
      replayOk: summary.replayOk,
      errorCount: summary.errors.length,
    })),
  });
});

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

function createDescriptor(
  slot: AiBenchmarkDeckSlotDefinition,
  config: {
    runnerDeckId?: string;
    corpDeckId?: string;
    runnerDeck?: { id: string };
    corpDeck?: { id: string };
    runnerDeckMetadata?: { deckHash?: string; name?: string };
    corpDeckMetadata?: { deckHash?: string; name?: string };
  },
): AiBehaviorBaselineSlotDescriptor {
  return {
    slotId: slot.slotId,
    label: slot.label,
    slotType: slot.slotType,
    runnerArchetype: slot.runnerArchetype,
    corpArchetype: slot.corpArchetype,
    runnerDeckFingerprint:
      config.runnerDeckMetadata?.deckHash ??
      config.runnerDeck?.id ??
      config.runnerDeckId ??
      "unknown-runner-deck",
    corpDeckFingerprint:
      config.corpDeckMetadata?.deckHash ??
      config.corpDeck?.id ??
      config.corpDeckId ??
      "unknown-corp-deck",
  };
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
    full,
    listSlots,
  };
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
