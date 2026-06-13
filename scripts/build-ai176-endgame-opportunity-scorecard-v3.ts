import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

type Metric = { id: string; numerator: number; denominator: number; value: number; note: string };

const repoRoot = findRepoRoot(process.cwd());
const ai170 = readJson<any>("docs/reviews/ai/ai170-opportunity-state-snapshots-2026-06-13.json");
const ai172 = readJson<any>("docs/reviews/ai/ai172-goal-conversion-contract-v1-2026-06-13.json");
const ai173 = readJson<any>("docs/reviews/ai/ai173-runner-coverage-opportunity-solver-2026-06-13.json");
const ai174 = readJson<any>("docs/reviews/ai/ai174-corp-tag-punish-stale-intent-review-2026-06-13.json");
const ai175 = readJson<any>("docs/reviews/ai/ai175-corp-tempo-opportunity-solver-2026-06-13.json");
const ai169x5 = readJson<any>("docs/reviews/ai/ai169-final-a-d-5seed-2026-06-12.json");
const ai170x10 = readJson<any>("docs/reviews/ai/ai170-source-x10-alternatives-2026-06-13.json");
const jsonOut = resolve(repoRoot, "docs/reviews/ai/ai176-endgame-opportunity-scorecard-v3.json");
const mdOut = resolve(repoRoot, "docs/reviews/ai/ai176-endgame-opportunity-scorecard-v3.md");

const metrics: Metric[] = [
  metric("opportunity_snapshot_available_rate", ai170.aggregate.availableSnapshots, ai170.aggregate.requestedSnapshots, "AI170 requested snapshot coverage."),
  metric("same_state_better_rate", 0, ai170.aggregate.cases, "No Runtime-eligible same-state better candidate has passed the gate yet."),
  metric("target_context_missing_rate", 2, ai170.aggregate.cases, "AI159 target-context-missing cases before AI170 instrumentation."),
  metric("stale_intent_rate", ai172.aggregate.staleIntents, 122, "AI151/AI172 stale intents against intent-memory records."),
  metric("stale_punish_intent_rate", ai174.aggregate.cases, ai172.aggregate.staleIntents, "Share of stale intents in corp tag/punish."),
  metric("coverage_path_solved_rate", ai173.aggregate.cutoverCandidates, ai173.aggregate.cases, "Coverage solver shadow candidates before AI177 gate."),
  metric("corp_tempo_conversion_solved_rate", ai175.aggregate.cutoverCandidates, ai175.aggregate.cases, "Corp tempo solver shadow candidates before AI177 gate."),
  metric("lookahead_candidate_rate", 7, 10, "AI165 static lookahead proxy wins."),
  metric("runtime_cutover_eligibility_count", 0, 1, "AI177/AI178 have not yet approved a Runtime candidate."),
  metric("action_limit_rate_x5", ai169x5.aggregate.actionLimitReached, ai169x5.aggregate.games, "Baseline x5 action-limit rate."),
  metric("action_limit_rate_x10", ai170x10.aggregate.actionLimitReached, ai170x10.aggregate.games, "Current x10 action-limit rate with snapshot instrumentation."),
];

const output = {
  schemaVersion: "ai176-endgame-opportunity-scorecard-v3",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  sources: [
    "docs/reviews/ai/ai170-opportunity-state-snapshots-2026-06-13.json",
    "docs/reviews/ai/ai172-goal-conversion-contract-v1-2026-06-13.json",
    "docs/reviews/ai/ai173-runner-coverage-opportunity-solver-2026-06-13.json",
    "docs/reviews/ai/ai174-corp-tag-punish-stale-intent-review-2026-06-13.json",
    "docs/reviews/ai/ai175-corp-tempo-opportunity-solver-2026-06-13.json",
  ],
  metrics,
  conclusion: {
    runtimeCutoverEligible: false,
    gateReason: "candidate_gate_not_yet_run_and_same_state_better_rate_zero",
  },
};

mkdirSync(dirname(jsonOut), { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(output, null, 2)}\n`, "utf8");
writeFileSync(mdOut, renderMarkdown(output), "utf8");
console.log(JSON.stringify({ metrics: metrics.length, runtimeCutoverEligible: false }, null, 2));

function metric(id: string, numerator: number, denominator: number, note: string): Metric {
  return {
    id,
    numerator,
    denominator,
    value: denominator === 0 ? 0 : Math.round((numerator / denominator) * 10_000) / 10_000,
    note,
  };
}

function renderMarkdown(input: typeof output): string {
  const rows = input.metrics
    .map((entry) => `| \`${entry.id}\` | ${entry.numerator}/${entry.denominator} | ${(entry.value * 100).toFixed(1)}% | ${entry.note} |`)
    .join("\n");
  return `# AI176 Endgame Opportunity Scorecard v3

Datum: 2026-06-13

Branch: \`codex/ai170-ai180-opportunity-snapshots\`

## Ziel

AI176 erweitert die Endgame-Scorecard um Opportunity-, Snapshot- und Intent-Metriken. Die Scorecard zeigt nicht nur Action-Limits, sondern ob ein Runtime-Cutover belegbar ist.

## Scorecard

| Metrik | Zähler/Nenner | Rate | Hinweis |
| --- | ---: | ---: | --- |
${rows}

## Schluss

Die Snapshot-Verfügbarkeit ist deutlich besser als in AI159, aber Runtime-Cutover ist weiterhin nicht freigegeben. AI173 und AI175 liefern nur shadow-only Kandidaten. Erst AI177 kann daraus gate-positive Kandidaten machen; bis dahin bleibt \`runtime_cutover_eligibility_count\` bei 0.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai176-endgame-opportunity-scorecard-v3.ts\`
- \`git diff --check\`
`;
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
