import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import {
  benchmarkDeckFromFrozenLocalSnapshot,
  runAiSelfplayTraceMining,
} from "../packages/ai/src/index";

type PairId = "a" | "b" | "c" | "d";

type TracePairFile = {
  pair: {
    id: string;
    label: string;
    runner: string;
    corp: string;
  };
};

const DEFAULT_SEEDS = [
  "ai-v143-tuning-001",
  "ai-v143-tuning-002",
  "ai-v143-tuning-003",
  "ai-v143-tuning-004",
  "ai-v143-tuning-005",
];

const DEFAULT_PAIR_IDS: PairId[] = ["a", "b", "c", "d"];

const repoRoot = findRepoRoot(process.cwd());
const args = parseArgs(process.argv.slice(2));
const outPath = resolve(repoRoot, args.out);
const pairIds = args.pairs ?? DEFAULT_PAIR_IDS;
const seeds = args.seeds ?? DEFAULT_SEEDS;
const maxActions = args.maxActions ?? 160;
const maxFindings = args.maxFindings ?? 50;

const pairs = pairIds.map((id) => readPair(id));
const matrix = pairs.map(({ pair }) => {
  const runner = benchmarkDeckFromFrozenLocalSnapshot(pair.runner);
  const corp = benchmarkDeckFromFrozenLocalSnapshot(pair.corp);
  const result = runAiSelfplayTraceMining({
    seeds,
    runnerDeck: runner.deck,
    corpDeck: corp.deck,
    runnerDeckMetadata: runner.metadata,
    corpDeckMetadata: corp.metadata,
    maxActions,
    maxFindings,
  });
  return {
    pair,
    runner: {
      snapshotId: runner.metadata.snapshotId,
      name: runner.metadata.name,
      deckHash: runner.metadata.deckHash,
    },
    corp: {
      snapshotId: corp.metadata.snapshotId,
      name: corp.metadata.name,
      deckHash: corp.metadata.deckHash,
    },
    aggregate: result.aggregate,
    summaries: result.summaries.map((summary) => ({
      seed: summary.seed,
      winner: summary.winner,
      actions: summary.actions,
      turns: summary.turns,
      finalAgendaPoints: summary.finalAgendaPoints,
      finalStateHash: summary.finalStateHash,
      replayOk: summary.replayOk,
      replayErrors: summary.replayErrors,
      redactionSafe: summary.redactionSafe,
      actionLimitReached: summary.actionLimitReached,
      lastActionTypes: summary.actionSequence
        .slice(-10)
        .map((entry) => entry.actionType),
    })),
    topFindings: result.topFindings.map((finding) => ({
      matchId: finding.matchId,
      seed: finding.seed,
      actionIndex: finding.actionIndex,
      side: finding.side,
      selectedActionType: finding.selectedActionType,
      planKind: finding.planKind,
      detectorIds: finding.detectorIds,
      severity: finding.severity,
      shortReason: finding.shortReason,
      relevantDebugFacts: finding.relevantDebugFacts.slice(0, 12),
      replaySafeReference: finding.replaySafeReference,
    })),
  };
});

const output = {
  schemaVersion: "ai-selfplay-trace-matrix-v1",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  config: {
    pairIds,
    seeds,
    maxActions,
    maxFindings,
  },
  aggregate: combineAggregates(matrix.map((entry) => entry.aggregate)),
  matrix,
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(JSON.stringify(output.aggregate, null, 2));

function parseArgs(argv: string[]): {
  out: string;
  pairs?: PairId[];
  seeds?: string[];
  maxActions?: number;
  maxFindings?: number;
} {
  let out: string | undefined;
  let pairs: PairId[] | undefined;
  let seeds: string[] | undefined;
  let maxActionsArg: number | undefined;
  let maxFindingsArg: number | undefined;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--out" && next) {
      out = next;
      index += 1;
      continue;
    }
    if (arg === "--pairs" && next) {
      pairs = next
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter((value): value is PairId =>
          ["a", "b", "c", "d"].includes(value),
        );
      index += 1;
      continue;
    }
    if (arg === "--seeds" && next) {
      seeds = next
        .split(",")
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
      index += 1;
      continue;
    }
    if (arg === "--max-actions" && next) {
      maxActionsArg = Number.parseInt(next, 10);
      index += 1;
      continue;
    }
    if (arg === "--max-findings" && next) {
      maxFindingsArg = Number.parseInt(next, 10);
      index += 1;
      continue;
    }
  }
  if (!out) {
    throw new Error("Missing required --out <path> argument.");
  }
  return {
    out,
    ...(pairs && pairs.length > 0 ? { pairs } : {}),
    ...(seeds && seeds.length > 0 ? { seeds } : {}),
    ...(Number.isFinite(maxActionsArg) ? { maxActions: maxActionsArg } : {}),
    ...(Number.isFinite(maxFindingsArg) ? { maxFindings: maxFindingsArg } : {}),
  };
}

function readPair(id: PairId): TracePairFile {
  const path = join(
    repoRoot,
    "docs",
    "reviews",
    "ai",
    `ai-selfplay-trace-mining-${id}.json`,
  );
  return JSON.parse(readFileSync(path, "utf8")) as TracePairFile;
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
      // Continue walking up.
    }
    const parent = dirname(current);
    if (parent === current) {
      throw new Error(`Could not find NETGRID repo root from ${start}`);
    }
    current = parent;
  }
}

function git(args: string[]): string {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

function combineAggregates(
  aggregates: Array<ReturnType<typeof runAiSelfplayTraceMining>["aggregate"]>,
) {
  const games = sum(aggregates, (entry) => entry.games);
  const decisions = sum(aggregates, (entry) => entry.decisions);
  const findings = sum(aggregates, (entry) => entry.findings);
  const averageGameLength =
    games > 0
      ? sum(aggregates, (entry) => entry.averageGameLength * entry.games) / games
      : 0;
  return {
    games,
    decisions,
    findings,
    findingsBySeverity: mergeCounts(
      aggregates.map((entry) => entry.findingsBySeverity),
    ),
    findingsByDetector: mergeCounts(
      aggregates.map((entry) => entry.findingsByDetector),
    ),
    illegalActions: sum(aggregates, (entry) => entry.illegalActions),
    replayFailures: sum(aggregates, (entry) => entry.replayFailures),
    actionLimitReached: sum(aggregates, (entry) => entry.actionLimitReached),
    allRedactionSafe: aggregates.every((entry) => entry.allRedactionSafe),
    redactionSafe: aggregates.every((entry) => entry.redactionSafe),
    averageGameLength,
    corpAgendaScores: sum(aggregates, (entry) => entry.corpAgendaScores),
    runnerAgendaSteals: sum(aggregates, (entry) => entry.runnerAgendaSteals),
    corpFlatlines: sum(aggregates, (entry) => entry.corpFlatlines),
    scoreWindowMissed: sum(aggregates, (entry) => entry.scoreWindowMissed),
    unsafeScoreChosen: sum(aggregates, (entry) => entry.unsafeScoreChosen),
    passiveActionWithScoreLineAvailable: sum(
      aggregates,
      (entry) => entry.passiveActionWithScoreLineAvailable,
    ),
  };
}

function sum<T>(entries: readonly T[], value: (entry: T) => number): number {
  return entries.reduce((total, entry) => total + value(entry), 0);
}

function mergeCounts<T extends string>(
  entries: Array<Record<T, number>>,
): Record<T, number> {
  const merged = {} as Record<T, number>;
  for (const entry of entries) {
    for (const [key, value] of Object.entries(entry) as Array<[T, number]>) {
      merged[key] = (merged[key] ?? 0) + value;
    }
  }
  return merged;
}
