import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import {
  benchmarkDeckFromSnapshot,
  benchmarkDeckFromFrozenLocalSnapshot,
  runAiSelfplayTraceMining,
  type PracticalMicroRuntimeMode,
  type PracticalMicroRuntimeRuleId,
} from "../packages/ai/src/index";
import { progressAwareAlternativeSnapshot } from "../packages/ai/src/simulation/progress-aware-alternative-snapshot";

type PairId = "a" | "b" | "c" | "d";
type TraceMiningResult = ReturnType<typeof runAiSelfplayTraceMining>;
type TraceMiningSummary = TraceMiningResult["summaries"][number];
type TraceMiningActionEntry = TraceMiningSummary["actionSequence"][number];

type TracePairFile = {
  pair: {
    id: string;
    label: string;
    runner: string;
    corp: string;
  };
};
type TracePairSetFile = {
  pairs: TracePairFile[];
};

const DEFAULT_SEEDS = [
  "ai-v143-tuning-001",
  "ai-v143-tuning-002",
  "ai-v143-tuning-003",
  "ai-v143-tuning-004",
  "ai-v143-tuning-005",
];

const DEFAULT_PAIR_IDS: PairId[] = ["a", "b", "c", "d"];
const DEFAULT_PRACTICAL_MICRO_RUNTIME_RULES: PracticalMicroRuntimeRuleId[] = [
  "runner_visible_coverage_install",
  "corp_stale_punish_deactivation",
  "corp_safe_scoreline",
  "runner_run_payoff_completion",
];

const repoRoot = findRepoRoot(process.cwd());
const args = parseArgs(process.argv.slice(2));
const outPath = resolve(repoRoot, args.out);
const pairIds = args.noDefaultPairs ? [] : (args.pairs ?? DEFAULT_PAIR_IDS);
const pairFiles = args.pairFiles ?? [];
const seeds = args.seeds ?? DEFAULT_SEEDS;
const maxActions = args.maxActions ?? 160;
const maxFindings = args.maxFindings ?? 50;
const includeActionAlternatives = args.includeActionAlternatives ?? false;
const maxAlternativesPerFinding = args.maxAlternativesPerFinding ?? 5;
const practicalMicroRuntimeMode = args.practicalMicroRuntimeMode;
const practicalMicroRuntimeRules =
  args.practicalMicroRuntimeRules ?? DEFAULT_PRACTICAL_MICRO_RUNTIME_RULES;
const opportunitySnapshotSource = args.opportunitySnapshotSource;
const opportunitySnapshotRequestsByPair = opportunitySnapshotSource
  ? readOpportunitySnapshotRequests(opportunitySnapshotSource)
  : new Map<string, Array<{ seed: string; actionIndices: number[] }>>();

const pairs = [
  ...pairIds.map((id) => readPair(id)),
  ...pairFiles.flatMap((path) => readPairFile(path)),
];
const matrix = pairs.map(({ pair }) => {
  const runner = benchmarkDeckFromAnySnapshot(pair.runner);
  const corp = benchmarkDeckFromAnySnapshot(pair.corp);
  const result = runAiSelfplayTraceMining({
    seeds,
    runnerDeck: runner.deck,
    corpDeck: corp.deck,
    runnerDeckMetadata: runner.metadata,
    corpDeckMetadata: corp.metadata,
    maxActions,
    maxFindings,
    includeActionAlternativesForFindings: includeActionAlternatives,
    maxAlternativesPerFinding,
    ...(practicalMicroRuntimeMode
      ? {
          aiDecisionRuntimeOptions: {
            practicalMicroRuntime: {
              mode: practicalMicroRuntimeMode,
              enabledRules: practicalMicroRuntimeRules,
            },
          },
        }
      : {}),
    opportunitySnapshotRequests:
      opportunitySnapshotRequestsByPair.get(pair.id.toUpperCase()) ?? [],
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
    diagnostics: {
      unsafeScoreChosenByReason: unsafeScoreChosenReasonsForSummaries(
        result.summaries,
      ),
      actionLimitClusters: result.aggregate.actionLimitClusters,
      actionLimitSubclusters: result.aggregate.actionLimitSubclusters,
    },
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
      last40ActionTypes: summary.actionSequence
        .slice(-40)
        .map((entry) => entry.actionType),
      ...(includeActionAlternatives
        ? {
            actionAlternativeSnapshots:
              actionAlternativeSnapshotsForSummary(summary),
          }
        : {}),
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
    pairFiles,
    seeds,
    maxActions,
    maxFindings,
    includeActionAlternatives,
    maxAlternativesPerFinding,
    ...(practicalMicroRuntimeMode
      ? {
          practicalMicroRuntimeMode,
          practicalMicroRuntimeRules,
        }
      : {}),
    ...(opportunitySnapshotSource ? { opportunitySnapshotSource } : {}),
  },
  aggregate: combineAggregates(matrix.map((entry) => entry.aggregate)),
  diagnostics: {
    unsafeScoreChosenByReason: mergeCounts(
      matrix.map((entry) => entry.diagnostics.unsafeScoreChosenByReason),
    ),
    actionLimitClusters: mergeCounts(
      matrix.map((entry) => entry.diagnostics.actionLimitClusters),
    ),
  },
  matrix,
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(JSON.stringify(output.aggregate, null, 2));

function parseArgs(argv: string[]): {
  out: string;
  pairs?: PairId[];
  noDefaultPairs?: boolean;
  pairFiles?: string[];
  seeds?: string[];
  maxActions?: number;
  maxFindings?: number;
  includeActionAlternatives?: boolean;
  maxAlternativesPerFinding?: number;
  practicalMicroRuntimeMode?: PracticalMicroRuntimeMode;
  practicalMicroRuntimeRules?: PracticalMicroRuntimeRuleId[];
  opportunitySnapshotSource?: string;
} {
  let out: string | undefined;
  let pairs: PairId[] | undefined;
  let noDefaultPairs = false;
  const pairFiles: string[] = [];
  let seeds: string[] | undefined;
  let maxActionsArg: number | undefined;
  let maxFindingsArg: number | undefined;
  let includeActionAlternatives = false;
  let maxAlternativesPerFinding: number | undefined;
  let practicalMicroRuntimeMode: PracticalMicroRuntimeMode | undefined;
  let practicalMicroRuntimeRules: PracticalMicroRuntimeRuleId[] | undefined;
  let opportunitySnapshotSource: string | undefined;
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
    if (arg === "--no-default-pairs") {
      noDefaultPairs = true;
      continue;
    }
    if (arg === "--pair-file" && next) {
      pairFiles.push(next);
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
    if (arg === "--include-action-alternatives") {
      includeActionAlternatives = true;
      continue;
    }
    if (arg === "--max-alternatives-per-finding" && next) {
      maxAlternativesPerFinding = Number.parseInt(next, 10);
      index += 1;
      continue;
    }
    if (arg === "--practical-micro-runtime" && next) {
      if (!["off", "compare", "apply"].includes(next)) {
        throw new Error(
          `Invalid --practical-micro-runtime ${next}; expected off, compare, or apply.`,
        );
      }
      practicalMicroRuntimeMode = next as PracticalMicroRuntimeMode;
      index += 1;
      continue;
    }
    if (arg === "--practical-micro-rules" && next) {
      practicalMicroRuntimeRules = next
        .split(",")
        .map((value) => value.trim())
        .filter((value): value is PracticalMicroRuntimeRuleId =>
          DEFAULT_PRACTICAL_MICRO_RUNTIME_RULES.includes(
            value as PracticalMicroRuntimeRuleId,
          ),
        );
      index += 1;
      continue;
    }
    if (arg === "--opportunity-snapshot-source" && next) {
      opportunitySnapshotSource = next;
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
    ...(noDefaultPairs ? { noDefaultPairs } : {}),
    ...(pairFiles.length > 0 ? { pairFiles } : {}),
    ...(seeds && seeds.length > 0 ? { seeds } : {}),
    ...(Number.isFinite(maxActionsArg) ? { maxActions: maxActionsArg } : {}),
    ...(Number.isFinite(maxFindingsArg) ? { maxFindings: maxFindingsArg } : {}),
    ...(includeActionAlternatives ? { includeActionAlternatives } : {}),
    ...(Number.isFinite(maxAlternativesPerFinding)
      ? { maxAlternativesPerFinding }
      : {}),
    ...(practicalMicroRuntimeMode ? { practicalMicroRuntimeMode } : {}),
    ...(practicalMicroRuntimeRules && practicalMicroRuntimeRules.length > 0
      ? { practicalMicroRuntimeRules }
      : {}),
    ...(opportunitySnapshotSource ? { opportunitySnapshotSource } : {}),
  };
}

function actionAlternativeSnapshotsForSummary(summary: TraceMiningSummary) {
  return summary.actionSequence
    .map((entry, actionIndex) => ({
      actionIndex,
      side: entry.side,
      stateVersionBefore: entry.stateVersionBefore,
      selectedActionType: entry.actionType,
      alternatives: (entry.actionAlternatives ?? []).map((alternative) =>
        progressAwareAlternativeSnapshot(alternative),
      ),
    }))
    .filter((entry) => entry.alternatives.length > 0);
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

function readPairFile(path: string): TracePairFile[] {
  const parsed = JSON.parse(
    readFileSync(resolve(repoRoot, path), "utf8"),
  ) as TracePairFile | TracePairSetFile;
  if ("pairs" in parsed) return parsed.pairs;
  return [parsed];
}

function readOpportunitySnapshotRequests(
  path: string,
): Map<string, Array<{ seed: string; actionIndices: number[] }>> {
  const parsed = JSON.parse(readFileSync(resolve(repoRoot, path), "utf8")) as {
    cases?: Array<{
      caseId: string;
      precedingSameSideDecision?: { actionIndex?: number } | null;
      firstProgressAction?: { actionIndex?: number } | null;
    }>;
  };
  const requests = new Map<string, Map<string, Set<number>>>();
  for (const entry of parsed.cases ?? []) {
    const match = entry.caseId.match(/^([A-D])-([A-Za-z0-9_.:-]+)$/);
    if (!match) continue;
    const [, pairId, seed] = match;
    const indices = [
      entry.precedingSameSideDecision?.actionIndex,
      entry.firstProgressAction?.actionIndex,
    ].filter((value): value is number => Number.isInteger(value) && value >= 0);
    if (indices.length === 0) continue;
    const pairRequests = requests.get(pairId) ?? new Map<string, Set<number>>();
    const seedRequests = pairRequests.get(seed) ?? new Set<number>();
    for (const index of indices) seedRequests.add(index);
    pairRequests.set(seed, seedRequests);
    requests.set(pairId, pairRequests);
  }
  return new Map(
    [...requests.entries()].map(([pairId, seedRequests]) => [
      pairId,
      [...seedRequests.entries()].map(([seed, actionIndices]) => ({
        seed,
        actionIndices: [...actionIndices].sort((left, right) => left - right),
      })),
    ]),
  );
}

function benchmarkDeckFromAnySnapshot(
  snapshotId: string,
): ReturnType<typeof benchmarkDeckFromFrozenLocalSnapshot> {
  try {
    return benchmarkDeckFromFrozenLocalSnapshot(snapshotId);
  } catch (error) {
    if (
      error instanceof Error &&
      !error.message.includes("Unknown frozen local benchmark deck snapshot")
    ) {
      throw error;
    }
  }
  return benchmarkDeckFromSnapshot(snapshotId);
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

function combineAggregates(aggregates: Array<TraceMiningResult["aggregate"]>) {
  const games = sum(aggregates, (entry) => entry.games);
  const decisions = sum(aggregates, (entry) => entry.decisions);
  const findings = sum(aggregates, (entry) => entry.findings);
  const averageGameLength =
    games > 0
      ? sum(aggregates, (entry) => entry.averageGameLength * entry.games) /
        games
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
    actionLimitClusters: mergeCounts(
      aggregates.map((entry) => entry.actionLimitClusters),
    ),
    actionLimitSubclusters: mergeCounts(
      aggregates.map((entry) => entry.actionLimitSubclusters),
    ),
  };
}

function unsafeScoreChosenReasonsForSummaries(
  summaries: readonly TraceMiningSummary[],
): Record<string, number> {
  const reasons: Record<string, number> = {};
  for (const summary of summaries) {
    for (const entry of summary.actionSequence) {
      if (!unsafeScoreChosenEntry(entry)) continue;
      for (const reason of unsafeScoreChosenReasons(entry)) {
        reasons[reason] = (reasons[reason] ?? 0) + 1;
      }
    }
  }
  return reasons;
}

function unsafeScoreChosenEntry(entry: TraceMiningActionEntry): boolean {
  return (
    entry.side === "corp" &&
    entry.actionType === "score_agenda" &&
    entry.corpScoreTerminalWindow === true &&
    entry.corpScoreTerminalWindowRunnerAccessThreatHigh === true &&
    entry.corpScoreTerminalWindowProtectedRemoteReady !== true
  );
}

function unsafeScoreChosenReasons(entry: TraceMiningActionEntry): string[] {
  const reasons: string[] = [];
  if (entry.corpScoreTerminalWindowProtectedRemoteReady !== true) {
    reasons.push("unsafe_score_unprotected_remote");
    reasons.push("unsafe_score_missing_protected_remote_signal");
  }
  if (entry.corpScoreTerminalWindowRunnerAccessThreatHigh === true) {
    reasons.push("unsafe_score_runner_access_threat_high");
  }
  if (entry.corpScoreConversionFixGateBlockedByCredits === true) {
    reasons.push("unsafe_score_insufficient_rez_reserve");
  }
  if (entry.corpScoreConversionFixGateBlockedByCheapContest === true) {
    reasons.push("unsafe_score_cheap_contest_available");
  }
  if (entry.corpScoreConversionFixGateBlockedByHqThreat === true) {
    reasons.push("unsafe_score_hq_or_rnd_threat");
  }
  return reasons.length > 0
    ? sortedUnique(reasons)
    : ["unsafe_score_unknown_higher_priority"];
}

function sum<T>(entries: readonly T[], value: (entry: T) => number): number {
  return entries.reduce((total, entry) => total + value(entry), 0);
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort();
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
