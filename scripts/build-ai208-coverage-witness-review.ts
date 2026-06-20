import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

type Ai196 = {
  relevantCards: string[];
  cases: Array<{
    caseId: string;
    missingIceType: string;
    visibleCoverageSolution: boolean;
    searchPath: boolean;
    installPath: boolean;
    drawPath: boolean;
    creditPath: boolean;
    candidatePathBindings: number;
    completeOrIrrelevantTargetIdentities: number;
    dryRunBuilt: number;
    blockers: string[];
  }>;
};

type Ai203 = {
  projections: Array<{
    family: string;
    caseId: string;
    projection: {
      targetRef: { identity: string };
      blockers: string[];
    };
  }>;
};

type Ai205 = {
  builds: Array<{
    family: string;
    caseId: string;
    result: { status: "built" | "blocked"; blockers: string[] };
  }>;
};

const repoRoot = findRepoRoot(process.cwd());
const ai196 = readJson<Ai196>("docs/reviews/ai/ai196-coverage-candidate-binding-review.json");
const ai203 = readJson<Ai203>("docs/reviews/ai/ai203-witness-opportunity-snapshots.json");
const ai205 = readJson<Ai205>("docs/reviews/ai/ai205-playeraction-builder-from-witness.json");
const jsonOut = resolve(repoRoot, "docs/reviews/ai/ai208-coverage-witness-review.json");
const mdOut = resolve(repoRoot, "docs/reviews/ai/ai208-coverage-witness-review.md");

const cases = ai196.cases.map((entry) => {
  const projections = ai203.projections.filter(
    (projection) => projection.family === "runner_coverage" && projection.caseId === entry.caseId,
  );
  const builds = ai205.builds.filter(
    (build) => build.family === "runner_coverage" && build.caseId === entry.caseId,
  );
  const blockers = [
    ...entry.blockers,
    ...projections.flatMap((projection) => projection.projection.blockers),
    ...builds.flatMap((build) => build.result.blockers),
  ];
  return {
    ...entry,
    witnessProjections: projections.length,
    targetRefs: [...new Set(projections.map((projection) => projection.projection.targetRef.identity))],
    witnessBuildable: builds.filter((build) => build.result.status === "built").length,
    blockers: [...new Set(blockers)].sort(),
    gateStatus: builds.some((build) => build.result.status === "built") ? "candidate_buildable" : "blocked",
  };
});

const output = {
  schemaVersion: "ai208-coverage-witness-review",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  sources: {
    ai196: "docs/reviews/ai/ai196-coverage-candidate-binding-review.json",
    ai203: "docs/reviews/ai/ai203-witness-opportunity-snapshots.json",
    ai205: "docs/reviews/ai/ai205-playeraction-builder-from-witness.json",
  },
  relevantCards: ai196.relevantCards,
  aggregate: {
    cases: cases.length,
    casesWithWitnessProjection: cases.filter((entry) => entry.witnessProjections > 0).length,
    witnessProjections: cases.reduce((sum, entry) => sum + entry.witnessProjections, 0),
    witnessBuildableCases: cases.filter((entry) => entry.witnessBuildable > 0).length,
    visibleCoverageSolutionCases: cases.filter((entry) => entry.visibleCoverageSolution).length,
    installOrSearchPathCases: cases.filter((entry) => entry.installPath || entry.searchPath).length,
    runtimeEffects: 0,
  },
  blockerCounts: countBy(cases.flatMap((entry) => entry.blockers), (blocker) => blocker),
  cases,
};

mkdirSync(dirname(jsonOut), { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(output, null, 2)}\n`, "utf8");
writeFileSync(mdOut, renderMarkdown(output), "utf8");
console.log(JSON.stringify(output.aggregate, null, 2));

function renderMarkdown(input: typeof output): string {
  const caseRows = input.cases
    .map(
      (entry) =>
        `| \`${entry.caseId}\` | ${entry.visibleCoverageSolution ? "yes" : "no"} | ${entry.installPath ? "yes" : "no"} | ${entry.searchPath ? "yes" : "no"} | ${entry.witnessProjections} | ${entry.witnessBuildable} | \`${entry.gateStatus}\` | ${entry.targetRefs.map((ref) => `\`${ref}\``).join(", ") || "none"} |`,
    )
    .join("\n");
  const blockerRows = Object.entries(input.blockerCounts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([blocker, count]) => `| \`${blocker}\` | ${count} |`)
    .join("\n");
  const cardRows = input.relevantCards.map((card) => `| ${card} |`).join("\n");
  return `# AI208 Coverage Witness Review

Datum: 2026-06-14

Branch: \`codex/ai201-ai212-witness-proof\`

## Ziel

AI208 prueft die 13 Coverage-Faelle mit Witness/TargetRef-Evidence. Relevant sind Install-/Search-/Draw-/Credit-Alternativen fuer fehlende ICE-Type-Coverage; es gibt keinen Draw-/Credit-Malus und keine Runtime-Wirkung.

## Relevante Kartenlinien

| Karte oder Linie |
| --- |
${cardRows}

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Coverage-Faelle | ${input.aggregate.cases} |
| Faelle mit Witness-Projection | ${input.aggregate.casesWithWitnessProjection} |
| Witness-Projections | ${input.aggregate.witnessProjections} |
| witness-buildable Cases | ${input.aggregate.witnessBuildableCases} |
| sichtbare Coverage-Loesung | ${input.aggregate.visibleCoverageSolutionCases} |
| Install/Search-Pfad | ${input.aggregate.installOrSearchPathCases} |
| Runtime-Effekte | ${input.aggregate.runtimeEffects} |

## Cases

| Case | Visible solution | Install | Search | Witness-Projections | Buildable | Gate | TargetRefs |
| --- | --- | --- | --- | ---: | ---: | --- | --- |
${caseRows}

## Blocker

| Blocker | Count |
| --- | ---: |
${blockerRows}

## Schluss

AI208 findet Coverage-Faelle mit TargetRef-gebundenen Witness-Projections, aber 0 witness-buildable Kandidaten. Der Blocker bleibt nicht ein Draw-/Credit-Scoreproblem, sondern fehlende echte LegalActionWitness-/actionId-Evidence.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai208-coverage-witness-review.ts\`
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
