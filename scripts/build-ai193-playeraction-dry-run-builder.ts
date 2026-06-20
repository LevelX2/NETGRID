import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { buildPlayerActionFromCandidateBinding } from "../packages/ai/src/playeraction-dry-run-builder";
import type { CandidatePathBinding } from "../packages/ai/src/candidate-path-binding";
import type { CandidateTargetIdentityResolution } from "../packages/ai/src/target-identity-resolver";

type Ai191 = {
  bindings: Array<{
    reviewScope: string;
    source: string;
    family: string;
    caseId: string;
    primaryPath: string;
    semanticActionType: string;
    binding: CandidatePathBinding;
  }>;
};

type Ai192 = {
  reviews: Array<{
    resolution: CandidateTargetIdentityResolution;
  }>;
};

const repoRoot = findRepoRoot(process.cwd());
const ai191 = readJson<Ai191>("docs/reviews/ai/ai191-candidate-path-bindings-v1.json");
const ai192 = readJson<Ai192>("docs/reviews/ai/ai192-target-identity-v2-candidate-paths.json");
const jsonOut = resolve(repoRoot, "docs/reviews/ai/ai193-playeraction-dry-run-builder.json");
const mdOut = resolve(repoRoot, "docs/reviews/ai/ai193-playeraction-dry-run-builder.md");

const builds = ai191.bindings.map((entry, index) => {
  const targetIdentity = ai192.reviews[index]?.resolution;
  if (!targetIdentity) {
    throw new Error(`Missing AI192 resolution for binding index ${index}`);
  }
  const result = buildPlayerActionFromCandidateBinding({
    binding: entry.binding,
    targetIdentity,
  });
  return {
    reviewScope: entry.reviewScope,
    source: entry.source,
    family: entry.family,
    caseId: entry.caseId,
    primaryPath: entry.primaryPath,
    actionType: entry.binding.actionType,
    semanticActionType: entry.semanticActionType,
    targetIdentity: targetIdentity.identity,
    result,
  };
});

const output = {
  schemaVersion: "ai193-playeraction-dry-run-builder",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  sources: {
    ai191: "docs/reviews/ai/ai191-candidate-path-bindings-v1.json",
    ai192: "docs/reviews/ai/ai192-target-identity-v2-candidate-paths.json",
  },
  aggregate: {
    candidatePathBindings: builds.length,
    dryRunBuilt: builds.filter((entry) => entry.result.status === "built").length,
    dryRunBlocked: builds.filter((entry) => entry.result.status === "blocked").length,
    ai177DryRunBuilt: builds.filter(
      (entry) => entry.reviewScope === "ai177_candidate" && entry.result.status === "built",
    ).length,
  },
  blockerCounts: countBy(
    builds.flatMap((entry) => entry.result.blockers),
    (blocker) => blocker,
  ),
  builds,
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
  const ai177Rows = input.builds
    .filter((entry) => entry.reviewScope === "ai177_candidate")
    .map(
      (entry) =>
        `| ${entry.source} | \`${entry.caseId}\` | \`${entry.family}\` | \`${entry.actionType}\` | \`${entry.targetIdentity}\` | \`${entry.result.status}\` | ${entry.result.blockers.map((blocker) => `\`${blocker}\``).join(", ") || "none"} |`,
    )
    .join("\n");
  return `# AI193 PlayerAction Dry-Run Builder

Datum: 2026-06-14

Branch: \`codex/ai191-ai200-binding-replay-proof\`

## Ziel

AI193 fÃ¼hrt einen test-only/read-only Builder \`buildPlayerActionFromCandidateBinding(...)\` ein. Er baut nur dann eine \`PlayerAction\`, wenn Binding, TargetIdentity, echte \`actionId\`, Side, \`stateVersion\` und unterstÃ¼tzte Zielklasse vollstÃ¤ndig sind.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| CandidatePathBindings | ${input.aggregate.candidatePathBindings} |
| Dry-Run gebaut | ${input.aggregate.dryRunBuilt} |
| Dry-Run blockiert | ${input.aggregate.dryRunBlocked} |
| AI177 Dry-Run gebaut | ${input.aggregate.ai177DryRunBuilt} |

## AI177-Kandidaten

| Quelle | Case | Familie | Action | TargetIdentity | Dry-Run | Blocker |
| --- | --- | --- | --- | --- | --- | --- |
${ai177Rows}

## Blocker

| Blocker | Count |
| --- | ---: |
${blockerRows}

## Schluss

Der Builder ist funktionsfÃ¤hig und testet No-target- und Server-Run-Pfade mit echten ActionIds. Die aktuellen AI191-Bindings enthalten jedoch nur \`redactedActionRef\`, keine echte \`actionId\`. Deshalb wird im Review-Artefakt kein Candidate in eine PlayerAction Ã¼berfÃ¼hrt. Das ist ein konkreter Blocker, kein Runtime-Fehler.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai193-playeraction-dry-run-builder.ts\`
- \`corepack pnpm --filter @netgrid/ai exec vitest run src/playeraction-dry-run-builder.test.ts\`
- \`corepack pnpm --filter @netgrid/ai run typecheck\`
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
