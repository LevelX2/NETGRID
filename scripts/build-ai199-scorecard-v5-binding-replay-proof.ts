import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

type Metric = {
  id: string;
  numerator: number;
  denominator: number;
  value: number;
  note: string;
};

const repoRoot = findRepoRoot(process.cwd());
const ai191 = readJson<any>("docs/reviews/ai/ai191-candidate-path-bindings-v1.json");
const ai192 = readJson<any>("docs/reviews/ai/ai192-target-identity-v2-candidate-paths.json");
const ai193 = readJson<any>("docs/reviews/ai/ai193-playeraction-dry-run-builder.json");
const ai194 = readJson<any>("docs/reviews/ai/ai194-playeraction-replay-probe-v2.json");
const ai195 = readJson<any>("docs/reviews/ai/ai195-stale-punish-replacement-shadow.json");
const ai196 = readJson<any>("docs/reviews/ai/ai196-coverage-candidate-binding-review.json");
const ai197 = readJson<any>("docs/reviews/ai/ai197-corp-tempo-candidate-binding-review.json");
const ai198 = readJson<any>("docs/reviews/ai/ai198-opportunity-micro-cutover-experiment.json");
const jsonOut = resolve(repoRoot, "docs/reviews/ai/ai199-scorecard-v5-binding-replay-proof.json");
const mdOut = resolve(repoRoot, "docs/reviews/ai/ai199-scorecard-v5-binding-replay-proof.md");

const metrics: Metric[] = [
  metric(
    "candidate_path_binding_rate",
    ai191.aggregate.boundBindings,
    ai191.aggregate.bindings,
    "Share of CandidatePathBindings with signature, action reference, no hard gate and non-blocking target seed.",
  ),
  metric(
    "target_identity_complete_rate",
    ai192.aggregate.completeOrIrrelevant,
    ai192.aggregate.candidatePathBindings,
    "Share of CandidatePathBindings with complete or irrelevant TargetIdentity v2.",
  ),
  metric(
    "dry_run_build_rate",
    ai193.aggregate.dryRunBuilt,
    ai193.aggregate.candidatePathBindings,
    "Share of bindings that build a structural PlayerAction in the test-only dry-run builder.",
  ),
  metric(
    "replay_probe_pass_rate",
    ai194.aggregate.replayProbed,
    ai194.aggregate.candidates,
    "Share of candidates with a successful PlayerAction replay probe.",
  ),
  metric(
    "coverage_binding_candidate_rate",
    ai196.cases.filter((entry: any) => entry.candidatePathBindings > 0).length,
    ai196.aggregate.cases,
    "Share of Coverage cases with at least one CandidatePathBinding.",
  ),
  metric(
    "corp_tempo_binding_candidate_rate",
    ai197.cases.filter((entry: any) => entry.candidatePathBindings > 0).length,
    ai197.aggregate.cases,
    "Share of Corp-Tempo cases with at least one CandidatePathBinding.",
  ),
  metric(
    "stale_punish_replacement_candidate_rate",
    ai195.aggregate.replacementCandidates,
    ai195.aggregate.stalePunishCases,
    "Share of stale punish cases with a shadow replacement-goal candidate.",
  ),
  metric(
    "runtime_flagged_candidate_count",
    ai198.aggregate.runtimeFlaggedCandidateCount,
    1,
    "Count-like gate for any default-off opportunity micro-cutover candidate.",
  ),
];

const output = {
  schemaVersion: "ai199-scorecard-v5-binding-replay-proof",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  sources: [
    "docs/reviews/ai/ai191-candidate-path-bindings-v1.json",
    "docs/reviews/ai/ai192-target-identity-v2-candidate-paths.json",
    "docs/reviews/ai/ai193-playeraction-dry-run-builder.json",
    "docs/reviews/ai/ai194-playeraction-replay-probe-v2.json",
    "docs/reviews/ai/ai195-stale-punish-replacement-shadow.json",
    "docs/reviews/ai/ai196-coverage-candidate-binding-review.json",
    "docs/reviews/ai/ai197-corp-tempo-candidate-binding-review.json",
    "docs/reviews/ai/ai198-opportunity-micro-cutover-experiment.json",
  ],
  metrics,
  blocker: {
    current: ai198.aggregate.noGo
      ? "action_id_redacted_and_replay_probe_missing"
      : "await_flagged_micro_cutover_validation",
    runtimeCutoverEligible: ai198.aggregate.eligibleMicroCutoverCandidates > 0,
  },
};

mkdirSync(dirname(jsonOut), { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(output, null, 2)}\n`, "utf8");
writeFileSync(mdOut, renderMarkdown(output), "utf8");
console.log(JSON.stringify({ metrics: metrics.length, blocker: output.blocker.current }, null, 2));

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
  const metricRows = input.metrics
    .map(
      (entry) =>
        `| \`${entry.id}\` | ${entry.numerator}/${entry.denominator} | ${(entry.value * 100).toFixed(1)}% | ${entry.note} |`,
    )
    .join("\n");
  return `# AI199 Scorecard v5 - Binding and Replay Proof

Datum: 2026-06-14

Branch: \`codex/ai191-ai200-binding-replay-proof\`

## Ziel

AI199 erweitert die Scorecard um Binding-, TargetIdentity-, Dry-Run-, Replay-, Coverage-, Corp-Tempo-, Stale-Punish- und Runtime-Flag-Metriken.

## Scorecard

| Metrik | ZÃ¤hler/Nenner | Rate | Hinweis |
| --- | ---: | ---: | --- |
${metricRows}

## Schluss

Der aktuelle Blocker ist \`${input.blocker.current}\`. CandidatePathBinding und TargetIdentity v2 sind messbar besser, aber Dry-Run, Replay-Probe und Runtime-Flag bleiben bei 0. Damit bleibt ein Runtime-Cutover No-Go.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai199-scorecard-v5-binding-replay-proof.ts\`
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
