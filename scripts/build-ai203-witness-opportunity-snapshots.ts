import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { CandidatePathBinding } from "../packages/ai/src/candidate-path-binding";
import type { TargetRef } from "../packages/ai/src/target-ref";
import { buildWitnessOpportunityProjection } from "../packages/ai/src/witness-opportunity-projection";

type Ai191 = {
  bindings: Array<{
    reviewScope: string;
    source: string;
    family: string;
    caseId: string;
    primaryPath: string;
    requestKind: string;
    semanticActionType: string;
    binding: CandidatePathBinding;
  }>;
};

type Ai202 = {
  reviews: Array<{
    reviewScope: string;
    source: string;
    family: string;
    caseId: string;
    actionType: string;
    targetRef: TargetRef;
  }>;
};

const repoRoot = findRepoRoot(process.cwd());
const ai191 = readJson<Ai191>("docs/reviews/ai/ai191-candidate-path-bindings-v1.json");
const ai202 = readJson<Ai202>("docs/reviews/ai/ai202-targetref-v1.json");
const jsonOut = resolve(repoRoot, "docs/reviews/ai/ai203-witness-opportunity-snapshots.json");
const mdOut = resolve(repoRoot, "docs/reviews/ai/ai203-witness-opportunity-snapshots.md");

if (ai191.bindings.length !== ai202.reviews.length) {
  throw new Error(`AI191/AI202 length mismatch: ${ai191.bindings.length} vs ${ai202.reviews.length}`);
}

const projections = ai191.bindings.map((entry, index) => {
  const targetReview = ai202.reviews[index];
  if (!targetReview) throw new Error(`Missing AI202 review at index ${index}`);
  return {
    reviewScope: entry.reviewScope,
    source: entry.source,
    family: entry.family,
    caseId: entry.caseId,
    primaryPath: entry.primaryPath,
    requestKind: entry.requestKind,
    semanticActionType: entry.semanticActionType,
    projection: buildWitnessOpportunityProjection({
      binding: entry.binding,
      targetRef: targetReview.targetRef,
    }),
  };
});

const output = {
  schemaVersion: "ai203-witness-opportunity-snapshots",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  sources: {
    ai191: "docs/reviews/ai/ai191-candidate-path-bindings-v1.json",
    ai202: "docs/reviews/ai/ai202-targetref-v1.json",
  },
  aggregate: {
    candidatePathBindings: projections.length,
    projections: projections.length,
    trueLegalActionWitnesses: projections.filter((entry) => entry.projection.legalActionWitness).length,
    candidatePathBindingFromWitness: projections.filter(
      (entry) => entry.projection.candidatePathBindingFromWitness,
    ).length,
    targetRefCompleteOrIrrelevant: projections.filter(
      (entry) => entry.projection.targetRef.sideSafe || entry.projection.targetRef.kind === "none",
    ).length,
    actionIdsPresent: projections.filter((entry) => entry.projection.actionId).length,
    redactedActionRefsPresent: projections.filter((entry) => entry.projection.redactedActionRef).length,
    blocked: projections.filter((entry) => entry.projection.status === "blocked").length,
    runtimeChanged: false,
  },
  blockerCounts: countBy(
    projections.flatMap((entry) => entry.projection.blockers),
    (blocker) => blocker,
  ),
  projections,
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
  const ai177Rows = input.projections
    .filter((entry) => entry.reviewScope === "ai177_candidate")
    .map(
      (entry) =>
        `| ${entry.source} | \`${entry.caseId}\` | \`${entry.family}\` | \`${entry.projection.actionType}\` | \`${entry.projection.targetRef.identity}\` | \`${entry.projection.status}\` | ${entry.projection.blockers.map((blocker) => `\`${blocker}\``).join(", ")} |`,
    )
    .join("\n");
  return `# AI203 Witness Opportunity Snapshots

Datum: 2026-06-14

Branch: \`codex/ai201-ai212-witness-proof\`

## Ziel

AI203 verbindet Opportunity-Candidate-Pfade mit \`TargetRef v1\` und einer Witness-Projection. Weil AI170/AI191 keine echten \`actionId\`-Werte oder LegalAction-Objekte enthalten, erzeugt AI203 keine unechte \`LegalActionWitness\`, sondern blockiert die Ableitung praezise.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| CandidatePathBindings | ${input.aggregate.candidatePathBindings} |
| Witness-Projections | ${input.aggregate.projections} |
| echte LegalActionWitnesses | ${input.aggregate.trueLegalActionWitnesses} |
| CandidatePathBinding aus Witness | ${input.aggregate.candidatePathBindingFromWitness} |
| TargetRef complete/irrelevant | ${input.aggregate.targetRefCompleteOrIrrelevant} |
| echte actionIds vorhanden | ${input.aggregate.actionIdsPresent} |
| redactedActionRefs vorhanden | ${input.aggregate.redactedActionRefsPresent} |
| blockiert | ${input.aggregate.blocked} |
| Runtime geaendert | ${input.aggregate.runtimeChanged ? 1 : 0} |

## AI177/AI183-nahe Kandidaten

| Quelle | Case | Familie | Action | TargetRef | Status | Blocker |
| --- | --- | --- | --- | --- | --- | --- |
${ai177Rows}

## Blocker

| Blocker | Count |
| --- | ---: |
${blockerRows}

## Schluss

AI203 macht den Snapshot-Engpass enger: TargetRefs sind an die Candidate-Pfade gebunden, aber echte Witness-Ableitung bleibt bei 0, weil die alten Opportunity-Snapshots nur \`redactedActionRef\` und keine Engine-\`actionId\` enthalten. Die Removal Condition fuer AI205/AI206 bleibt damit explizit: neue Snapshots muessen echte LegalActionWitnesses oder mindestens echte \`actionId\`-Evidence tragen.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai203-witness-opportunity-snapshots.ts\`
- \`corepack pnpm --filter @netgrid/ai exec vitest run src/witness-opportunity-projection.test.ts\`
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
