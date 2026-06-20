import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import {
  targetRefFromIdentity,
  targetRefIsCompleteOrIrrelevant,
  targetRefIsRedactionSafe,
  type TargetRef,
} from "../packages/ai/src/target-ref";

type Ai192 = {
  reviews: Array<{
    reviewScope: string;
    source: string;
    family: string;
    caseId: string;
    primaryPath: string;
    actionType: string;
    semanticActionType: string;
    originalTargetIdentity: string;
    resolvedTargetIdentity: string;
    resolution: { status: string; blocker?: string };
  }>;
};

const repoRoot = findRepoRoot(process.cwd());
const ai192 = readJson<Ai192>("docs/reviews/ai/ai192-target-identity-v2-candidate-paths.json");
const jsonOut = resolve(repoRoot, "docs/reviews/ai/ai202-targetref-v1.json");
const mdOut = resolve(repoRoot, "docs/reviews/ai/ai202-targetref-v1.md");

const reviews = ai192.reviews.map((entry) => {
  const targetRef = targetRefFromIdentity(entry.resolvedTargetIdentity, [
    `case:${entry.caseId}`,
    `action:${entry.actionType}`,
    `source:${entry.source}`,
    `scope:${entry.reviewScope}`,
  ]);
  return {
    ...entry,
    targetRef,
    targetRefCompleteOrIrrelevant: targetRefIsCompleteOrIrrelevant(targetRef),
    blocker: targetRef.blocker ?? entry.resolution.blocker,
  };
});

const ai183CandidateReviews = reviews.filter((entry) => entry.reviewScope === "ai177_candidate");
const output = {
  schemaVersion: "ai202-targetref-v1",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  sources: {
    ai192: "docs/reviews/ai/ai192-target-identity-v2-candidate-paths.json",
  },
  aggregate: {
    candidatePathBindings: reviews.length,
    completeOrIrrelevant: reviews.filter((entry) => entry.targetRefCompleteOrIrrelevant).length,
    blocked: reviews.filter((entry) => !entry.targetRefCompleteOrIrrelevant).length,
    hiddenBlocked: reviews.filter((entry) => entry.targetRef.kind === "hidden_blocked").length,
    ai183Candidates: ai183CandidateReviews.length,
    ai183CompleteOrIrrelevant: ai183CandidateReviews.filter((entry) => entry.targetRefCompleteOrIrrelevant).length,
    redactionSafe: reviews.every((entry) => targetRefIsRedactionSafe(entry.targetRef)),
  },
  blockerCounts: countBy(
    reviews
      .map((entry) => entry.blocker)
      .filter((blocker): blocker is string => blocker !== undefined),
    (blocker) => blocker,
  ),
  redactionRules: [
    "server targets use public server ids only",
    "ice targets use public server id plus position, not card instance ids",
    "ownInstalled targets use actor-safe refs only",
    "choice targets require side-safe choice and option ids",
    "access targets use server plus access context, not hidden card identity",
    "abilitySource targets use side-safe source definition id and ability id",
    "hidden targets become hidden_blocked",
    "unprojected targets become unknown_unprojected with a blocker",
  ],
  reviews,
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
  const ai183Rows = input.reviews
    .filter((entry) => entry.reviewScope === "ai177_candidate")
    .map(
      (entry) =>
        `| ${entry.source} | \`${entry.caseId}\` | \`${entry.family}\` | \`${entry.actionType}\` | \`${entry.resolvedTargetIdentity}\` | \`${targetRefLabel(entry.targetRef)}\` | ${entry.targetRefCompleteOrIrrelevant ? "yes" : "no"} | ${entry.blocker ? `\`${entry.blocker}\`` : "none"} |`,
    )
    .join("\n");
  const ruleRows = input.redactionRules.map((rule) => `| ${rule} |`).join("\n");
  return `# AI202 TargetRef v1

Datum: 2026-06-14

Branch: \`codex/ai201-ai212-witness-proof\`

## Ziel

AI202 macht TargetIdentity als \`TargetRef v1\` first-class. Der Vertrag ersetzt keine Engine-Legalitaet, sondern beschreibt bereits vorhandene oder Candidate-path-Ziele side-safe und replay-vorbereitend.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| CandidatePathBindings | ${input.aggregate.candidatePathBindings} |
| TargetRefs complete/irrelevant | ${input.aggregate.completeOrIrrelevant} |
| TargetRefs blocked | ${input.aggregate.blocked} |
| Hidden-blocked | ${input.aggregate.hiddenBlocked} |
| AI183/AI184 Kandidaten | ${input.aggregate.ai183Candidates} |
| AI183/AI184 complete/irrelevant | ${input.aggregate.ai183CompleteOrIrrelevant} |
| Redaction safe | ${input.aggregate.redactionSafe ? 1 : 0} |

## AI183/AI184 Kandidaten

| Quelle | Case | Familie | Action | Identity v2 | TargetRef | Vollstaendig | Blocker |
| --- | --- | --- | --- | --- | --- | --- | --- |
${ai183Rows}

## Redaction-Regeln

| Regel |
| --- |
${ruleRows}

## Blocker

| Blocker | Count |
| --- | ---: |
${blockerRows}

## Schluss

TargetRef v1 deckt Server-, ICE-, actor-known-, Choice-, Access- und AbilitySource-Ziele strukturiert ab. Die drei frueheren AI183/AI184-Kandidaten erhalten entweder einen vollstaendigen \`TargetRef\` oder einen praezisen Blocker; die haeufigsten Restblocker bleiben hard-gate- und server-/choice-bezogene fehlende Zielprojektionen.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai202-targetref-v1.ts\`
- \`corepack pnpm --filter @netgrid/ai exec vitest run src/target-ref.test.ts src/legalaction-witness.test.ts\`
- \`corepack pnpm --filter @netgrid/ai run typecheck\`
- \`git diff --check\`
`;
}

function targetRefLabel(targetRef: TargetRef): string {
  return targetRef.identity;
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
