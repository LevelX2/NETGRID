import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { DeckDefinition, DeckPublicMetadata, Side } from "@netgrid/shared";
import {
  buildSemanticRuntimeWhyCoverageReportFromSimulationSummaries,
  runAiSelfplayTraceMining,
  summarizeMatchProgressionMetrics,
  type AiSimulationSummary,
} from "../packages/ai/src/simulation";

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

type BaselineArgs = {
  sqlite: string;
  matchId?: string;
  games: number;
  batchSize: number;
  maxActions: number;
  seedPrefix: string;
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

const summaries: AiSimulationSummary[] = [];
const findings: TraceMiningResult["findings"] = [];
const topFindings: TraceMiningResult["topFindings"] = [];
const traceAggregates: TraceMiningAggregate[] = [];
const batches: BatchTiming[] = [];
const startedAt = Date.now();

writeCurrentOutput("running");

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
    runnerControllerMode: "current_candidate",
    corpControllerMode: "current_candidate",
  });
  traceAggregates.push(result.aggregate);
  summaries.push(...result.summaries);
  findings.push(...result.findings);
  topFindings.push(...result.topFindings);
  const batchDurationMs = Date.now() - batchStartedAt;
  const batchAggregate = aggregateSummaries(result.summaries);
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
  writeCurrentOutput("running");
  console.log(
    [
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

writeCurrentOutput("complete");

function writeCurrentOutput(status: "running" | "complete"): void {
  const output = buildOutput(status);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  mkdirSync(dirname(markdownPath), { recursive: true });
  writeFileSync(markdownPath, markdownReport(output), "utf8");
}

function buildOutput(status: "running" | "complete") {
  const progression = summarizeMatchProgressionMetrics(summaries);
  const whyCoverage =
    buildSemanticRuntimeWhyCoverageReportFromSimulationSummaries(summaries);
  const traceMiningAggregate = combineTraceMiningAggregates(
    traceAggregates,
    summaries,
    findings,
  );
  const aggregate = aggregateSummaries(summaries);
  return {
    schemaVersion: "netgrid-ai-match-deck-baseline-v1",
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
      completedGames: summaries.length,
      batchSize: args.batchSize,
      maxActions: args.maxActions,
      seedPrefix: args.seedPrefix,
      runnerControllerMode: "current_candidate",
      corpControllerMode: "current_candidate",
    },
    decks: {
      runner: deckMetadata(match.decks.runner, runnerDeckMetadata),
      corp: deckMetadata(match.decks.corp, corpDeckMetadata),
    },
    performance: {
      elapsedMs: Date.now() - startedAt,
      elapsed: formatDuration(Date.now() - startedAt),
      averageSecondsPerCompletedGame:
        summaries.length > 0
          ? round((Date.now() - startedAt) / 1000 / summaries.length)
          : 0,
      batches,
    },
    aggregate,
    traceMiningAggregate,
    whyCoverage,
    progression,
    topFindings: topFindings.slice(0, 50).map((finding) => ({
      seed: finding.seed,
      actionIndex: finding.actionIndex,
      side: finding.side,
      selectedActionType: finding.selectedActionType,
      detectorIds: finding.detectorIds,
      severity: finding.severity,
      shortReason: finding.shortReason,
    })),
    games: summaries.map((summary) => compactSummary(summary)),
  };
}

type BaselineOutput = ReturnType<typeof buildOutput>;

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

function compactSummary(summary: AiSimulationSummary) {
  return {
    seed: summary.seed,
    winner: summary.winner,
    gameEndReason: summary.gameEndReason,
    actions: summary.actions,
    turns: summary.turns,
    finalAgendaPoints: summary.finalAgendaPoints,
    replayOk: summary.replayOk,
    actionLimitReached: summary.winner === "action_limit_reached",
    errors: summary.errors,
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

function sumAggregates(
  aggregates: readonly TraceMiningAggregate[],
  select: (aggregate: TraceMiningAggregate) => number,
): number {
  return aggregates.reduce((sum, aggregate) => sum + select(aggregate), 0);
}

function zeroFindingSeverityCounts(): TraceMiningAggregate["findingsBySeverity"] {
  return {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
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

function markdownReport(output: BaselineOutput): string {
  const a = output.aggregate;
  return [
    `# AI Match Deck Baseline ${output.source.matchId}`,
    "",
    `Status: ${output.status}`,
    `Generated: ${output.generatedAt}`,
    `Git head: ${output.gitHead}`,
    "",
    "## Source",
    "",
    `- Match: \`${output.source.matchId}\``,
    `- SQLite: \`${output.source.sqlite}\``,
    `- Mode: \`${output.source.matchMode}\``,
    `- Updated: \`${output.source.matchUpdatedAt}\``,
    `- Runner deck: \`${output.decks.runner.name}\` (${output.decks.runner.deckHash})`,
    `- Corp deck: \`${output.decks.corp.name}\` (${output.decks.corp.deckHash})`,
    "",
    "## Baseline",
    "",
    `- Games: ${a.games}/${output.config.games}`,
    `- Batch size: ${output.config.batchSize}`,
    `- Max actions per game: ${output.config.maxActions}`,
    `- Elapsed: ${output.performance.elapsed}`,
    `- Average seconds per completed game: ${output.performance.averageSecondsPerCompletedGame}`,
    `- Runner wins: ${a.runnerWins} (${formatPercent(a.runnerWinRate)})`,
    `- Corp wins: ${a.corpWins} (${formatPercent(a.corpWinRate)})`,
    `- Action-limit games: ${a.actionLimitReached} (${formatPercent(a.actionLimitRate)})`,
    `- Average agenda points: Runner ${a.averageRunnerAgendaPoints}, Corp ${a.averageCorpAgendaPoints}`,
    `- Median agenda points: Runner ${a.medianRunnerAgendaPoints}, Corp ${a.medianCorpAgendaPoints}`,
    `- Average actions: ${a.averageActions}`,
    `- Average turns: ${a.averageTurns}`,
    `- Replay failures: ${a.replayFailures}`,
    `- Games with errors: ${a.gamesWithErrors}`,
    "",
    "## Batch Timings",
    "",
    "| Batch | Games | Duration | Seconds/Game | Runner AP | Corp AP | Limits |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...output.performance.batches.map(
      (batch) =>
        `| ${batch.batchIndex} | ${batch.fromGame}-${batch.toGame} | ${formatDuration(batch.durationMs)} | ${batch.secondsPerGame} | ${batch.averageRunnerAgendaPoints} | ${batch.averageCorpAgendaPoints} | ${batch.actionLimitReached} |`,
    ),
    "",
    "## Progression Signals",
    "",
    `- Corp score actions: ${output.progression.corpScores}`,
    `- Runner steal actions: ${output.progression.runnerSteals}`,
    `- Missed score windows: ${output.progression.missedScoreWindows}`,
    "",
    "## Why Coverage",
    "",
    `- Audit status: ${output.whyCoverage.auditStatus}`,
    `- Decisions sampled: ${output.whyCoverage.sampleCount}`,
    `- Decisions requiring WhyNot: ${output.whyCoverage.decisionsRequiringWhyNot}`,
    `- Decisions not requiring WhyNot: ${output.whyCoverage.decisionsNotRequiringWhyNot}`,
    `- Decisions with top-level WhyNot: ${output.whyCoverage.decisionsWithTopLevelWhyNot}`,
    `- Decisions missing top-level WhyNot: ${output.whyCoverage.decisionsMissingTopLevelWhyNot}`,
    `- Decisions with Runtime WhyNot section: ${output.whyCoverage.decisionsWithRuntimeWhyNotSection}`,
    `- ActionAlternatives: ${output.whyCoverage.actionAlternativeCount}`,
    `- Selected ActionAlternatives with WhyChosen: ${output.whyCoverage.selectedActionAlternativesWithWhyChosen}/${output.whyCoverage.selectedActionAlternativeCount}`,
    `- Non-selected ActionAlternatives with WhyNot: ${output.whyCoverage.nonSelectedActionAlternativesWithWhyNot}/${output.whyCoverage.nonSelectedActionAlternativeCount}`,
    `- ActionAlternatives with WhyChosen: ${output.whyCoverage.actionAlternativesWithWhyChosen}`,
    `- ActionAlternatives with WhyNot: ${output.whyCoverage.actionAlternativesWithWhyNot}`,
    `- Missing coverage signals: ${output.whyCoverage.missingCoverageSignals.length > 0 ? output.whyCoverage.missingCoverageSignals.join(", ") : "none"}`,
    "",
    "## Vergleichshinweis",
    "",
    "Diese Baseline ist ein lokaler Diagnosewert für dieselben Match-Decks mit `current_candidate` auf beiden Seiten. Für spätere Vergleiche sollten derselbe Match-Snapshot, dieselben Seeds, dieselbe Batchgröße und derselbe `maxActions`-Wert genutzt werden.",
    "",
  ].join("\n");
}

function parseArgs(argv: string[]): BaselineArgs {
  let sqlite = "data/runtime/multiplayer/netgrid.sqlite";
  let matchId: string | undefined;
  let games = 100;
  let batchSize = 5;
  let maxActions = 160;
  let seedPrefix = "latest-match-baseline";
  let out = "docs/reviews/ai/latest-match-100-game-baseline.json";
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
    out,
    ...(markdownOut ? { markdownOut } : {}),
  };
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

function formatPercent(value: number): string {
  return `${round(value * 100)}%`;
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
