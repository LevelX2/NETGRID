import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { CandidatePathBinding } from "../packages/ai/src/candidate-path-binding";
import type { CandidateTargetIdentityResolution } from "../packages/ai/src/target-identity-resolver";
import type { PlayerActionDryRunBuildResult } from "../packages/ai/src/playeraction-dry-run-builder";

type Ai173 = {
  cases: Array<{
    caseId: string;
    dominantSubcluster: string;
    snapshotCount: number;
    visibleInstallableSolution: boolean;
    searchSolution: boolean;
    drawSolution: boolean;
    creditNeeded: boolean;
    noSolutionVisible: boolean;
    path: string;
    cutover: string;
  }>;
};

type BindingEntry = {
  reviewScope: string;
  source: string;
  family: string;
  caseId: string;
  primaryPath: string;
  semanticActionType: string;
  binding: CandidatePathBinding;
};

type Ai191 = { bindings: BindingEntry[] };
type Ai192 = { reviews: Array<{ resolution: CandidateTargetIdentityResolution }> };
type Ai193 = { builds: Array<{ result: PlayerActionDryRunBuildResult }> };

const repoRoot = findRepoRoot(process.cwd());
const ai173 = readJson<Ai173>("docs/reviews/ai/ai173-runner-coverage-opportunity-solver-2026-06-13.json");
const ai191 = readJson<Ai191>("docs/reviews/ai/ai191-candidate-path-bindings-v1.json");
const ai192 = readJson<Ai192>("docs/reviews/ai/ai192-target-identity-v2-candidate-paths.json");
const ai193 = readJson<Ai193>("docs/reviews/ai/ai193-playeraction-dry-run-builder.json");
const jsonOut = resolve(repoRoot, "docs/reviews/ai/ai196-coverage-candidate-binding-review.json");
const mdOut = resolve(repoRoot, "docs/reviews/ai/ai196-coverage-candidate-binding-review.md");

const bindingContext = ai191.bindings.map((entry, index) => ({
  ...entry,
  targetIdentity: ai192.reviews[index]?.resolution,
  dryRun: ai193.builds[index]?.result,
}));

const cases = ai173.cases.map((entry) => {
  const bindings = bindingContext.filter(
    (binding) =>
      binding.reviewScope === "coverage_candidate" &&
      binding.family === "runner_coverage" &&
      binding.caseId === entry.caseId,
  );
  const completeTargetIdentities = bindings.filter(
    (binding) =>
      binding.targetIdentity?.status === "complete" ||
      binding.targetIdentity?.status === "irrelevant",
  );
  const dryRunBuilt = bindings.filter((binding) => binding.dryRun?.status === "built");
  const blockers = [
    ...new Set(
      bindings.flatMap((binding) => [
        ...binding.binding.blockers,
        ...(binding.targetIdentity?.blocker ? [binding.targetIdentity.blocker] : []),
        ...(binding.dryRun?.blockers ?? []),
      ]),
    ),
  ].sort();
  return {
    caseId: entry.caseId,
    dominantSubcluster: entry.dominantSubcluster,
    missingIceType: entry.noSolutionVisible ? "unknown_missing_coverage" : "coverage_gap_present",
    visibleCoverageSolution: entry.visibleInstallableSolution,
    searchPath: entry.searchSolution,
    installPath: entry.visibleInstallableSolution,
    drawPath: entry.drawSolution,
    creditPath: entry.creditNeeded,
    previousPath: entry.path,
    previousCutover: entry.cutover,
    candidatePathBindings: bindings.length,
    completeOrIrrelevantTargetIdentities: completeTargetIdentities.length,
    dryRunBuilt: dryRunBuilt.length,
    dryRunCapable: dryRunBuilt.length > 0,
    bindingSourceDefinitions: [
      ...new Set(
        bindings
          .map((binding) => binding.binding.sourceDefinitionId)
          .filter((value): value is string => value !== undefined),
      ),
    ].sort(),
    blockers,
    gateStatus: dryRunBuilt.length > 0 ? "dry_run_capable" : "blocked",
  };
});

const output = {
  schemaVersion: "ai196-coverage-candidate-binding-review",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  sources: {
    ai173: "docs/reviews/ai/ai173-runner-coverage-opportunity-solver-2026-06-13.json",
    ai191: "docs/reviews/ai/ai191-candidate-path-bindings-v1.json",
    ai192: "docs/reviews/ai/ai192-target-identity-v2-candidate-paths.json",
    ai193: "docs/reviews/ai/ai193-playeraction-dry-run-builder.json",
  },
  relevantCards: [
    "Self-Modifying Code",
    "Temple Microcode Outlet",
    "The Short Circuit",
    "Codecracker",
    "Dwarf",
    "Worm",
    "Corrosion",
    "Skeleton Passkeys",
    "Boring Bit",
  ],
  aggregate: {
    cases: cases.length,
    dryRunCapable: cases.filter((entry) => entry.dryRunCapable).length,
    blocked: cases.filter((entry) => !entry.dryRunCapable).length,
    bindings: cases.reduce((sum, entry) => sum + entry.candidatePathBindings, 0),
    completeOrIrrelevantTargetIdentityCases: cases.filter(
      (entry) => entry.completeOrIrrelevantTargetIdentities > 0,
    ).length,
    visibleInstallableSolutionCases: cases.filter((entry) => entry.visibleCoverageSolution).length,
    runtimeEffects: 0,
  },
  blockerCounts: countBy(
    cases.flatMap((entry) => entry.blockers),
    (blocker) => blocker,
  ),
  cases,
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
  const caseRows = input.cases
    .map(
      (entry) =>
        `| \`${entry.caseId}\` | \`${entry.previousPath}\` | ${entry.candidatePathBindings} | ${entry.completeOrIrrelevantTargetIdentities} | ${entry.dryRunBuilt} | \`${entry.gateStatus}\` | ${entry.bindingSourceDefinitions.map((value) => `\`${value}\``).join(", ") || "none"} |`,
    )
    .join("\n");
  return `# AI196 Coverage Candidate Binding Review

Datum: 2026-06-14

Branch: \`codex/ai191-ai200-binding-replay-proof\`

## Ziel

AI196 prÃ¼ft die 13 Runner-Coverage-FÃ¤lle aus AI173 erneut mit CandidatePathBinding, TargetIdentity v2 und PlayerAction-Dry-Run-Ergebnis. Es wird kein Draw-/Credit-Malus abgeleitet.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Coverage-FÃ¤lle | ${input.aggregate.cases} |
| Dry-Run-fÃ¤hig | ${input.aggregate.dryRunCapable} |
| blockiert | ${input.aggregate.blocked} |
| CandidatePathBindings | ${input.aggregate.bindings} |
| FÃ¤lle mit complete/irrelevant TargetIdentity | ${input.aggregate.completeOrIrrelevantTargetIdentityCases} |
| visible-installable FÃ¤lle | ${input.aggregate.visibleInstallableSolutionCases} |
| Runtime-Wirkungen | ${input.aggregate.runtimeEffects} |

## FÃ¤lle

| Case | Vorheriger Pfad | Bindings | TargetIdentity complete/irrelevant | Dry-Run gebaut | Gate | Source Definitions |
| --- | --- | ---: | ---: | ---: | --- | --- |
${caseRows}

## Blocker

| Blocker | Count |
| --- | ---: |
${blockerRows}

## Schluss

Coverage-Kandidaten sind mit Bindings prÃ¤ziser reviewbar, aber weiterhin nicht Dry-Run-fÃ¤hig, weil die Snapshot-Artefakte keine echte \`actionId\` enthalten. Sichtbare installierbare LÃ¶sungen und relevante Programme bleiben Evidence, nicht Runtime-Gewichte.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai196-coverage-candidate-binding-review.ts\`
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
