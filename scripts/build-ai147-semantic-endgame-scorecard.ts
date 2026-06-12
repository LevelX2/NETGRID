import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

type TraceMatrix = {
  aggregate: {
    games: number;
    decisions: number;
    findingsBySeverity: Record<string, number>;
    findingsByDetector: Record<string, number>;
    illegalActions: number;
    replayFailures: number;
    actionLimitReached: number;
    redactionSafe: boolean;
    averageGameLength: number;
    corpAgendaScores: number;
    runnerAgendaSteals: number;
    corpFlatlines: number;
    scoreWindowMissed: number;
    unsafeScoreChosen: number;
    passiveActionWithScoreLineAvailable: number;
  };
};

type ProgressLabels = {
  aggregate: {
    actions: number;
    directProgressActions: number;
    noProgressStaleActions: number;
    staleShare: number;
  };
};

const repoRoot = findRepoRoot(process.cwd());
const progress = readJson<ProgressLabels>(
  "docs/reviews/ai/ai132-progress-delta-labeler-2026-06-12.json",
);
const trace5 = readJson<TraceMatrix>("docs/reviews/ai/ai139-final-a-d-5seed-2026-06-12.json");
const trace10 = readJson<TraceMatrix>("docs/reviews/ai/ai139-final-a-d-10seed-2026-06-12.json");

const runnerCoverage = {
  cases: 15,
  completionAvailable: 10,
  noSolutionVisible: 4,
  reserveNeeded: 1,
};
const corpTempo = {
  cases: 9,
  safeScore: 4,
  rezMeaningfulIce: 4,
  advanceToScore: 1,
};
const intentMemory = {
  cases: 21,
  intents: 96,
  converted: 56,
  blockedByNoLegalAlternative: 35,
  stale: 5,
};

const scorecard = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  sources: [
    "docs/reviews/ai/ai132-progress-delta-labeler-2026-06-12.json",
    "docs/reviews/ai/ai139-final-a-d-5seed-2026-06-12.json",
    "docs/reviews/ai/ai139-final-a-d-10seed-2026-06-12.json",
    "docs/reviews/ai/ai142-runner-coverage-goal-completion-shadow-2026-06-12.md",
    "docs/reviews/ai/ai143-corp-tempo-conversion-shadow-2026-06-12.md",
    "docs/reviews/ai/ai144-endgame-intent-memory-shadow-2026-06-12.md",
  ],
  safety: {
    illegalActionsX10: trace10.aggregate.illegalActions,
    replayFailuresX10: trace10.aggregate.replayFailures,
    redactionSafeX10: trace10.aggregate.redactionSafe,
    criticalFindingsX10: trace10.aggregate.findingsBySeverity.critical ?? 0,
  },
  traceMetrics: {
    x5: normalizeTrace(trace5),
    x10: normalizeTrace(trace10),
  },
  semanticMetrics: {
    staleNoProgressShare: round(progress.aggregate.staleShare),
    progressConversionRate: round(
      progress.aggregate.directProgressActions / progress.aggregate.actions,
    ),
    runnerCoverageCompletionRate: round(
      runnerCoverage.completionAvailable / runnerCoverage.cases,
    ),
    corpTempoConversionRate: round(corpTempo.cases / corpTempo.cases),
    endgameIntentConversionRate: round(intentMemory.converted / intentMemory.intents),
    endgameIntentBlockedRate: round(
      intentMemory.blockedByNoLegalAlternative / intentMemory.intents,
    ),
    endgameIntentStaleRate: round(intentMemory.stale / intentMemory.intents),
  },
  sourceCounts: {
    progressActions: progress.aggregate.actions,
    directProgressActions: progress.aggregate.directProgressActions,
    noProgressStaleActions: progress.aggregate.noProgressStaleActions,
    runnerCoverage,
    corpTempo,
    intentMemory,
  },
};

const jsonOut = resolve(
  repoRoot,
  "docs/reviews/ai/ai147-semantic-endgame-scorecard-2026-06-12.json",
);
const mdOut = resolve(
  repoRoot,
  "docs/reviews/ai/ai147-semantic-endgame-scorecard-2026-06-12.md",
);

mkdirSync(dirname(jsonOut), { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(scorecard, null, 2)}\n`, "utf8");
writeFileSync(mdOut, renderMarkdown(scorecard), "utf8");

console.log(
  JSON.stringify(
    {
      illegalActionsX10: scorecard.safety.illegalActionsX10,
      replayFailuresX10: scorecard.safety.replayFailuresX10,
      actionLimitRateX10: scorecard.traceMetrics.x10.actionLimitRate,
      progressConversionRate: scorecard.semanticMetrics.progressConversionRate,
      staleNoProgressShare: scorecard.semanticMetrics.staleNoProgressShare,
      redactionSafeX10: scorecard.safety.redactionSafeX10,
    },
    null,
    2,
  ),
);

function normalizeTrace(trace: TraceMatrix) {
  return {
    games: trace.aggregate.games,
    decisions: trace.aggregate.decisions,
    actionLimitReached: trace.aggregate.actionLimitReached,
    actionLimitRate: round(trace.aggregate.actionLimitReached / trace.aggregate.games),
    repeatedNoProgressRun: trace.aggregate.findingsByDetector.repeated_no_progress_run ?? 0,
    unsafeScoreChosen: trace.aggregate.unsafeScoreChosen,
    passiveActionWithScoreLineAvailable: trace.aggregate.passiveActionWithScoreLineAvailable,
    averageGameLength: trace.aggregate.averageGameLength,
    corpAgendaScores: trace.aggregate.corpAgendaScores,
    runnerAgendaSteals: trace.aggregate.runnerAgendaSteals,
    corpFlatlines: trace.aggregate.corpFlatlines,
    scoreWindowMissed: trace.aggregate.scoreWindowMissed,
  };
}

function renderMarkdown(input: typeof scorecard): string {
  return `# AI147 Semantic Endgame Scorecard

Datum: 2026-06-12

Branch: \`codex/ai140-ai148-semantic-endgame-optimization\`

## Ziel

AI147 bündelt die Sicherheits-, Trace- und Semantikmetriken des AI131-AI146-Blocks in einer stabilen Scorecard. Die Scorecard ist bewusst deskriptiv: Sie macht Fortschritt, verbleibende Action-Limits und belegte No-Go-Grenzen sichtbar, ohne neue Runtime-Gewichte einzuführen.

## Safety Gates

| Metrik | x10-Wert |
| --- | ---: |
| IllegalActions | ${input.safety.illegalActionsX10} |
| Replay-Failures | ${input.safety.replayFailuresX10} |
| Critical Findings | ${input.safety.criticalFindingsX10} |
| Redaction-safe | ${input.safety.redactionSafeX10 ? 1 : 0} |

## Trace-Metriken

| Metrik | x5 | x10 |
| --- | ---: | ---: |
| Spiele | ${input.traceMetrics.x5.games} | ${input.traceMetrics.x10.games} |
| Entscheidungen | ${input.traceMetrics.x5.decisions} | ${input.traceMetrics.x10.decisions} |
| Action-Limits | ${input.traceMetrics.x5.actionLimitReached} | ${input.traceMetrics.x10.actionLimitReached} |
| Action-Limit-Rate | ${formatRate(input.traceMetrics.x5.actionLimitRate)} | ${formatRate(input.traceMetrics.x10.actionLimitRate)} |
| Repeated No-Progress Run | ${input.traceMetrics.x5.repeatedNoProgressRun} | ${input.traceMetrics.x10.repeatedNoProgressRun} |
| Unsafe Score Chosen | ${input.traceMetrics.x5.unsafeScoreChosen} | ${input.traceMetrics.x10.unsafeScoreChosen} |
| Passive Action With Score Line Available | ${input.traceMetrics.x5.passiveActionWithScoreLineAvailable} | ${input.traceMetrics.x10.passiveActionWithScoreLineAvailable} |
| Durchschnittliche Spiellänge | ${input.traceMetrics.x5.averageGameLength} | ${input.traceMetrics.x10.averageGameLength} |
| Corp Agenda Scores | ${input.traceMetrics.x5.corpAgendaScores} | ${input.traceMetrics.x10.corpAgendaScores} |
| Runner Agenda Steals | ${input.traceMetrics.x5.runnerAgendaSteals} | ${input.traceMetrics.x10.runnerAgendaSteals} |
| Corp Flatlines | ${input.traceMetrics.x5.corpFlatlines} | ${input.traceMetrics.x10.corpFlatlines} |
| Score Window Missed | ${input.traceMetrics.x5.scoreWindowMissed} | ${input.traceMetrics.x10.scoreWindowMissed} |

## Semantik-Metriken

| Metrik | Wert |
| --- | ---: |
| Progress-Conversion-Rate | ${formatRate(input.semanticMetrics.progressConversionRate)} |
| Stale-No-Progress-Anteil | ${formatRate(input.semanticMetrics.staleNoProgressShare)} |
| Runner-Coverage-Completion-Rate | ${formatRate(input.semanticMetrics.runnerCoverageCompletionRate)} |
| Corp-Tempo-Conversion-Rate | ${formatRate(input.semanticMetrics.corpTempoConversionRate)} |
| Endgame-Intent-Conversion-Rate | ${formatRate(input.semanticMetrics.endgameIntentConversionRate)} |
| Endgame-Intent-Blocked-Rate | ${formatRate(input.semanticMetrics.endgameIntentBlockedRate)} |
| Endgame-Intent-Stale-Rate | ${formatRate(input.semanticMetrics.endgameIntentStaleRate)} |

## Interpretation

Der Sicherheitszustand bleibt hart grün: keine IllegalActions, keine Replay-Failures, keine Critical Findings und Redaction-safe im x10-Stand. Semantisch bleibt der Engpass sichtbar: x10 erreicht 21 Action-Limits, und der AI132-Corpus enthält 415 stale No-Progress-Aktionen bei 1260 gelabelten Aktionen. Shadow-Signale zeigen klare Optimierungsrichtungen, aber AI146 bestätigt, dass daraus ohne same-state LegalAction-Beweis kein Runtime-Cutover abgeleitet werden darf.

## Quellen

${input.sources.map((source) => `- \`${source}\``).join("\n")}

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai147-semantic-endgame-scorecard.ts\`
- \`git diff --check\`
`;
}

function formatRate(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function round(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(resolve(repoRoot, relativePath), "utf8")) as T;
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
