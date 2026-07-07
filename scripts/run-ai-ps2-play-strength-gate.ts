import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import {
  benchmarkDeckFromFrozenLocalSnapshot,
  benchmarkDeckFromSnapshot,
  buildSemanticRuntimeWhyCoverageReportFromSimulationSummaries,
  buildSelfplayActionTypeDominanceReport,
  evaluatePracticalTacticBenchmark,
  frozenLegacyPracticalTacticSelector,
  runAiSelfplayTraceMining,
} from "../packages/ai/src/index";
import { applyPracticalTacticOverlay } from "../packages/ai/src/runtime/practical-tactic-overlay";
import type { AiDecision, AiDecisionInput } from "@netgrid/shared";

type PairId = "a" | "b" | "c" | "d";
type TraceMiningResult = ReturnType<typeof runAiSelfplayTraceMining>;
type TraceAggregate = TraceMiningResult["aggregate"];
type BenchmarkDeck = ReturnType<typeof benchmarkDeckFromFrozenLocalSnapshot>;

type Scenario = {
  scenarioId: string;
  label: string;
  runner?: BenchmarkDeck;
  corp?: BenchmarkDeck;
};

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

const args = parseArgs(process.argv.slice(2));
const repoRoot = findRepoRoot(process.cwd());
const outPath = resolve(repoRoot, args.out);
const seeds = args.seeds ?? DEFAULT_SEEDS;
const maxActions = args.maxActions ?? 160;
const scenarios = buildScenarios(args.pairs ?? []);
const tacticLegacy = evaluatePracticalTacticBenchmark(
  frozenLegacyPracticalTacticSelector,
);
const tacticCandidate = evaluatePracticalTacticBenchmark((input) =>
  applyPracticalTacticOverlay(input, frozenLegacyDecision(input), {
    practicalTacticOverlay: { enabled: true },
  }),
);

const scenarioResults = scenarios.map((scenario) => {
  const legacyVsLegacy = runLeg(scenario, "basic_runner_ai", "basic_corp_ai");
  const candidateRunnerVsLegacyCorp = runLeg(
    scenario,
    "current_candidate",
    "basic_corp_ai",
  );
  const legacyRunnerVsCandidateCorp = runLeg(
    scenario,
    "basic_runner_ai",
    "current_candidate",
  );
  return {
    scenarioId: scenario.scenarioId,
    label: scenario.label,
    decks:
      scenario.runner && scenario.corp
        ? {
            runner: deckSummary(scenario.runner),
            corp: deckSummary(scenario.corp),
          }
        : { runner: "default", corp: "default" },
    pairedMatches: {
      legacyVsLegacy: summarize(legacyVsLegacy),
      candidateRunnerVsLegacyCorp: summarize(candidateRunnerVsLegacyCorp),
      legacyRunnerVsCandidateCorp: summarize(legacyRunnerVsCandidateCorp),
    },
    deltas: deltas(
      legacyVsLegacy.aggregate,
      candidateRunnerVsLegacyCorp.aggregate,
      legacyRunnerVsCandidateCorp.aggregate,
    ),
  };
});

const aggregate = {
  legacyVsLegacy: combineAggregates(
    scenarioResults.map((entry) => entry.pairedMatches.legacyVsLegacy.aggregate),
  ),
  candidateRunnerVsLegacyCorp: combineAggregates(
    scenarioResults.map(
      (entry) => entry.pairedMatches.candidateRunnerVsLegacyCorp.aggregate,
    ),
  ),
  legacyRunnerVsCandidateCorp: combineAggregates(
    scenarioResults.map(
      (entry) => entry.pairedMatches.legacyRunnerVsCandidateCorp.aggregate,
    ),
  ),
};

const output = {
  schemaVersion: "ai-ps2-play-strength-gate-v1",
  generatedAt: new Date().toISOString(),
  config: {
    seeds,
    maxActions,
    scenarios: scenarios.map((scenario) => scenario.scenarioId),
    candidate: "current_candidate + practicalTacticOverlay.enabled",
    legacy: "basic_runner_ai/basic_corp_ai",
  },
  tacticBenchmark: {
    legacy: tacticLegacy,
    candidate: tacticCandidate,
    hitRateDelta: round(tacticCandidate.hitRate - tacticLegacy.hitRate),
  },
  aggregate,
  aggregateDeltas: deltas(
    aggregate.legacyVsLegacy,
    aggregate.candidateRunnerVsLegacyCorp,
    aggregate.legacyRunnerVsCandidateCorp,
  ),
  scenarioResults,
  decision: decision(),
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(JSON.stringify(output.decision, null, 2));

function runLeg(
  scenario: Scenario,
  runnerControllerMode: "basic_runner_ai" | "current_candidate",
  corpControllerMode: "basic_corp_ai" | "current_candidate",
): TraceMiningResult {
  return runAiSelfplayTraceMining({
    seeds,
    maxActions,
    maxFindings: 50,
    runnerControllerMode,
    corpControllerMode,
    ...(scenario.runner && scenario.corp
      ? {
          runnerDeck: scenario.runner.deck,
          corpDeck: scenario.corp.deck,
          runnerDeckMetadata: scenario.runner.metadata,
          corpDeckMetadata: scenario.corp.metadata,
        }
      : {}),
    aiDecisionRuntimeOptions: {
      practicalTacticOverlay: { enabled: true },
    },
  });
}

function decision() {
  const safetyGreen = [
    aggregate.candidateRunnerVsLegacyCorp,
    aggregate.legacyRunnerVsCandidateCorp,
  ].every(
    (entry) =>
      entry.illegalActions === 0 &&
      entry.replayFailures === 0 &&
      entry.redactionSafe === true,
  );
  const tacticBetter = tacticCandidate.hitRate - tacticLegacy.hitRate >= 0.2;
  const runnerMetricBetter =
    aggregate.candidateRunnerVsLegacyCorp.actionLimitReached <
      aggregate.legacyVsLegacy.actionLimitReached ||
    aggregate.candidateRunnerVsLegacyCorp.runnerAgendaSteals >
      aggregate.legacyVsLegacy.runnerAgendaSteals;
  const corpMetricBetter =
    aggregate.legacyRunnerVsCandidateCorp.actionLimitReached <
      aggregate.legacyVsLegacy.actionLimitReached ||
    aggregate.legacyRunnerVsCandidateCorp.corpAgendaScores >
      aggregate.legacyVsLegacy.corpAgendaScores;
  const practicalMetricBetter = runnerMetricBetter || corpMetricBetter;
  const mergeAllowed = safetyGreen && tacticBetter && practicalMetricBetter;
  return {
    mergeAllowed,
    recommendation: mergeAllowed ? "keep_candidate_opt_in" : "keep_default_off",
    safetyGreen,
    tacticBetter,
    practicalMetricBetter,
    runnerMetricBetter,
    corpMetricBetter,
    evidence: [
      `scenarios:${scenarios.length}`,
      `games_per_leg:${aggregate.legacyVsLegacy.games}`,
      `tactic_hit_rate_delta:${round(tacticCandidate.hitRate - tacticLegacy.hitRate)}`,
      `legacy_action_limits:${aggregate.legacyVsLegacy.actionLimitReached}`,
      `candidate_runner_action_limits:${aggregate.candidateRunnerVsLegacyCorp.actionLimitReached}`,
      `candidate_corp_action_limits:${aggregate.legacyRunnerVsCandidateCorp.actionLimitReached}`,
      `legacy_runner_steals:${aggregate.legacyVsLegacy.runnerAgendaSteals}`,
      `candidate_runner_steals:${aggregate.candidateRunnerVsLegacyCorp.runnerAgendaSteals}`,
      `legacy_corp_scores:${aggregate.legacyVsLegacy.corpAgendaScores}`,
      `candidate_corp_scores:${aggregate.legacyRunnerVsCandidateCorp.corpAgendaScores}`,
      `candidate_runner_illegal:${aggregate.candidateRunnerVsLegacyCorp.illegalActions}`,
      `candidate_corp_illegal:${aggregate.legacyRunnerVsCandidateCorp.illegalActions}`,
      `candidate_runner_replay_failures:${aggregate.candidateRunnerVsLegacyCorp.replayFailures}`,
      `candidate_corp_replay_failures:${aggregate.legacyRunnerVsCandidateCorp.replayFailures}`,
      ...dominanceEvidence(),
    ],
  };
}

function deltas(
  legacy: TraceAggregate,
  candidateRunner: TraceAggregate,
  candidateCorp: TraceAggregate,
) {
  return {
    candidateRunnerVsLegacy: {
      actionLimitReached: candidateRunner.actionLimitReached - legacy.actionLimitReached,
      runnerAgendaSteals: candidateRunner.runnerAgendaSteals - legacy.runnerAgendaSteals,
      corpAgendaScores: candidateRunner.corpAgendaScores - legacy.corpAgendaScores,
      averageGameLength: round(candidateRunner.averageGameLength - legacy.averageGameLength),
    },
    candidateCorpVsLegacy: {
      actionLimitReached: candidateCorp.actionLimitReached - legacy.actionLimitReached,
      runnerAgendaSteals: candidateCorp.runnerAgendaSteals - legacy.runnerAgendaSteals,
      corpAgendaScores: candidateCorp.corpAgendaScores - legacy.corpAgendaScores,
      averageGameLength: round(candidateCorp.averageGameLength - legacy.averageGameLength),
    },
  };
}

function summarize(result: TraceMiningResult) {
  return {
    aggregate: result.aggregate,
    whyCoverage:
      buildSemanticRuntimeWhyCoverageReportFromSimulationSummaries(
        result.summaries,
      ),
    actionTypeDominance: buildSelfplayActionTypeDominanceReport(result.summaries),
    summaries: result.summaries.map((summary) => ({
      seed: summary.seed,
      winner: summary.winner,
      actions: summary.actions,
      turns: summary.turns,
      finalAgendaPoints: summary.finalAgendaPoints,
      replayOk: summary.replayOk,
      redactionSafe: summary.redactionSafe,
      actionLimitReached: summary.winner === "action_limit_reached",
    })),
  };
}

function dominanceEvidence(): string[] {
  return scenarioResults.flatMap((scenario) =>
    (
      [
        ["legacy", scenario.pairedMatches.legacyVsLegacy.actionTypeDominance],
        [
          "candidate_runner",
          scenario.pairedMatches.candidateRunnerVsLegacyCorp.actionTypeDominance,
        ],
        [
          "candidate_corp",
          scenario.pairedMatches.legacyRunnerVsCandidateCorp.actionTypeDominance,
        ],
      ] as const
    ).map(
      ([leg, report]) =>
        `${scenario.scenarioId}:${leg}:action_type_dominance:${report.status}:top_share:${report.topShare}`,
    ),
  );
}

function buildScenarios(pairIds: PairId[]): Scenario[] {
  return [
    { scenarioId: "default_demo", label: "Default demo decks" },
    ...pairIds.map((id) => {
      const { pair } = readPair(id);
      return {
        scenarioId: pair.id,
        label: pair.label,
        runner: benchmarkDeckFromAnySnapshot(pair.runner),
        corp: benchmarkDeckFromAnySnapshot(pair.corp),
      };
    }),
  ];
}

function readPair(id: PairId): TracePairFile {
  return JSON.parse(
    readFileSync(
      join(repoRoot, "docs", "reviews", "ai", `ai-selfplay-trace-mining-${id}.json`),
      "utf8",
    ),
  ) as TracePairFile;
}

function benchmarkDeckFromAnySnapshot(snapshotId: string): BenchmarkDeck {
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

function deckSummary(deck: BenchmarkDeck) {
  return {
    snapshotId: deck.metadata.snapshotId,
    name: deck.metadata.name,
    deckHash: deck.metadata.deckHash,
  };
}

function frozenLegacyDecision(input: AiDecisionInput): AiDecision {
  const actionId = frozenLegacyPracticalTacticSelector(input).actionId;
  return {
    actionId,
    reasonCode: "frozen_legacy.practical_tactic_reference",
    explanation: "Frozen legacy reference for AI-PS2 paired benchmark.",
    consideredActionIds: input.legalActions.map((action) => action.actionId),
    fallbackUsed: false,
  };
}

function parseArgs(argv: string[]): {
  out: string;
  pairs?: PairId[];
  seeds?: string[];
  maxActions?: number;
} {
  let out: string | undefined;
  let pairs: PairId[] | undefined;
  let seeds: string[] | undefined;
  let maxActions: number | undefined;
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
      maxActions = Number.parseInt(next, 10);
      index += 1;
      continue;
    }
  }
  if (!out) throw new Error("Missing required --out <path> argument.");
  return {
    out,
    ...(pairs && pairs.length > 0 ? { pairs } : {}),
    ...(seeds && seeds.length > 0 ? { seeds } : {}),
    ...(Number.isFinite(maxActions) ? { maxActions } : {}),
  };
}

function combineAggregates(aggregates: TraceAggregate[]): TraceAggregate {
  const games = sum(aggregates, (entry) => entry.games);
  const averageGameLength =
    games > 0
      ? sum(aggregates, (entry) => entry.averageGameLength * entry.games) / games
      : 0;
  return {
    games,
    decisions: sum(aggregates, (entry) => entry.decisions),
    findings: sum(aggregates, (entry) => entry.findings),
    findingsBySeverity: mergeCounts(aggregates.map((entry) => entry.findingsBySeverity)),
    findingsByDetector: mergeCounts(aggregates.map((entry) => entry.findingsByDetector)),
    illegalActions: sum(aggregates, (entry) => entry.illegalActions),
    replayFailures: sum(aggregates, (entry) => entry.replayFailures),
    actionLimitReached: sum(aggregates, (entry) => entry.actionLimitReached),
    allRedactionSafe: aggregates.every((entry) => entry.allRedactionSafe),
    redactionSafe: aggregates.every((entry) => entry.redactionSafe),
    averageGameLength: round(averageGameLength),
    corpAgendaScores: sum(aggregates, (entry) => entry.corpAgendaScores),
    runnerAgendaSteals: sum(aggregates, (entry) => entry.runnerAgendaSteals),
    corpFlatlines: sum(aggregates, (entry) => entry.corpFlatlines),
    scoreWindowMissed: sum(aggregates, (entry) => entry.scoreWindowMissed),
    unsafeScoreChosen: sum(aggregates, (entry) => entry.unsafeScoreChosen),
    passiveActionWithScoreLineAvailable: sum(
      aggregates,
      (entry) => entry.passiveActionWithScoreLineAvailable,
    ),
    actionLimitClusters: mergeCounts(aggregates.map((entry) => entry.actionLimitClusters)),
    actionLimitSubclusters: mergeCounts(
      aggregates.map((entry) => entry.actionLimitSubclusters),
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

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
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
