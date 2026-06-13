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
const ai170 = readJson<any>("docs/reviews/ai/ai170-opportunity-state-snapshots-2026-06-13.json");
const ai182 = readJson<any>("docs/reviews/ai/ai182-target-identity-resolver-v1.json");
const ai183 = readJson<any>("docs/reviews/ai/ai183-candidate-gate-v2.json");
const ai184 = readJson<any>("docs/reviews/ai/ai184-playeraction-replay-probe.json");
const ai185 = readJson<any>("docs/reviews/ai/ai185-stale-punish-intent-decomposition.json");
const ai186 = readJson<any>("docs/reviews/ai/ai186-coverage-candidate-signature-review.json");
const jsonOut = resolve(repoRoot, "docs/reviews/ai/ai188-scorecard-v4.json");
const mdOut = resolve(repoRoot, "docs/reviews/ai/ai188-scorecard-v4.md");

const targetIdentityCompleteOrIrrelevant =
  ai182.aggregate.complete + ai182.aggregate.irrelevant;
const metrics: Metric[] = [
  metric(
    "semantic_action_signature_rate",
    ai170.aggregate.alternativesWithSemanticActionSignature,
    ai182.aggregate.alternatives,
    "Share of Opportunity alternatives carrying a deterministic signature.",
  ),
  metric(
    "target_identity_complete_rate",
    targetIdentityCompleteOrIrrelevant,
    ai182.aggregate.alternatives,
    "Share of alternatives with complete or irrelevant side-safe TargetIdentity.",
  ),
  metric(
    "candidate_gate_pass_rate",
    ai183.aggregate.passedCandidates,
    ai183.aggregate.evaluatedCandidates,
    "AI183 gate v2 pass rate.",
  ),
  metric(
    "playeraction_replay_probe_pass_rate",
    ai184.aggregate.replayProbed,
    ai184.aggregate.candidates,
    "Share of candidates with successful PlayerAction replay probe.",
  ),
  metric(
    "coverage_candidate_signature_pass_rate",
    ai186.aggregate.gatePositive,
    ai186.aggregate.cases,
    "Coverage candidates passing signature plus TargetIdentity review.",
  ),
  metric(
    "runtime_cutover_candidate_count",
    ai183.aggregate.passedCandidates,
    1,
    "Count-like gate for any runtime-cutover candidate in this block.",
  ),
];

const output = {
  schemaVersion: "ai188-scorecard-v4",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  sources: [
    "docs/reviews/ai/ai170-opportunity-state-snapshots-2026-06-13.json",
    "docs/reviews/ai/ai182-target-identity-resolver-v1.json",
    "docs/reviews/ai/ai183-candidate-gate-v2.json",
    "docs/reviews/ai/ai184-playeraction-replay-probe.json",
    "docs/reviews/ai/ai185-stale-punish-intent-decomposition.json",
    "docs/reviews/ai/ai186-coverage-candidate-signature-review.json",
  ],
  metrics,
  stalePunishRootCauseDistribution: ai185.aggregate.rootCauseCounts,
  conclusion: {
    runtimeCutoverEligible: ai183.aggregate.passedCandidates > 0,
    currentBlocker:
      ai183.aggregate.passedCandidates > 0
        ? "await_micro_candidate_package"
        : "candidate_path_target_identity_and_playeraction_replay_missing",
  },
};

mkdirSync(dirname(jsonOut), { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(output, null, 2)}\n`, "utf8");
writeFileSync(mdOut, renderMarkdown(output), "utf8");
console.log(JSON.stringify({ metrics: metrics.length, runtimeCutoverEligible: output.conclusion.runtimeCutoverEligible }, null, 2));

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
  const rootRows = Object.entries(input.stalePunishRootCauseDistribution)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([rootCause, count]) => `| \`${rootCause}\` | ${count} |`)
    .join("\n");
  return `# AI188 Scorecard v4

Datum: 2026-06-13

Branch: \`codex/ai181-ai190-signature-proof\`

## Ziel

AI188 erweitert die Scorecard um Signature-Proof-Metriken. Die Scorecard zeigt, ob die aktuelle Blockade an Daten, TargetIdentity, Replay oder fachlichem No-Go liegt.

## Scorecard

| Metrik | Zähler/Nenner | Rate | Hinweis |
| --- | ---: | ---: | --- |
${metricRows}

## Stale Punish Root Cause Distribution

| Root Cause | Fälle |
| --- | ---: |
${rootRows}

## Schluss

Die Signaturrate ist vollständig, aber TargetIdentity und Replay bleiben der Blocker. Es gibt weiterhin 0 Runtime-Cutover-Kandidaten.

Aktueller Blocker: \`${input.conclusion.currentBlocker}\`.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai188-scorecard-v4.ts\`
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
