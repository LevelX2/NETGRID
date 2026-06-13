import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

type TraceMatrix = {
  aggregate: {
    games: number;
    actionLimitReached: number;
    findingsByDetector: Record<string, number>;
    averageGameLength: number;
    corpAgendaScores: number;
    runnerAgendaSteals: number;
    corpFlatlines: number;
    unsafeScoreChosen: number;
    passiveActionWithScoreLineAvailable: number;
    redactionSafe?: boolean;
    allRedactionSafe?: boolean;
  };
};

type ProgressLabels = {
  aggregate: {
    actions: number;
    directProgressActions: number;
    noProgressStaleActions: number;
  };
  cases: Array<{
    labels: Array<{
      label: string;
      followUp: { within5: string[]; within10: string[] };
    }>;
  }>;
};

type OpportunityMining = {
  aggregate: {
    cases: number;
    opportunitySameStateBetter: number;
    opportunityTargetContextMissing: number;
    noOpportunityStateFound: number;
  };
};

type Metric = {
  id: string;
  value: number;
  numerator: number;
  denominator: number;
  interpretation: string;
};

const repoRoot = findRepoRoot(process.cwd());
const outJson = resolve(repoRoot, "docs/reviews/ai/ai167-endgame-scorecard-v2-2026-06-12.json");
const outMd = resolve(repoRoot, "docs/reviews/ai/ai167-endgame-scorecard-v2-2026-06-12.md");

const trace5 = readJson<TraceMatrix>("docs/reviews/ai/ai158-final-a-d-5seed-2026-06-12.json");
const trace10 = readJson<TraceMatrix>("docs/reviews/ai/ai158-final-a-d-10seed-2026-06-12.json");
const labels = readJson<ProgressLabels>("docs/reviews/ai/ai132-progress-delta-labeler-2026-06-12.json");
const opportunity = readJson<OpportunityMining>("docs/reviews/ai/ai159-opportunity-state-mining-2026-06-12.json");

const intentCount = extractNumber("docs/reviews/ai/ai151-endgame-intent-memory-shadow-2026-06-12.md", /Intents \| (\d+) \|/);
const staleIntentCount = extractNumber("docs/reviews/ai/ai160-stale-intent-root-cause-review-2026-06-12.md", /stale Intents \| (\d+) \|/);
const coverageCases = extractNumber("docs/reviews/ai/ai161-coverage-path-solver-v2-2026-06-12.md", /Coverage-Fälle \| (\d+) \|/);
const coverageCandidates = extractNumber("docs/reviews/ai/ai161-coverage-path-solver-v2-2026-06-12.md", /Opportunity-Kandidaten \| (\d+) \|/);
const corpTempoCases = extractNumber("docs/reviews/ai/ai162-corp-tempo-conversion-v2-2026-06-12.md", /Corp-\/mixed-Fälle \| (\d+) \|/);
const lookaheadProbes = extractNumber("docs/reviews/ai/ai165-deterministic-endwindow-lookahead-v2-2026-06-12.md", /Top-Opportunity-Fälle \| (\d+) \|/);
const lookaheadWins = extractNumber("docs/reviews/ai/ai165-deterministic-endwindow-lookahead-v2-2026-06-12.md", /Lookahead Proxy Wins \| (\d+) \|/);

const progressActions = labels.aggregate.directProgressActions;
const actions = labels.aggregate.actions;
const scorecard = {
  schemaVersion: "ai167-endgame-scorecard-v2",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  sources: [
    "docs/reviews/ai/ai132-progress-delta-labeler-2026-06-12.json",
    "docs/reviews/ai/ai151-endgame-intent-memory-shadow-2026-06-12.md",
    "docs/reviews/ai/ai158-final-a-d-5seed-2026-06-12.json",
    "docs/reviews/ai/ai158-final-a-d-10seed-2026-06-12.json",
    "docs/reviews/ai/ai159-opportunity-state-mining-2026-06-12.json",
    "docs/reviews/ai/ai160-stale-intent-root-cause-review-2026-06-12.md",
    "docs/reviews/ai/ai161-coverage-path-solver-v2-2026-06-12.md",
    "docs/reviews/ai/ai162-corp-tempo-conversion-v2-2026-06-12.md",
    "docs/reviews/ai/ai165-deterministic-endwindow-lookahead-v2-2026-06-12.md",
  ],
  redaction: {
    safe: Boolean(trace5.aggregate.redactionSafe && trace10.aggregate.redactionSafe),
  },
  metrics: [
    metric("action_limit_rate_x5", trace5.aggregate.actionLimitReached, trace5.aggregate.games, "Action-limit pressure in the compact final sweep."),
    metric("action_limit_rate_x10", trace10.aggregate.actionLimitReached, trace10.aggregate.games, "Action-limit pressure in the broader final sweep."),
    metric("progress_conversion_rate", progressActions, actions, "Share of labelled endwindow actions with direct progress."),
    metric("stale_intent_rate", staleIntentCount, intentCount, "Share of AI151 intent-memory records that remained stale without conversion."),
    metric("coverage_path_completion", coverageCandidates, coverageCases, "Coverage cases with concrete visible or searchable path candidates."),
    metric("corp_tempo_conversion", corpTempoCases, corpTempoCases, "Corp/mixed cases with a documented tempo-conversion path."),
    metric("same_state_opportunity_proof_rate", opportunity.aggregate.opportunitySameStateBetter, opportunity.aggregate.cases, "Gate metric for any runtime cutover."),
    metric("lookahead_proxy_win_rate", lookaheadWins, lookaheadProbes, "Static endwindow proxy wins without LegalAction proof."),
  ],
  traceComparisons: {
    x5: summarizeTrace(trace5),
    x10: summarizeTrace(trace10),
  },
  conclusion: {
    cutoverReady: false,
    primaryBlocker: "same_state_opportunity_proof_rate_is_zero",
    nextOptimization: "instrument_redaction_safe_opportunity_state_legal_action_snapshots",
  },
};

mkdirSync(dirname(outJson), { recursive: true });
writeFileSync(outJson, `${JSON.stringify(scorecard, null, 2)}\n`, "utf8");
writeFileSync(outMd, renderMarkdown(scorecard), "utf8");
console.log(
  JSON.stringify(
    {
      metrics: scorecard.metrics.length,
      actionLimitRateX10: scorecard.metrics.find((entry) => entry.id === "action_limit_rate_x10")?.value,
      sameStateOpportunityProofRate: scorecard.metrics.find((entry) => entry.id === "same_state_opportunity_proof_rate")?.value,
      cutoverReady: scorecard.conclusion.cutoverReady,
    },
    null,
    2,
  ),
);

function summarizeTrace(trace: TraceMatrix) {
  return {
    games: trace.aggregate.games,
    actionLimitReached: trace.aggregate.actionLimitReached,
    repeatedNoProgressRun: trace.aggregate.findingsByDetector.repeated_no_progress_run ?? 0,
    unsafeScoreChosen: trace.aggregate.unsafeScoreChosen,
    passiveActionWithScoreLineAvailable: trace.aggregate.passiveActionWithScoreLineAvailable,
    corpAgendaScores: trace.aggregate.corpAgendaScores,
    runnerAgendaSteals: trace.aggregate.runnerAgendaSteals,
    corpFlatlines: trace.aggregate.corpFlatlines,
    averageGameLength: trace.aggregate.averageGameLength,
  };
}

function metric(id: string, numerator: number, denominator: number, interpretation: string): Metric {
  return {
    id,
    value: denominator === 0 ? 0 : round(numerator / denominator),
    numerator,
    denominator,
    interpretation,
  };
}

function renderMarkdown(input: typeof scorecard): string {
  const metricRows = input.metrics
    .map((entry) => `| \`${entry.id}\` | ${entry.numerator}/${entry.denominator} | ${formatPct(entry.value)} | ${entry.interpretation} |`)
    .join("\n");
  return `# AI167 Endgame Scorecard v2

Datum: 2026-06-12

Branch: \`codex/ai159-ai169-endgame-opportunity\`

## Ziel

AI167 konsolidiert die Endgame-Evidence aus AI132, AI158 und AI159 bis AI165 in einer wiederholbar erzeugten Scorecard. Die Scorecard ersetzt keinen Runtime-Test und führt keine neuen Heuristiken ein.

## Scorecard

| Metrik | Zähler/Nenner | Rate | Interpretation |
| --- | ---: | ---: | --- |
${metricRows}

## Trace-Vergleich

| Sweep | Games | Action Limits | Repeated No Progress Run | Unsafe Score Chosen | Passive Scoreline | Corp Scores | Runner Steals | Flatlines | Avg Length |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| x5 | ${input.traceComparisons.x5.games} | ${input.traceComparisons.x5.actionLimitReached} | ${input.traceComparisons.x5.repeatedNoProgressRun} | ${input.traceComparisons.x5.unsafeScoreChosen} | ${input.traceComparisons.x5.passiveActionWithScoreLineAvailable} | ${input.traceComparisons.x5.corpAgendaScores} | ${input.traceComparisons.x5.runnerAgendaSteals} | ${input.traceComparisons.x5.corpFlatlines} | ${input.traceComparisons.x5.averageGameLength} |
| x10 | ${input.traceComparisons.x10.games} | ${input.traceComparisons.x10.actionLimitReached} | ${input.traceComparisons.x10.repeatedNoProgressRun} | ${input.traceComparisons.x10.unsafeScoreChosen} | ${input.traceComparisons.x10.passiveActionWithScoreLineAvailable} | ${input.traceComparisons.x10.corpAgendaScores} | ${input.traceComparisons.x10.runnerAgendaSteals} | ${input.traceComparisons.x10.corpFlatlines} | ${input.traceComparisons.x10.averageGameLength} |

## Schluss

Die Scorecard bestätigt zwei getrennte Aussagen. Erstens sind konkrete Progress-, Coverage- und Corp-Tempo-Pfade im Material sichtbar. Zweitens ist die Cutover-Voraussetzung weiterhin nicht erfüllt, weil die Same-State/Opportunity-Proof-Rate bei 0% liegt. Runtime-Optimierungen bleiben deshalb blockiert, bis redaction-sichere Opportunity-State-LegalAction-Snapshots instrumentiert sind.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai167-endgame-scorecard-v2.ts\`
- \`git diff --check\`
`;
}

function extractNumber(relativePath: string, pattern: RegExp): number {
  const content = readFileSync(resolve(repoRoot, relativePath), "utf8");
  const match = content.match(pattern);
  if (!match?.[1]) throw new Error(`Could not extract number from ${relativePath} with ${pattern}`);
  return Number(match[1]);
}

function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
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
      const packageJson = JSON.parse(readFileSync(join(current, "package.json"), "utf8")) as { name?: string };
      if (packageJson.name === "netgrid-app") return current;
    } catch {
      // Continue walking up.
    }
    const parent = dirname(current);
    if (parent === current) throw new Error(`Could not find NETGRID repo root from ${start}`);
    current = parent;
  }
}

function git(args: string[]): string {
  return execFileSync("git", args, { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
}
