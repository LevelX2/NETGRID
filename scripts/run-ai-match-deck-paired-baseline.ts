import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { DeckDefinition, DeckPublicMetadata, Side } from "@netgrid/shared";
import {
  runAiSelfplayTraceMining,
  summarizeMatchProgressionMetrics,
  type AiSimulationSummary,
} from "../packages/ai/src/index";
import type { SimulationControllerMode } from "../packages/ai/src/simulation/simulation-types";

type TraceMiningResult = ReturnType<typeof runAiSelfplayTraceMining>;
type TraceMiningAggregate = TraceMiningResult["aggregate"];

type StoredDeckSnapshot = {
  deckSnapshotId: string;
  sourceDeckId?: string;
  deckVersion?: string;
  name: string;
  side: Side;
  identityCardId: string;
  cards: Array<{ cardId: string; quantity: number }>;
  publicMetadata?: DeckPublicMetadata;
  deckHash?: string;
};

type PrivateDeckSnapshots = {
  runner: StoredDeckSnapshot;
  corp: StoredDeckSnapshot;
};

type MatchRecord = {
  match?: {
    matchId?: string;
    status?: string;
    mode?: string;
    seed?: string;
    updatedAt?: string;
    settings?: { agendaPointsToWin?: number; cardPool?: string };
    deckSetup?: {
      runner?: DeckPublicMetadata;
      corp?: DeckPublicMetadata;
    };
  };
  privateDeckSnapshots?: PrivateDeckSnapshots;
};

type LegId =
  | "current_vs_current"
  | "random_runner_vs_current_corp"
  | "current_runner_vs_random_corp"
  | "random_vs_random";

type BenchmarkLeg = {
  legId: LegId;
  label: string;
  runnerControllerMode: SimulationControllerMode;
  corpControllerMode: SimulationControllerMode;
};

type PairedArgs = {
  sqlite: string;
  matchId?: string;
  games: number;
  batchSize: number;
  maxActions: number;
  seedPrefix: string;
  legs: LegId[];
  out: string;
  markdownOut?: string;
};

type BatchTiming = {
  batchIndex: number;
  fromGame: number;
  toGame: number;
  games: number;
  durationMs: number;
  secondsPerGame: number;
  averageActions: number;
  actionLimitReached: number;
  runnerWins: number;
  corpWins: number;
  averageRunnerAgendaPoints: number;
  averageCorpAgendaPoints: number;
};

const ALL_LEGS: Record<LegId, BenchmarkLeg> = {
  current_vs_current: {
    legId: "current_vs_current",
    label: "Current Runner vs current Corp",
    runnerControllerMode: "current_candidate",
    corpControllerMode: "current_candidate",
  },
  random_runner_vs_current_corp: {
    legId: "random_runner_vs_current_corp",
    label: "Random-Legal Runner vs current Corp",
    runnerControllerMode: "random_legal_bot",
    corpControllerMode: "current_candidate",
  },
  current_runner_vs_random_corp: {
    legId: "current_runner_vs_random_corp",
    label: "Current Runner vs Random-Legal Corp",
    runnerControllerMode: "current_candidate",
    corpControllerMode: "random_legal_bot",
  },
  random_vs_random: {
    legId: "random_vs_random",
    label: "Random-Legal Runner vs Random-Legal Corp",
    runnerControllerMode: "random_legal_bot",
    corpControllerMode: "random_legal_bot",
  },
};

const repoRoot = findRepoRoot(process.cwd());
const args = parseArgs(process.argv.slice(2));
const sqlitePath = resolve(repoRoot, args.sqlite);
const outPath = resolve(repoRoot, args.out);
const markdownPath = args.markdownOut
  ? resolve(repoRoot, args.markdownOut)
  : outPath.replace(/\.json$/i, ".md");
const gitHead = git(["rev-parse", "--short", "HEAD"]);
const match = readMatchDecks(sqlitePath, args.matchId);
const seeds = Array.from(
  { length: args.games },
  (_value, index) => `${args.seedPrefix}-${String(index + 1).padStart(3, "0")}`,
);
const runnerDeck = deckDefinitionFromSnapshot(match.decks.runner);
const corpDeck = deckDefinitionFromSnapshot(match.decks.corp);
const runnerDeckMetadata =
  match.decks.runner.publicMetadata ?? match.record.match?.deckSetup?.runner;
const corpDeckMetadata =
  match.decks.corp.publicMetadata ?? match.record.match?.deckSetup?.corp;
const startedAt = Date.now();
const legResults: LegOutput[] = [];

writeOutput("running");

for (const legId of args.legs) {
  const leg = ALL_LEGS[legId];
  const legStartedAt = Date.now();
  const summaries: AiSimulationSummary[] = [];
  const findings: TraceMiningResult["findings"] = [];
  const topFindings: TraceMiningResult["topFindings"] = [];
  const traceAggregates: TraceMiningAggregate[] = [];
  const batches: BatchTiming[] = [];
  for (
    let batchStart = 0, batchIndex = 1;
    batchStart < seeds.length;
    batchStart += args.batchSize, batchIndex += 1
  ) {
    const batchSeeds = seeds.slice(batchStart, batchStart + args.batchSize);
    const batchStartedAt = Date.now();
    const result = runAiSelfplayTraceMining({
      seeds: batchSeeds,
      maxActions: args.maxActions,
      maxFindings: 50,
      runnerDeck,
      corpDeck,
      ...(runnerDeckMetadata ? { runnerDeckMetadata } : {}),
      ...(corpDeckMetadata ? { corpDeckMetadata } : {}),
      runnerControllerMode: leg.runnerControllerMode,
      corpControllerMode: leg.corpControllerMode,
    });
    summaries.push(...result.summaries);
    findings.push(...result.findings);
    topFindings.push(...result.topFindings);
    traceAggregates.push(result.aggregate);
    const batchAggregate = aggregateSummaries(result.summaries);
    const batchDurationMs = Date.now() - batchStartedAt;
    const timing: BatchTiming = {
      batchIndex,
      fromGame: batchStart + 1,
      toGame: batchStart + batchSeeds.length,
      games: batchSeeds.length,
      durationMs: batchDurationMs,
      secondsPerGame: round(batchDurationMs / 1000 / batchSeeds.length),
      averageActions: batchAggregate.averageActions,
      actionLimitReached: batchAggregate.actionLimitReached,
      runnerWins: batchAggregate.runnerWins,
      corpWins: batchAggregate.corpWins,
      averageRunnerAgendaPoints: batchAggregate.averageRunnerAgendaPoints,
      averageCorpAgendaPoints: batchAggregate.averageCorpAgendaPoints,
    };
    batches.push(timing);
    const current = buildLegOutput(
      leg,
      "running",
      summaries,
      findings,
      topFindings,
      traceAggregates,
      batches,
      Date.now() - legStartedAt,
    );
    replaceLegResult(current);
    writeOutput("running");
    console.log(
      [
        leg.legId,
        `batch ${batchIndex}`,
        `games ${summaries.length}/${args.games}`,
        `duration ${formatDuration(batchDurationMs)}`,
        `${timing.secondsPerGame}s/game`,
        `runner ${timing.averageRunnerAgendaPoints} AP`,
        `corp ${timing.averageCorpAgendaPoints} AP`,
        `limits ${timing.actionLimitReached}`,
      ].join(" | "),
    );
  }
  replaceLegResult(
    buildLegOutput(
      leg,
      "complete",
      summaries,
      findings,
      topFindings,
      traceAggregates,
      batches,
      Date.now() - legStartedAt,
    ),
  );
  writeOutput("running");
}

writeOutput("complete");

type LegOutput = ReturnType<typeof buildLegOutput>;

function replaceLegResult(result: LegOutput): void {
  const index = legResults.findIndex((entry) => entry.legId === result.legId);
  if (index >= 0) legResults[index] = result;
  else legResults.push(result);
}

function buildLegOutput(
  leg: BenchmarkLeg,
  status: "running" | "complete",
  summaries: AiSimulationSummary[],
  findings: TraceMiningResult["findings"],
  topFindings: TraceMiningResult["topFindings"],
  traceAggregates: TraceMiningAggregate[],
  batches: BatchTiming[],
  elapsedMs: number,
) {
  const progression = summarizeMatchProgressionMetrics(summaries);
  const traceMiningAggregate = combineTraceMiningAggregates(
    traceAggregates,
    summaries,
    findings,
  );
  return {
    legId: leg.legId,
    label: leg.label,
    status,
    runnerControllerMode: leg.runnerControllerMode,
    corpControllerMode: leg.corpControllerMode,
    performance: {
      elapsedMs,
      elapsed: formatDuration(elapsedMs),
      averageSecondsPerCompletedGame:
        summaries.length > 0 ? round(elapsedMs / 1000 / summaries.length) : 0,
      batches,
    },
    aggregate: aggregateSummaries(summaries),
    traceMiningAggregate,
    progression,
    topFindings: topFindings.slice(0, 20).map((finding) => ({
      seed: finding.seed,
      actionIndex: finding.actionIndex,
      side: finding.side,
      selectedActionType: finding.selectedActionType,
      detectorIds: finding.detectorIds,
      severity: finding.severity,
      shortReason: finding.shortReason,
    })),
    games: summaries.map((summary) => ({
      seed: summary.seed,
      winner: summary.winner,
      gameEndReason: summary.gameEndReason,
      actions: summary.actions,
      turns: summary.turns,
      finalAgendaPoints: summary.finalAgendaPoints,
      replayOk: summary.replayOk,
      actionLimitReached: summary.winner === "action_limit_reached",
      errors: summary.errors,
    })),
  };
}

function writeOutput(status: "running" | "complete"): void {
  const output = buildOutput(status);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  mkdirSync(dirname(markdownPath), { recursive: true });
  writeFileSync(markdownPath, markdownReport(output), "utf8");
}

function buildOutput(status: "running" | "complete") {
  return {
    schemaVersion: "netgrid-ai-match-deck-paired-baseline-v1",
    status,
    generatedAt: new Date().toISOString(),
    gitHead,
    source: {
      sqlite: relative(repoRoot, sqlitePath).replaceAll("\\", "/"),
      matchId: match.matchId,
      matchStatus: match.record.match?.status,
      matchMode: match.record.match?.mode,
      matchUpdatedAt: match.record.match?.updatedAt,
      matchSeed: match.record.match?.seed,
      cardPool: match.record.match?.settings?.cardPool,
      agendaPointsToWin: match.record.match?.settings?.agendaPointsToWin ?? 7,
    },
    config: {
      games: args.games,
      batchSize: args.batchSize,
      maxActions: args.maxActions,
      seedPrefix: args.seedPrefix,
      seeds,
      legs: args.legs,
    },
    decks: {
      runner: deckMetadata(match.decks.runner, runnerDeckMetadata),
      corp: deckMetadata(match.decks.corp, corpDeckMetadata),
    },
    performance: {
      elapsedMs: Date.now() - startedAt,
      elapsed: formatDuration(Date.now() - startedAt),
    },
    legs: legResults,
    comparison: comparisonSummary(legResults),
  };
}

type PairedOutput = ReturnType<typeof buildOutput>;

function comparisonSummary(results: readonly LegOutput[]) {
  const byId = new Map(results.map((entry) => [entry.legId, entry]));
  const current = byId.get("current_vs_current");
  const corpVsRandomRunner = byId.get("random_runner_vs_current_corp");
  const runnerVsRandomCorp = byId.get("current_runner_vs_random_corp");
  const randomControl = byId.get("random_vs_random");
  return {
    currentVsCurrent: legScore(current),
    currentCorpAgainstRandomRunner: legScore(corpVsRandomRunner),
    currentRunnerAgainstRandomCorp: legScore(runnerVsRandomCorp),
    randomVsRandom: legScore(randomControl),
    deltas: {
      currentCorpVsRandomCorp: deltaLeg(corpVsRandomRunner, randomControl),
      currentRunnerVsRandomRunner: deltaLeg(runnerVsRandomCorp, randomControl),
      mirrorConfoundingCheck: deltaLeg(current, corpVsRandomRunner),
    },
  };
}

function legScore(leg: LegOutput | undefined) {
  if (!leg) return undefined;
  return {
    games: leg.aggregate.games,
    runnerWins: leg.aggregate.runnerWins,
    corpWins: leg.aggregate.corpWins,
    actionLimitReached: leg.aggregate.actionLimitReached,
    averageRunnerAgendaPoints: leg.aggregate.averageRunnerAgendaPoints,
    averageCorpAgendaPoints: leg.aggregate.averageCorpAgendaPoints,
    corpAgendaScores: leg.traceMiningAggregate.corpAgendaScores,
    runnerAgendaSteals: leg.traceMiningAggregate.runnerAgendaSteals,
    corpFlatlines: leg.traceMiningAggregate.corpFlatlines,
    passiveActionWithScoreLineAvailable:
      leg.traceMiningAggregate.passiveActionWithScoreLineAvailable,
  };
}

function deltaLeg(
  candidate: LegOutput | undefined,
  baseline: LegOutput | undefined,
) {
  if (!candidate || !baseline) return undefined;
  return {
    corpWins: candidate.aggregate.corpWins - baseline.aggregate.corpWins,
    runnerWins: candidate.aggregate.runnerWins - baseline.aggregate.runnerWins,
    actionLimitReached:
      candidate.aggregate.actionLimitReached -
      baseline.aggregate.actionLimitReached,
    averageCorpAgendaPoints: round(
      candidate.aggregate.averageCorpAgendaPoints -
        baseline.aggregate.averageCorpAgendaPoints,
    ),
    averageRunnerAgendaPoints: round(
      candidate.aggregate.averageRunnerAgendaPoints -
        baseline.aggregate.averageRunnerAgendaPoints,
    ),
    corpAgendaScores:
      candidate.traceMiningAggregate.corpAgendaScores -
      baseline.traceMiningAggregate.corpAgendaScores,
    runnerAgendaSteals:
      candidate.traceMiningAggregate.runnerAgendaSteals -
      baseline.traceMiningAggregate.runnerAgendaSteals,
    corpFlatlines:
      candidate.traceMiningAggregate.corpFlatlines -
      baseline.traceMiningAggregate.corpFlatlines,
  };
}

function readMatchDecks(
  dbPath: string,
  requestedMatchId: string | undefined,
): { matchId: string; record: MatchRecord; decks: PrivateDeckSnapshots } {
  const db = new DatabaseSync(dbPath, { readOnly: true });
  const matchRow = requestedMatchId
    ? (db
        .prepare(
          "select match_id as matchId, record_json as recordJson from matches where match_id = ?",
        )
        .get(requestedMatchId) as
        | { matchId: string; recordJson: string }
        | undefined)
    : (db
        .prepare(
          "select match_id as matchId, record_json as recordJson from matches where status = 'finished' order by updated_at desc limit 1",
        )
        .get() as { matchId: string; recordJson: string } | undefined);
  if (!matchRow) throw new Error("No matching finished match found.");
  const privateRow = db
    .prepare(
      "select private_deck_snapshots_json as privateDeckSnapshotsJson from private_deck_snapshots where match_id = ?",
    )
    .get(matchRow.matchId) as { privateDeckSnapshotsJson?: string } | undefined;
  const record = JSON.parse(matchRow.recordJson) as MatchRecord;
  const decks = privateRow?.privateDeckSnapshotsJson
    ? (JSON.parse(privateRow.privateDeckSnapshotsJson) as PrivateDeckSnapshots)
    : record.privateDeckSnapshots;
  if (!decks?.runner || !decks.corp) {
    throw new Error(`Match ${matchRow.matchId} has no private deck snapshots.`);
  }
  return { matchId: matchRow.matchId, record, decks };
}

function deckDefinitionFromSnapshot(
  snapshot: StoredDeckSnapshot,
): DeckDefinition {
  return {
    id: snapshot.sourceDeckId ?? snapshot.deckSnapshotId,
    name: snapshot.name,
    side: snapshot.side,
    identity: snapshot.identityCardId,
    cards: snapshot.cards.map((card) => ({
      id: card.cardId,
      quantity: card.quantity,
    })),
  };
}

function deckMetadata(
  snapshot: StoredDeckSnapshot,
  publicMetadata: DeckPublicMetadata | undefined,
) {
  return {
    deckSnapshotId: snapshot.deckSnapshotId,
    sourceDeckId: snapshot.sourceDeckId,
    deckVersion: snapshot.deckVersion,
    name: snapshot.name,
    side: snapshot.side,
    identityCardId: snapshot.identityCardId,
    deckHash: snapshot.deckHash ?? publicMetadata?.deckHash,
    totalCards: snapshot.cards.reduce((sum, card) => sum + card.quantity, 0),
  };
}

function aggregateSummaries(summaries: AiSimulationSummary[]) {
  const games = summaries.length || 1;
  const winnerCounts = countBy(summaries, (summary) => summary.winner);
  const runnerWins = winnerCounts.runner ?? 0;
  const corpWins = winnerCounts.corp ?? 0;
  const actionLimitReached = winnerCounts.action_limit_reached ?? 0;
  const runnerAgendaPoints = summaries.map(
    (summary) => summary.finalAgendaPoints.runner,
  );
  const corpAgendaPoints = summaries.map(
    (summary) => summary.finalAgendaPoints.corp,
  );
  return {
    games: summaries.length,
    runnerWins,
    corpWins,
    actionLimitReached,
    runnerWinRate: round(runnerWins / games),
    corpWinRate: round(corpWins / games),
    actionLimitRate: round(actionLimitReached / games),
    averageRunnerAgendaPoints: round(average(runnerAgendaPoints)),
    averageCorpAgendaPoints: round(average(corpAgendaPoints)),
    medianRunnerAgendaPoints: median(runnerAgendaPoints),
    medianCorpAgendaPoints: median(corpAgendaPoints),
    averageActions: round(average(summaries.map((summary) => summary.actions))),
    averageTurns: round(average(summaries.map((summary) => summary.turns))),
    replayFailures: summaries.filter((summary) => !summary.replayOk).length,
    gamesWithErrors: summaries.filter((summary) => summary.errors.length > 0)
      .length,
  };
}

function combineTraceMiningAggregates(
  aggregates: readonly TraceMiningAggregate[],
  summaries: AiSimulationSummary[],
  findings: TraceMiningResult["findings"],
): TraceMiningAggregate {
  const progression = summarizeMatchProgressionMetrics(summaries);
  const allRedactionSafe =
    aggregates.length === 0 ||
    aggregates.every((aggregate) => aggregate.allRedactionSafe);
  const redactionSafe =
    aggregates.length === 0 ||
    aggregates.every((aggregate) => aggregate.redactionSafe);
  return {
    games: summaries.length,
    decisions: sumAggregates(aggregates, (aggregate) => aggregate.decisions),
    findings: findings.length,
    findingsBySeverity: mergeNumericRecords([
      zeroFindingSeverityCounts(),
      ...aggregates.map((aggregate) => aggregate.findingsBySeverity),
    ]) as TraceMiningAggregate["findingsBySeverity"],
    findingsByDetector: mergeNumericRecords(
      aggregates.map((aggregate) => aggregate.findingsByDetector),
    ) as TraceMiningAggregate["findingsByDetector"],
    illegalActions: sumAggregates(
      aggregates,
      (aggregate) => aggregate.illegalActions,
    ),
    replayFailures: sumAggregates(
      aggregates,
      (aggregate) => aggregate.replayFailures,
    ),
    actionLimitReached: summaries.filter(
      (summary) => summary.winner === "action_limit_reached",
    ).length,
    allRedactionSafe,
    redactionSafe,
    averageGameLength: progression.averageActions,
    corpAgendaScores: sumAggregates(
      aggregates,
      (aggregate) => aggregate.corpAgendaScores,
    ),
    runnerAgendaSteals: sumAggregates(
      aggregates,
      (aggregate) => aggregate.runnerAgendaSteals,
    ),
    corpFlatlines: sumAggregates(
      aggregates,
      (aggregate) => aggregate.corpFlatlines,
    ),
    scoreWindowMissed: sumAggregates(
      aggregates,
      (aggregate) => aggregate.scoreWindowMissed,
    ),
    unsafeScoreChosen: sumAggregates(
      aggregates,
      (aggregate) => aggregate.unsafeScoreChosen,
    ),
    passiveActionWithScoreLineAvailable: sumAggregates(
      aggregates,
      (aggregate) => aggregate.passiveActionWithScoreLineAvailable,
    ),
    actionLimitClusters: mergeNumericRecords(
      aggregates.map((aggregate) => aggregate.actionLimitClusters),
    ) as TraceMiningAggregate["actionLimitClusters"],
    actionLimitSubclusters: mergeNumericRecords(
      aggregates.map((aggregate) => aggregate.actionLimitSubclusters),
    ) as TraceMiningAggregate["actionLimitSubclusters"],
  } as TraceMiningAggregate;
}

function zeroFindingSeverityCounts(): TraceMiningAggregate["findingsBySeverity"] {
  return {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
}

function sumAggregates(
  aggregates: readonly TraceMiningAggregate[],
  select: (aggregate: TraceMiningAggregate) => number,
): number {
  return aggregates.reduce((sum, aggregate) => sum + select(aggregate), 0);
}

function mergeNumericRecords<T extends string>(
  records: readonly Partial<Record<T, number>>[],
): Record<T, number> {
  const merged: Partial<Record<T, number>> = {};
  for (const record of records) {
    for (const [key, value] of Object.entries(record) as Array<[T, number]>) {
      merged[key] = (merged[key] ?? 0) + value;
    }
  }
  return merged as Record<T, number>;
}

function markdownReport(output: PairedOutput): string {
  return [
    `# AI Match Deck Paired Baseline ${output.source.matchId}`,
    "",
    `Status: ${output.status}`,
    `Generated: ${output.generatedAt}`,
    `Git head: ${output.gitHead}`,
    "",
    "## Source",
    "",
    `- Match: \`${output.source.matchId}\``,
    `- SQLite: \`${output.source.sqlite}\``,
    `- Runner deck: \`${output.decks.runner.name}\` (${output.decks.runner.deckHash})`,
    `- Corp deck: \`${output.decks.corp.name}\` (${output.decks.corp.deckHash})`,
    `- Games per leg: ${output.config.games}`,
    `- Max actions: ${output.config.maxActions}`,
    "",
    "## Legs",
    "",
    "| Leg | Status | Runner | Corp | Runner wins | Corp wins | Limits | Runner AP | Corp AP | Corp scores | Runner steals | Corp flatlines |",
    "| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...output.legs.map((leg) => {
      const a = leg.aggregate;
      const t = leg.traceMiningAggregate;
      return `| ${leg.legId} | ${leg.status} | ${leg.runnerControllerMode} | ${leg.corpControllerMode} | ${a.runnerWins} | ${a.corpWins} | ${a.actionLimitReached} | ${a.averageRunnerAgendaPoints} | ${a.averageCorpAgendaPoints} | ${t.corpAgendaScores} | ${t.runnerAgendaSteals} | ${t.corpFlatlines} |`;
    }),
    "",
    "## Interpretation",
    "",
    "- `random_runner_vs_current_corp` isolates current Corp behavior against an explicit Random-Legal control.",
    "- `current_runner_vs_random_corp` isolates current Runner behavior against an explicit Random-Legal control.",
    "- `current_vs_current` alone is not sufficient, because both sides can move at once.",
    "",
  ].join("\n");
}

function parseArgs(argv: string[]): PairedArgs {
  let sqlite = "data/runtime/multiplayer/netgrid.sqlite";
  let matchId: string | undefined;
  let games = 30;
  let batchSize = 5;
  let maxActions = 480;
  let seedPrefix = "latest-match-baseline";
  let legs: LegId[] = [
    "current_vs_current",
    "random_runner_vs_current_corp",
    "current_runner_vs_random_corp",
    "random_vs_random",
  ];
  let out = "docs/reviews/ai/ai-match-deck-paired-baseline.json";
  let markdownOut: string | undefined;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--sqlite" && next) {
      sqlite = next;
      index += 1;
      continue;
    }
    if (arg === "--match-id" && next) {
      matchId = next;
      index += 1;
      continue;
    }
    if (arg === "--games" && next) {
      games = Number.parseInt(next, 10);
      index += 1;
      continue;
    }
    if (arg === "--batch-size" && next) {
      batchSize = Number.parseInt(next, 10);
      index += 1;
      continue;
    }
    if (arg === "--max-actions" && next) {
      maxActions = Number.parseInt(next, 10);
      index += 1;
      continue;
    }
    if (arg === "--seed-prefix" && next) {
      seedPrefix = next;
      index += 1;
      continue;
    }
    if (arg === "--legs" && next) {
      legs = parseLegs(next);
      index += 1;
      continue;
    }
    if (arg === "--out" && next) {
      out = next;
      index += 1;
      continue;
    }
    if (arg === "--markdown-out" && next) {
      markdownOut = next;
      index += 1;
      continue;
    }
  }
  if (!Number.isInteger(games) || games <= 0) {
    throw new Error("--games must be a positive integer.");
  }
  if (!Number.isInteger(batchSize) || batchSize <= 0) {
    throw new Error("--batch-size must be a positive integer.");
  }
  if (!Number.isInteger(maxActions) || maxActions <= 0) {
    throw new Error("--max-actions must be a positive integer.");
  }
  return {
    sqlite,
    ...(matchId ? { matchId } : {}),
    games,
    batchSize,
    maxActions,
    seedPrefix,
    legs,
    out,
    ...(markdownOut ? { markdownOut } : {}),
  };
}

function parseLegs(value: string): LegId[] {
  const legs = value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry): entry is LegId => entry in ALL_LEGS);
  if (legs.length === 0) throw new Error("No valid --legs values.");
  return legs;
}

function countBy<T extends string>(
  values: readonly AiSimulationSummary[],
  select: (value: AiSimulationSummary) => T,
): Partial<Record<T, number>> {
  const counts: Partial<Record<T, number>> = {};
  for (const value of values) {
    const key = select(value);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function average(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle] ?? 0;
  return round(((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2);
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.round(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const restSeconds = seconds % 60;
  return minutes > 0 ? `${minutes}m ${restSeconds}s` : `${seconds}s`;
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
      // Continue walking up.
    }
    const parent = dirname(current);
    if (parent === current) {
      throw new Error(`Could not find NETGRID repo root from ${start}`);
    }
    current = parent;
  }
}
