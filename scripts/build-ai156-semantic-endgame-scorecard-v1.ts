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

type SameStateProbe = {
  aggregate: {
    candidates: number;
    sameStateLegalBetter: number;
    sameStateMatches: number;
  };
};

const repoRoot = findRepoRoot(process.cwd());
const progress = readJson<ProgressLabels>(
  "docs/reviews/ai/ai132-progress-delta-labeler-2026-06-12.json",
);
const trace5 = readJson<TraceMatrix>("docs/reviews/ai/ai148-final-a-d-5seed-2026-06-12.json");
const trace10 = readJson<TraceMatrix>("docs/reviews/ai/ai148-final-a-d-10seed-2026-06-12.json");
const sameState = readJson<SameStateProbe>(
  "docs/reviews/ai/ai149-same-state-challenger-probe-2026-06-12.json",
);

const coverage = {
  cases: 15,
  coverageCompletion: 10,
};
const corpTempo = {
  cases: 20,
  converted: 20,
};

const scorecard = {
  schemaVersion: "ai156-semantic-endgame-scorecard-v1",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  sources: [
    "docs/reviews/ai/ai132-progress-delta-labeler-2026-06-12.json",
    "docs/reviews/ai/ai148-final-a-d-5seed-2026-06-12.json",
    "docs/reviews/ai/ai148-final-a-d-10seed-2026-06-12.json",
    "docs/reviews/ai/ai149-same-state-challenger-probe-2026-06-12.json",
    "docs/reviews/ai/ai152-runner-coverage-solver-shadow-2026-06-12.md",
    "docs/reviews/ai/ai153-corp-tempo-converter-shadow-2026-06-12.md",
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
    coverageCompletionRate: round(coverage.coverageCompletion / coverage.cases),
    corpTempoConversionRate: round(corpTempo.converted / corpTempo.cases),
    sameStateChallengerProofRate: round(
      sameState.aggregate.sameStateLegalBetter / sameState.aggregate.candidates,
    ),
    sameStateMatchRate: round(sameState.aggregate.sameStateMatches / sameState.aggregate.candidates),
  },
};

const jsonOut = resolve(repoRoot, "docs/reviews/ai/ai156-semantic-endgame-scorecard-v1.json");
const mdOut = resolve(
  repoRoot,
  "docs/reviews/ai/ai156-semantic-endgame-scorecard-v1-2026-06-12.md",
);

mkdirSync(dirname(jsonOut), { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(scorecard, null, 2)}\n`, "utf8");
writeFileSync(mdOut, renderMarkdown(scorecard), "utf8");
console.log(
  JSON.stringify(
    {
      actionLimitRateX10: scorecard.traceMetrics.x10.actionLimitRate,
      sameStateChallengerProofRate: scorecard.semanticMetrics.sameStateChallengerProofRate,
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
    runnerAgendaSteals: trace.aggregate.runnerAgendaSteals,
    corpAgendaScores: trace.aggregate.corpAgendaScores,
    corpFlatlines: trace.aggregate.corpFlatlines,
  };
}

function renderMarkdown(input: typeof scorecard): string {
  return `# AI156 Semantic Endgame Scorecard v1

Datum: 2026-06-12

Branch: \`codex/ai149-ai158-same-state-semantic-endgame\`

## Ziel

AI156 ergänzt eine Spielstärke-Scorecard, damit künftige Pakete nicht allein \`actionLimitReached\` optimieren. Die Scorecard verbindet Safety, Trace-Stabilität, Progress-Konversion, Coverage-/Tempo-Shadow-Signale und den same-state Proof-Stand.

## Safety Summary

| Metrik | x10 |
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
| Average Game Length | ${input.traceMetrics.x5.averageGameLength} | ${input.traceMetrics.x10.averageGameLength} |
| Runner Steals | ${input.traceMetrics.x5.runnerAgendaSteals} | ${input.traceMetrics.x10.runnerAgendaSteals} |
| Corp Scores | ${input.traceMetrics.x5.corpAgendaScores} | ${input.traceMetrics.x10.corpAgendaScores} |
| Corp Flatlines | ${input.traceMetrics.x5.corpFlatlines} | ${input.traceMetrics.x10.corpFlatlines} |

## Semantik-Metriken

| Metrik | Wert |
| --- | ---: |
| Stale-No-Progress-Anteil | ${formatRate(input.semanticMetrics.staleNoProgressShare)} |
| Progress-Conversion-Rate | ${formatRate(input.semanticMetrics.progressConversionRate)} |
| Coverage-Completion-Rate | ${formatRate(input.semanticMetrics.coverageCompletionRate)} |
| Corp-Tempo-Conversion-Rate | ${formatRate(input.semanticMetrics.corpTempoConversionRate)} |
| Same-State Challenger-Proof-Rate | ${formatRate(input.semanticMetrics.sameStateChallengerProofRate)} |
| Same-State Match-Rate | ${formatRate(input.semanticMetrics.sameStateMatchRate)} |

## Interpretation

Safety bleibt grün, aber die same-state Proof-Rate ist 0.00%. Das ist die maßgebliche Grenze für Runtime-Arbeit: Die Shadow-Signale zeigen konkrete Coverage- und Corp-Tempo-Pfade, aber kein produktiver Cutover darf daraus ohne same-state LegalAction-Beweis abgeleitet werden.

## Quellen

${input.sources.map((source) => `- \`${source}\``).join("\n")}

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai156-semantic-endgame-scorecard-v1.ts\`
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
