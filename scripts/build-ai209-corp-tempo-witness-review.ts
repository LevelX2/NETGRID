import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

type Ai197 = {
  relevantCardPaths: string[];
  aggregate: {
    cases: number;
    dryRunCapable: number;
    bindings: number;
    completeOrIrrelevantTargetIdentityCases: number;
    scorelineCases: number;
    protectionCases: number;
    punishReplacementCases: number;
    runtimeEffects: number;
  };
  cases: Array<{
    caseId: string;
    dominantSubcluster: string;
    primaryPath: string;
    previousCutover: string;
    candidateFamilies: string[];
    scorelineLegal: boolean;
    advanceLegal: boolean;
    protectionLegal: boolean;
    economyVisible: boolean;
    punishVisible: boolean;
    punishReplacementGoal: string;
    candidatePathBindings: number;
    completeOrIrrelevantTargetIdentities: number;
    dryRunBuilt: number;
    dryRunCapable: boolean;
    sourceDefinitions: string[];
    blockers: string[];
    gateStatus: string;
  }>;
};

type Ai203 = {
  projections: Array<{
    reviewScope: string;
    source: string;
    family: string;
    caseId: string;
    primaryPath: string;
    semanticActionType: string;
    projection: {
      targetRef: {
        identity: string;
        sideSafe: boolean;
        snapshotStable: boolean;
      };
      candidatePathBindingFromWitness: boolean;
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
const ai197 = readJson<Ai197>("docs/reviews/ai/ai197-corp-tempo-candidate-binding-review.json");
const ai203 = readJson<Ai203>("docs/reviews/ai/ai203-witness-opportunity-snapshots.json");
const ai205 = readJson<Ai205>("docs/reviews/ai/ai205-playeraction-builder-from-witness.json");
const jsonOut = resolve(repoRoot, "docs/reviews/ai/ai209-corp-tempo-witness-review.json");
const mdOut = resolve(repoRoot, "docs/reviews/ai/ai209-corp-tempo-witness-review.md");

const cases = ai197.cases.map((entry) => {
  const projections = ai203.projections.filter(
    (projection) => projection.family === "corp_tempo" && projection.caseId === entry.caseId,
  );
  const builds = ai205.builds.filter((build) => build.family === "corp_tempo" && build.caseId === entry.caseId);
  const blockers = [
    ...entry.blockers,
    ...projections.flatMap((projection) => projection.projection.blockers),
    ...builds.flatMap((build) => build.result.blockers),
  ];
  return {
    ...entry,
    witnessProjections: projections.length,
    targetRefs: [...new Set(projections.map((projection) => projection.projection.targetRef.identity))],
    completeOrIrrelevantTargetRefs: projections.filter(
      (projection) =>
        projection.projection.targetRef.identity === "none" ||
        (projection.projection.targetRef.sideSafe && projection.projection.targetRef.snapshotStable),
    ).length,
    witnessBuildable: builds.filter((build) => build.result.status === "built").length,
    witnessActionTypes: [...new Set(projections.map((projection) => projection.semanticActionType))].sort(),
    witnessSources: [...new Set(projections.map((projection) => projection.reviewScope))].sort(),
    blockers: [...new Set(blockers)].sort(),
    gateStatus: builds.some((build) => build.result.status === "built") ? "candidate_buildable" : "blocked",
  };
});

const output = {
  schemaVersion: "ai209-corp-tempo-witness-review",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  sources: {
    ai197: "docs/reviews/ai/ai197-corp-tempo-candidate-binding-review.json",
    ai203: "docs/reviews/ai/ai203-witness-opportunity-snapshots.json",
    ai205: "docs/reviews/ai/ai205-playeraction-builder-from-witness.json",
  },
  relevantCardPaths: ai197.relevantCardPaths,
  aggregate: {
    cases: cases.length,
    casesWithWitnessProjection: cases.filter((entry) => entry.witnessProjections > 0).length,
    witnessProjections: cases.reduce((sum, entry) => sum + entry.witnessProjections, 0),
    witnessBuildableCases: cases.filter((entry) => entry.witnessBuildable > 0).length,
    completeOrIrrelevantTargetRefs: cases.reduce((sum, entry) => sum + entry.completeOrIrrelevantTargetRefs, 0),
    scorelineCases: ai197.aggregate.scorelineCases,
    advanceLegalCases: cases.filter((entry) => entry.advanceLegal).length,
    protectionCases: ai197.aggregate.protectionCases,
    punishReplacementCases: ai197.aggregate.punishReplacementCases,
    dryRunCapable: ai197.aggregate.dryRunCapable,
    runtimeEffects: 0,
  },
  blockerCounts: countBy(cases.flatMap((entry) => entry.blockers), (blocker) => blocker),
  actionTypeCounts: countBy(
    cases.flatMap((entry) => entry.witnessActionTypes),
    (actionType) => actionType,
  ),
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
        `| \`${entry.caseId}\` | \`${entry.primaryPath}\` | ${entry.advanceLegal ? "yes" : "no"} | ${entry.protectionLegal ? "yes" : "no"} | ${entry.witnessProjections} | ${entry.completeOrIrrelevantTargetRefs} | ${entry.witnessBuildable} | \`${entry.gateStatus}\` | ${entry.targetRefs.map((ref) => `\`${ref}\``).join(", ") || "none"} |`,
    )
    .join("\n");
  const blockerRows = Object.entries(input.blockerCounts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([blocker, count]) => `| \`${blocker}\` | ${count} |`)
    .join("\n");
  const actionRows = Object.entries(input.actionTypeCounts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([actionType, count]) => `| \`${actionType}\` | ${count} |`)
    .join("\n");
  const cardRows = input.relevantCardPaths.map((card) => `| ${card} |`).join("\n");
  return `# AI209 Corp Scoreline/Tempo Witness Review

Datum: 2026-06-14

Branch: \`codex/ai201-ai212-witness-proof\`

## Ziel

AI209 prueft Corp-Scoreline-/Tempo-Kandidaten gegen Witness/TargetRef-Evidence. Es gibt keine generischen Credit-/Draw-/Run-Punishments, keine Runtime-Gewichte und keine Runtime-Wirkung.

## Relevante Kartenlinien

| Karte oder Linie |
| --- |
${cardRows}

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Corp-Tempo-Faelle | ${input.aggregate.cases} |
| Faelle mit Witness-Projection | ${input.aggregate.casesWithWitnessProjection} |
| Witness-Projections | ${input.aggregate.witnessProjections} |
| complete/irrelevant TargetRefs | ${input.aggregate.completeOrIrrelevantTargetRefs} |
| witness-buildable Cases | ${input.aggregate.witnessBuildableCases} |
| Scoreline-Cases | ${input.aggregate.scorelineCases} |
| Advance legal Cases | ${input.aggregate.advanceLegalCases} |
| Protection-Cases | ${input.aggregate.protectionCases} |
| Punish-Replacement-Cases | ${input.aggregate.punishReplacementCases} |
| Dry-run-capable | ${input.aggregate.dryRunCapable} |
| Runtime-Effekte | ${input.aggregate.runtimeEffects} |

## Witness Action Types

| Action Type | Count |
| --- | ---: |
${actionRows}

## Cases

| Case | Primaerpfad | Advance legal | Protection legal | Witness-Projections | TargetRefs complete/irrelevant | Buildable | Gate | TargetRefs |
| --- | --- | --- | --- | ---: | ---: | ---: | --- | --- |
${caseRows}

## Blocker

| Blocker | Count |
| --- | ---: |
${blockerRows}

## Schluss

AI209 findet Corp-Tempo-/Scoreline-Faelle mit TargetRef-gebundenen Witness-Projections, aber 0 witness-buildable Kandidaten. Advance/Protection/Scoreline bleiben dadurch weiter ein Evidence-Thema: Ohne echte LegalActionWitnesses und aus Witness abgeleitete CandidatePathBindings gibt es keinen Micro-Cutover.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai209-corp-tempo-witness-review.ts\`
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
