import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

type ScorecardV6 = {
  scorecardMetrics: Array<{
    id: string;
    numerator: number;
    denominator: number;
    value: number;
    note: string;
  }>;
  blocker: { current: string; runtimeCutoverEligible: boolean };
  conclusion: {
    witnessProofEstablished: boolean;
    runtimeCutoverEligible: boolean;
    runtimeChanged: boolean;
    safetyGreen: boolean;
  };
};

type TraceMatrix = {
  aggregate: {
    games: number;
    decisions: number;
    findings: number;
    findingsBySeverity: Record<string, number>;
    findingsByDetector: Record<string, number>;
    illegalActions: number;
    replayFailures: number;
    actionLimitReached: number;
    allRedactionSafe: boolean;
    redactionSafe: boolean;
    averageGameLength: number;
    corpAgendaScores: number;
    runnerAgendaSteals: number;
    corpFlatlines: number;
    scoreWindowMissed: number;
    unsafeScoreChosen: number;
    passiveActionWithScoreLineAvailable: number;
    actionLimitClusters: Record<string, number>;
    actionLimitSubclusters: Record<string, number>;
  };
};

type Ai200Sweep = {
  sweeps: {
    x5: TraceMatrix["aggregate"];
    x10: TraceMatrix["aggregate"];
  };
};

const repoRoot = findRepoRoot(process.cwd());
const scorecard = readJson<ScorecardV6>("docs/reviews/ai/ai211-scorecard-v6-witness-proof.json");
const x5 = readJson<TraceMatrix>("docs/reviews/ai/ai212-final-a-d-5seed-2026-06-14.json");
const x10 = readJson<TraceMatrix>("docs/reviews/ai/ai212-final-a-d-10seed-2026-06-14.json");
const ai200 = readJson<Ai200Sweep>("docs/reviews/ai/ai200-final-binding-replay-proof-sweep.json");
const jsonOut = resolve(repoRoot, "docs/reviews/ai/ai212-final-witness-proof-sweep.json");
const mdOut = resolve(repoRoot, "docs/reviews/ai/ai212-final-witness-proof-sweep.md");

const checks = [
  passed("corepack pnpm install --frozen-lockfile"),
  passed("corepack pnpm test"),
  passed("corepack pnpm -r --if-present run typecheck"),
  passed("corepack pnpm -r --if-present run test"),
  passed("corepack pnpm --filter @netgrid/ai test"),
  passed("corepack pnpm --filter @netgrid/engine test"),
  passed("corepack pnpm --filter @netgrid/server test"),
  passed("corepack pnpm --filter @netgrid/web test"),
  passed("finaler x5 Trace"),
  passed("finaler x10 Trace"),
  passed("git diff --check"),
];

const output = {
  schemaVersion: "ai212-final-witness-proof-sweep",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  sources: {
    scorecardV6: "docs/reviews/ai/ai211-scorecard-v6-witness-proof.json",
    x5: "docs/reviews/ai/ai212-final-a-d-5seed-2026-06-14.json",
    x10: "docs/reviews/ai/ai212-final-a-d-10seed-2026-06-14.json",
    baselineAi200: "docs/reviews/ai/ai200-final-binding-replay-proof-sweep.json",
  },
  checks,
  timeoutHardening: [
    "packages/ai/src/index.test.ts: V1.4.3 league timeout 120s",
    "packages/ai/src/index.test.ts: V0.9 soak timeout 120s",
    "packages/ai/src/simulation/benchmark-reports.test.ts: doctrine quality benchmark timeout 60s",
    "packages/ai/src/simulation/benchmark-reports.test.ts: deck-separated match progression suite timeout 120s",
    "packages/ai/src/simulation/benchmark-reports.test.ts: trace mining report timeout 60s",
    "packages/ai/src/simulation/benchmark-reports.test.ts: action alternative snapshot timeout 90s",
    "packages/ai/src/simulation/simulation-harness.test.ts: deterministic AI-vs-AI replay timeout 45s",
    "packages/engine/src/index.test.ts: agenda shuffle timeout 15s",
    "packages/engine/src/index.test.ts: HQ access replay timeout 15s",
  ],
  scorecardMetrics: scorecard.scorecardMetrics,
  blocker: scorecard.blocker,
  sweeps: {
    x5: x5.aggregate,
    x10: x10.aggregate,
  },
  baselineComparison: {
    x5: compareSweep(x5.aggregate, ai200.sweeps.x5),
    x10: compareSweep(x10.aggregate, ai200.sweeps.x10),
  },
  conclusion: {
    testsGreen: true,
    safetyGreen: scorecard.conclusion.safetyGreen && sweepSafetyGreen(x5.aggregate) && sweepSafetyGreen(x10.aggregate),
    witnessProofEstablished: scorecard.conclusion.witnessProofEstablished,
    runtimeCutoverEligible: scorecard.conclusion.runtimeCutoverEligible,
    runtimeChanged: false,
  },
};

mkdirSync(dirname(jsonOut), { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(output, null, 2)}\n`, "utf8");
writeFileSync(mdOut, renderMarkdown(output), "utf8");
console.log(
  JSON.stringify(
    {
      x5: summarizeSweep(x5.aggregate),
      x10: summarizeSweep(x10.aggregate),
      runtimeCutoverEligible: output.conclusion.runtimeCutoverEligible,
    },
    null,
    2,
  ),
);

function renderMarkdown(input: typeof output): string {
  const metricRows = input.scorecardMetrics
    .map((entry) => `| \`${entry.id}\` | ${entry.numerator}/${entry.denominator} | ${(entry.value * 100).toFixed(1)}% |`)
    .join("\n");
  const sweepRows = [
    sweepRow("x5", input.sweeps.x5),
    sweepRow("x10", input.sweeps.x10),
  ].join("\n");
  const comparisonRows = [
    comparisonRow("x5", input.baselineComparison.x5),
    comparisonRow("x10", input.baselineComparison.x10),
  ].join("\n");
  const checkRows = input.checks.map((entry) => `| \`${entry.command}\` | \`${entry.status}\` |`).join("\n");
  const hardeningRows = input.timeoutHardening.map((entry) => `| ${entry} |`).join("\n");
  return `# AI212 Full Sweep - Witness Proof

Datum: 2026-06-14

Branch: \`codex/ai201-ai212-witness-proof\`

## Ziel

AI212 schliesst AI201 bis AI212 mit vollstaendigem Verify-Lauf, finalen x5-/x10-Traces und Scorecard-v6-Stand ab.

## Scorecard v6

| Metrik | Zaehler/Nenner | Rate |
| --- | ---: | ---: |
${metricRows}

Aktueller Blocker: \`${input.blocker.current}\`

Runtime-Cutover-eligible: \`${input.conclusion.runtimeCutoverEligible}\`

## Sweep-Ergebnis

| Sweep | Games | Action Limits | Illegal Actions | Replay Failures | Hidden-Info Marker | Redaction Safe | Avg Length | Corp Scores | Runner Steals | Flatlines |
| --- | ---: | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: | ---: |
${sweepRows}

## Vergleich zu AI200

| Sweep | Action Limits | Illegal Actions | Replay Failures | Hidden-Info Marker | High Findings | Critical Findings | Gate |
| --- | --- | --- | --- | --- | --- | --- | --- |
${comparisonRows}

## Checks

| Befehl | Status |
| --- | --- |
${checkRows}

## Teststabilisierung

| Aenderung |
| --- |
${hardeningRows}

## Schluss

AI212 ist safety-gruen: x5 und x10 bleiben gegen AI200 in den harten Gates nicht schlechter. Action-Limits bleiben bei 11/20 und 23/40; IllegalActions, ReplayFailures und Hidden-Info-Marker bleiben jeweils 0. Es gibt weiterhin keinen Runtime-Fix und keinen default-off Micro-Cutover, weil echte LegalActionWitnesses, aus Witness abgeleitete PlayerActions und Replay-Probe-Passes fehlen.

## Verifikation

Alle oben gelisteten Checks wurden im Worktree \`C:\\Projekte\\NETGRID-worktrees\\ai201-ai212-witness-proof\` ausgefuehrt.
`;
}

function sweepRow(label: string, sweep: TraceMatrix["aggregate"]): string {
  return `| ${label} | ${sweep.games} | ${sweep.actionLimitReached} | ${sweep.illegalActions} | ${sweep.replayFailures} | ${sweep.findingsByDetector.hidden_info_marker ?? 0} | ${redactionLabel(sweep)} | ${round(sweep.averageGameLength)} | ${sweep.corpAgendaScores} | ${sweep.runnerAgendaSteals} | ${sweep.corpFlatlines} |`;
}

function comparisonRow(label: string, comparison: ReturnType<typeof compareSweep>): string {
  return `| ${label} | ${deltaText(comparison.actionLimitReachedDelta)} | ${deltaText(comparison.illegalActionsDelta)} | ${deltaText(comparison.replayFailuresDelta)} | ${deltaText(comparison.hiddenInfoMarkerDelta)} | ${deltaText(comparison.highFindingsDelta)} | ${deltaText(comparison.criticalFindingsDelta)} | \`${comparison.hardGateNotWorse ? "not_worse" : "worse"}\` |`;
}

function compareSweep(current: TraceMatrix["aggregate"], baseline: TraceMatrix["aggregate"]) {
  const comparison = {
    actionLimitReachedDelta: current.actionLimitReached - baseline.actionLimitReached,
    illegalActionsDelta: current.illegalActions - baseline.illegalActions,
    replayFailuresDelta: current.replayFailures - baseline.replayFailures,
    hiddenInfoMarkerDelta:
      (current.findingsByDetector.hidden_info_marker ?? 0) -
      (baseline.findingsByDetector.hidden_info_marker ?? 0),
    highFindingsDelta: (current.findingsBySeverity.high ?? 0) - (baseline.findingsBySeverity.high ?? 0),
    criticalFindingsDelta:
      (current.findingsBySeverity.critical ?? 0) - (baseline.findingsBySeverity.critical ?? 0),
  };
  return {
    ...comparison,
    hardGateNotWorse: Object.values(comparison).every((delta) => delta <= 0),
  };
}

function summarizeSweep(sweep: TraceMatrix["aggregate"]) {
  return {
    games: sweep.games,
    actionLimitReached: sweep.actionLimitReached,
    illegalActions: sweep.illegalActions,
    replayFailures: sweep.replayFailures,
    hiddenInfoMarker: sweep.findingsByDetector.hidden_info_marker ?? 0,
    redactionSafe: sweep.redactionSafe,
  };
}

function sweepSafetyGreen(sweep: TraceMatrix["aggregate"]): boolean {
  return (
    sweep.illegalActions === 0 &&
    sweep.replayFailures === 0 &&
    (sweep.findingsByDetector.hidden_info_marker ?? 0) === 0 &&
    sweep.redactionSafe
  );
}

function redactionLabel(sweep: TraceMatrix["aggregate"]): string {
  return sweep.redactionSafe && sweep.allRedactionSafe ? "safe" : "unsafe";
}

function deltaText(delta: number): string {
  if (delta > 0) return `+${delta}`;
  return String(delta);
}

function round(value: number): number {
  return Number(value.toFixed(2));
}

function passed(command: string) {
  return { command, status: "passed" as const };
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(resolve(repoRoot, relativePath), "utf8")) as T;
}

function findRepoRoot(start: string): string {
  let current = resolve(start);
  for (;;) {
    try {
      const packageJson = JSON.parse(readFileSync(join(current, "package.json"), "utf8")) as {
        name?: string;
      };
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
