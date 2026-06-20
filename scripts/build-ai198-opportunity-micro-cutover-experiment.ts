import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

type Ai191 = {
  bindings: Array<{
    reviewScope: string;
    source: string;
    family: string;
    caseId: string;
    primaryPath: string;
    binding: {
      bindingKey: string;
      proofStatus: "bound" | "blocked";
      blockers: string[];
      intentContractId: string;
    };
  }>;
};

type Ai192 = {
  reviews: Array<{
    resolution: {
      status: string;
      blocker?: string;
    };
  }>;
};

type Ai193 = {
  builds: Array<{
    result: {
      status: "built" | "blocked";
      blockers: string[];
    };
  }>;
};

type Ai194 = {
  probes: Array<{
    replayProbeStatus: string;
    blockers: string[];
  }>;
};

type GateReview = {
  source: string;
  family: string;
  caseId: string;
  primaryPath: string;
  checks: Record<string, boolean>;
  failed: string[];
  blockers: string[];
};

const repoRoot = findRepoRoot(process.cwd());
const ai191 = readJson<Ai191>("docs/reviews/ai/ai191-candidate-path-bindings-v1.json");
const ai192 = readJson<Ai192>("docs/reviews/ai/ai192-target-identity-v2-candidate-paths.json");
const ai193 = readJson<Ai193>("docs/reviews/ai/ai193-playeraction-dry-run-builder.json");
const ai194 = readJson<Ai194>("docs/reviews/ai/ai194-playeraction-replay-probe-v2.json");
const jsonOut = resolve(repoRoot, "docs/reviews/ai/ai198-opportunity-micro-cutover-experiment.json");
const mdOut = resolve(repoRoot, "docs/reviews/ai/ai198-opportunity-micro-cutover-experiment.md");

const gateReviews: GateReview[] = ai191.bindings.map((entry, index) => {
  const target = ai192.reviews[index]?.resolution;
  const dryRun = ai193.builds[index]?.result;
  const replay = ai194.probes[index];
  const checks = {
    candidate_path_binding_complete: entry.binding.proofStatus === "bound",
    target_identity_complete_or_irrelevant:
      target?.status === "complete" || target?.status === "irrelevant",
    playeraction_dry_run_passed: dryRun?.status === "built",
    replay_probe_passed: replay?.replayProbeStatus === "passed",
    intent_contract_present: entry.binding.intentContractId.length > 0,
    x5_not_worse: false,
    x10_not_worse: false,
    no_generic_penalty: true,
    runtime_flag_default_off: true,
  };
  const failed = Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([gate]) => gate);
  return {
    source: entry.source,
    family: entry.family,
    caseId: entry.caseId,
    primaryPath: entry.primaryPath,
    checks,
    failed,
    blockers: [
      ...new Set([
        ...entry.binding.blockers,
        ...(target?.blocker ? [target.blocker] : []),
        ...(dryRun?.blockers ?? []),
        ...(replay?.blockers ?? []),
      ]),
    ].sort(),
  };
});

const eligible = gateReviews.filter((entry) => entry.failed.length === 0);
const output = {
  schemaVersion: "ai198-opportunity-micro-cutover-experiment",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  sources: {
    ai191: "docs/reviews/ai/ai191-candidate-path-bindings-v1.json",
    ai192: "docs/reviews/ai/ai192-target-identity-v2-candidate-paths.json",
    ai193: "docs/reviews/ai/ai193-playeraction-dry-run-builder.json",
    ai194: "docs/reviews/ai/ai194-playeraction-replay-probe-v2.json",
  },
  runtime: {
    flag: "NETGRID_AI_OPPORTUNITY_MICRO_CUTOVER",
    default: "off",
    implemented: false,
    reason: "no proof-complete candidate",
  },
  aggregate: {
    reviewedBindings: gateReviews.length,
    eligibleMicroCutoverCandidates: eligible.length,
    runtimeFlaggedCandidateCount: 0,
    noGo: eligible.length === 0,
  },
  blockerCounts: countBy(
    gateReviews.flatMap((entry) => entry.blockers),
    (blocker) => blocker,
  ),
  gateReviews,
};

mkdirSync(dirname(jsonOut), { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(output, null, 2)}\n`, "utf8");
writeFileSync(mdOut, renderMarkdown(output), "utf8");
console.log(JSON.stringify(output.aggregate, null, 2));

function renderMarkdown(input: typeof output): string {
  const blockerRows = Object.entries(input.blockerCounts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([blocker, count]) => `| \`${blocker}\` | ${count} |`)
    .join("\n");
  const failedGateRows = Object.entries(
    countBy(
      input.gateReviews.flatMap((entry) => entry.failed),
      (gate) => gate,
    ),
  )
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([gate, count]) => `| \`${gate}\` | ${count} |`)
    .join("\n");
  return `# AI198 Opportunity Micro-Cutover Experiment

Datum: 2026-06-14

Branch: \`codex/ai191-ai200-binding-replay-proof\`

## Ziel

AI198 darf genau einen Opportunity-Micro-Cutover testen, aber nur wenn CandidatePathBinding, TargetIdentity, PlayerAction-Dry-Run und Replay-Probe vollstÃ¤ndig proof-fÃ¤hig sind.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| geprÃ¼fte Bindings | ${input.aggregate.reviewedBindings} |
| eligible Micro-Cutover-Kandidaten | ${input.aggregate.eligibleMicroCutoverCandidates} |
| Runtime-geflaggte Kandidaten | ${input.aggregate.runtimeFlaggedCandidateCount} |
| No-Go | ${input.aggregate.noGo ? 1 : 0} |

## Runtime

| Feld | Wert |
| --- | --- |
| Flag | \`${input.runtime.flag}\` |
| Default | \`${input.runtime.default}\` |
| implementiert | ${input.runtime.implemented ? 1 : 0} |
| Grund | \`${input.runtime.reason}\` |

## Fehlende Gates

| Gate | Count |
| --- | ---: |
${failedGateRows}

## Blocker

| Blocker | Count |
| --- | ---: |
${blockerRows}

## Schluss

AI198 bleibt No-Go. Es gibt keinen Kandidaten mit echter PlayerAction-Dry-Run- und Replay-Proof-Kette. Deshalb wird kein Runtime-Flag implementiert, kein Score geÃ¤ndert und kein Micro-Cutover aktiviert.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai198-opportunity-micro-cutover-experiment.ts\`
- \`git diff --check\`
`;
}

function countBy<T extends string>(entries: readonly T[], keyFor: (entry: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const entry of entries) {
    const key = keyFor(entry);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
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
