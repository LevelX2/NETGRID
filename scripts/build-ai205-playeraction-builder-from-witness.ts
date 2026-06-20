import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { LegalActionWitness } from "../packages/ai/src/legalaction-witness";
import { buildPlayerActionFromWitness } from "../packages/ai/src/playeraction-dry-run-builder";

type Ai203 = {
  projections: Array<{
    reviewScope: string;
    source: string;
    family: string;
    caseId: string;
    primaryPath: string;
    projection: {
      legalActionWitness?: LegalActionWitness;
      blockers: string[];
      targetRef: { identity: string };
    };
  }>;
};

const repoRoot = findRepoRoot(process.cwd());
const ai203 = readJson<Ai203>("docs/reviews/ai/ai203-witness-opportunity-snapshots.json");
const jsonOut = resolve(repoRoot, "docs/reviews/ai/ai205-playeraction-builder-from-witness.json");
const mdOut = resolve(repoRoot, "docs/reviews/ai/ai205-playeraction-builder-from-witness.md");

const builds = ai203.projections.map((entry) => {
  const result = entry.projection.legalActionWitness
    ? buildPlayerActionFromWitness({ witness: entry.projection.legalActionWitness })
      : {
        schemaVersion: "playeraction-dry-run-builder-v1" as const,
        status: "blocked" as const,
        blockers: [...new Set(["legalaction_witness_missing", ...entry.projection.blockers])].sort(),
        evidence: ["ai203_projection_without_legalaction_witness"],
      };
  return {
    reviewScope: entry.reviewScope,
    source: entry.source,
    family: entry.family,
    caseId: entry.caseId,
    primaryPath: entry.primaryPath,
    targetRef: entry.projection.targetRef.identity,
    result,
  };
});

const output = {
  schemaVersion: "ai205-playeraction-builder-from-witness",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  sources: {
    ai203: "docs/reviews/ai/ai203-witness-opportunity-snapshots.json",
  },
  supportedFamilies: [
    "no-target basic actions",
    "start_run with server TargetRef",
    "resolve_choice with choice TargetRef",
    "actor-known installed-card actions for install/advance/rez/score",
  ],
  aggregate: {
    candidateProjections: builds.length,
    witnessPresent: builds.filter((entry) => "playerAction" in entry.result || !entry.result.blockers.includes("legalaction_witness_missing")).length,
    playerActionsBuilt: builds.filter((entry) => entry.result.status === "built").length,
    blocked: builds.filter((entry) => entry.result.status === "blocked").length,
    runtimeEffects: 0,
  },
  blockerCounts: countBy(builds.flatMap((entry) => entry.result.blockers), (blocker) => blocker),
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
        `| ${entry.source} | \`${entry.caseId}\` | \`${entry.family}\` | \`${entry.targetRef}\` | \`${entry.result.status}\` | ${entry.result.blockers.map((blocker) => `\`${blocker}\``).join(", ")} |`,
    )
    .join("\n");
  const familyRows = input.supportedFamilies.map((family) => `| ${family} |`).join("\n");
  return `# AI205 PlayerAction Builder from Witness

Datum: 2026-06-14

Branch: \`codex/ai201-ai212-witness-proof\`

## Ziel

AI205 ergaenzt den test-only Helper \`buildPlayerActionFromWitness(...)\`. Er baut strukturelle \`PlayerAction\`-Objekte nur aus echten \`LegalActionWitness\`-Eintraegen und blockiert fehlende, hidden-blocked oder unsupported Witnesses.

## Unterstuetzte Startmenge

| Familie |
| --- |
${familyRows}

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Candidate-Projections | ${input.aggregate.candidateProjections} |
| Witness vorhanden | ${input.aggregate.witnessPresent} |
| PlayerActions gebaut | ${input.aggregate.playerActionsBuilt} |
| blockiert | ${input.aggregate.blocked} |
| Runtime-Effekte | ${input.aggregate.runtimeEffects} |

## AI177/AI183-nahe Kandidaten

| Quelle | Case | Familie | TargetRef | Build | Blocker |
| --- | --- | --- | --- | --- | --- |
${ai177Rows}

## Blocker

| Blocker | Count |
| --- | ---: |
${blockerRows}

## Schluss

Der Builder selbst kann no-target, Server-Run, Choice-Option und actor-known installed-card Witnesses strukturell bauen. Die aktuellen Opportunity-Candidates bleiben aber 0/103 buildbar, weil AI203 keine echten LegalActionWitnesses findet. Das verhindert weiterhin Replay-Probe und Runtime-Cutover.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai205-playeraction-builder-from-witness.ts\`
- \`corepack pnpm --filter @netgrid/ai exec vitest run src/playeraction-dry-run-builder.test.ts src/legalaction-witness.test.ts\`
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
