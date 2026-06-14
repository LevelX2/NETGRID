import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import {
  resolveCandidateTargetIdentity,
  type CandidateTargetIdentityResolution,
} from "../packages/ai/src/target-identity-resolver";
import type { CandidatePathBinding } from "../packages/ai/src/candidate-path-binding";

type Ai191 = {
  bindings: Array<{
    reviewScope: string;
    source: string;
    family: string;
    caseId: string;
    primaryPath: string;
    requestKind: string;
    selected: boolean;
    semanticActionType: string;
    expectedProgressLabel: string;
    targetContextStatus: string;
    binding: CandidatePathBinding;
  }>;
};

const repoRoot = findRepoRoot(process.cwd());
const ai191 = readJson<Ai191>("docs/reviews/ai/ai191-candidate-path-bindings-v1.json");
const jsonOut = resolve(repoRoot, "docs/reviews/ai/ai192-target-identity-v2-candidate-paths.json");
const mdOut = resolve(repoRoot, "docs/reviews/ai/ai192-target-identity-v2-candidate-paths.md");

const reviews = ai191.bindings.map((entry) => {
  const resolution = resolveCandidateTargetIdentity({
    actionType: entry.binding.actionType,
    targetIdentity: entry.binding.targetIdentity,
    targetContextStatus: entry.targetContextStatus,
    sourceDefinitionId: entry.binding.sourceDefinitionId,
    abilityId: entry.binding.abilityId,
    hardGateSummary: entry.binding.hardGateSummary,
    actorSide: entry.binding.side,
  });
  return {
    reviewScope: entry.reviewScope,
    source: entry.source,
    family: entry.family,
    caseId: entry.caseId,
    primaryPath: entry.primaryPath,
    actionType: entry.binding.actionType,
    semanticActionType: entry.semanticActionType,
    selected: entry.selected,
    originalTargetIdentity: entry.binding.targetIdentity,
    resolvedTargetIdentity: resolution.identity,
    bindingProofStatus: entry.binding.proofStatus,
    bindingBlockers: entry.binding.blockers,
    resolution,
    candidatePathReadyForPlayerAction:
      (resolution.status === "complete" || resolution.status === "irrelevant") &&
      entry.binding.proofStatus === "bound",
  };
});

const output = {
  schemaVersion: "ai192-target-identity-v2-candidate-paths",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  sources: {
    ai191: "docs/reviews/ai/ai191-candidate-path-bindings-v1.json",
  },
  aggregate: {
    candidatePathBindings: reviews.length,
    completeOrIrrelevant: reviews.filter(isCompleteOrIrrelevant).length,
    complete: reviews.filter((entry) => entry.resolution.status === "complete").length,
    irrelevant: reviews.filter((entry) => entry.resolution.status === "irrelevant").length,
    blockedHiddenInfo: reviews.filter((entry) => entry.resolution.status === "blocked_hidden_info").length,
    blockedUnresolved: reviews.filter((entry) => entry.resolution.status === "blocked_unresolved").length,
    playerActionTargetRequired: reviews.filter((entry) => entry.resolution.playerActionTargetRequired).length,
    candidatePathReadyForPlayerAction: reviews.filter((entry) => entry.candidatePathReadyForPlayerAction).length,
    ai177CompleteOrIrrelevant: reviews.filter(
      (entry) => entry.reviewScope === "ai177_candidate" && isCompleteOrIrrelevant(entry),
    ).length,
  },
  blockerCounts: countBy(
    reviews
      .map((entry) => entry.resolution.blocker)
      .filter((blocker): blocker is string => blocker !== undefined),
    (blocker) => blocker,
  ),
  reviews,
};

mkdirSync(dirname(jsonOut), { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(output, null, 2)}\n`, "utf8");
writeFileSync(mdOut, renderMarkdown(output), "utf8");
console.log(JSON.stringify(output.aggregate, null, 2));

function isCompleteOrIrrelevant(entry: { resolution: CandidateTargetIdentityResolution }): boolean {
  return entry.resolution.status === "complete" || entry.resolution.status === "irrelevant";
}

function renderMarkdown(input: typeof output): string {
  const blockerRows = Object.entries(input.blockerCounts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([blocker, count]) => `| \`${blocker}\` | ${count} |`)
    .join("\n");
  const ai177Rows = input.reviews
    .filter((entry) => entry.reviewScope === "ai177_candidate")
    .map(
      (entry) =>
        `| ${entry.source} | \`${entry.caseId}\` | \`${entry.family}\` | \`${entry.actionType}\` | \`${entry.originalTargetIdentity}\` | \`${entry.resolvedTargetIdentity}\` | \`${entry.resolution.status}\` | ${entry.resolution.blocker ? `\`${entry.resolution.blocker}\`` : "none"} |`,
    )
    .join("\n");
  return `# AI192 TargetIdentity v2 fÃ¼r Candidate-Pfade

Datum: 2026-06-14

Branch: \`codex/ai191-ai200-binding-replay-proof\`

## Ziel

AI192 wertet die AI191-\`CandidatePathBinding\`-EintrÃ¤ge mit einem Candidate-spezifischen TargetIdentity-v2-Vertrag aus. Der Resolver leitet nur aus bereits redigierter Snapshot-/Binding-Evidence ab und blockiert fehlende Server-, Choice- oder Hidden-Info-Ziele weiter.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| CandidatePathBindings | ${input.aggregate.candidatePathBindings} |
| vollstÃ¤ndig oder irrelevant | ${input.aggregate.completeOrIrrelevant} |
| vollstÃ¤ndig | ${input.aggregate.complete} |
| irrelevant | ${input.aggregate.irrelevant} |
| hidden-info-blockiert | ${input.aggregate.blockedHiddenInfo} |
| unresolved-blockiert | ${input.aggregate.blockedUnresolved} |
| PlayerAction-Ziel erforderlich | ${input.aggregate.playerActionTargetRequired} |
| candidate-path ready for PlayerAction | ${input.aggregate.candidatePathReadyForPlayerAction} |
| AI177 complete/irrelevant | ${input.aggregate.ai177CompleteOrIrrelevant} |

## AI177-Kandidaten

| Quelle | Case | Familie | Action | Vorher | TargetIdentity v2 | Status | Blocker |
| --- | --- | --- | --- | --- | --- | --- | --- |
${ai177Rows}

## Blocker

| Blocker | Count |
| --- | ---: |
${blockerRows}

## Schluss

TargetIdentity v2 erhÃ¶ht die fachliche PrÃ¤zision: No-target-Aktionen werden als \`none\` erkannt und actor-known Kartenpfade kÃ¶nnen aus redigierten \`sourceDefinitionId\`-Werten beschrieben werden. FÃ¼r echte Run-/Choice-Candidate-Pfade bleiben fehlende Server- und Option-IDs blockierend. Es gibt weiterhin keine Runtime-Wirkung.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai192-target-identity-v2-candidate-paths.ts\`
- \`corepack pnpm --filter @netgrid/ai exec vitest run src/target-identity-resolver.test.ts\`
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
