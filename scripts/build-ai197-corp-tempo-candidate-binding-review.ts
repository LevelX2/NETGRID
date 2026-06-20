import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { CandidatePathBinding } from "../packages/ai/src/candidate-path-binding";
import type { CandidateTargetIdentityResolution } from "../packages/ai/src/target-identity-resolver";
import type { PlayerActionDryRunBuildResult } from "../packages/ai/src/playeraction-dry-run-builder";

type Ai175 = {
  cases: Array<{
    caseId: string;
    dominantSubcluster: string;
    snapshotCount: number;
    classes: string[];
    primaryPath: string;
    scorelineLegal: boolean;
    advanceLegal: boolean;
    protectionLegal: boolean;
    economyVisible: boolean;
    punishVisible: boolean;
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
type Ai195 = {
  cases: Array<{
    caseId: string;
    replacementGoal: string;
  }>;
};

const repoRoot = findRepoRoot(process.cwd());
const ai175 = readJson<Ai175>("docs/reviews/ai/ai175-corp-tempo-opportunity-solver-2026-06-13.json");
const ai191 = readJson<Ai191>("docs/reviews/ai/ai191-candidate-path-bindings-v1.json");
const ai192 = readJson<Ai192>("docs/reviews/ai/ai192-target-identity-v2-candidate-paths.json");
const ai193 = readJson<Ai193>("docs/reviews/ai/ai193-playeraction-dry-run-builder.json");
const ai195 = readJson<Ai195>("docs/reviews/ai/ai195-stale-punish-replacement-shadow.json");
const jsonOut = resolve(repoRoot, "docs/reviews/ai/ai197-corp-tempo-candidate-binding-review.json");
const mdOut = resolve(repoRoot, "docs/reviews/ai/ai197-corp-tempo-candidate-binding-review.md");

const bindingContext = ai191.bindings.map((entry, index) => ({
  ...entry,
  targetIdentity: ai192.reviews[index]?.resolution,
  dryRun: ai193.builds[index]?.result,
}));
const replacementByCase = new Map(ai195.cases.map((entry) => [entry.caseId, entry.replacementGoal]));

const cases = ai175.cases.map((entry) => {
  const bindings = bindingContext.filter(
    (binding) =>
      binding.reviewScope === "corp_tempo_candidate" &&
      binding.family === "corp_tempo" &&
      binding.caseId === entry.caseId,
  );
  const completeTargetIdentities = bindings.filter(
    (binding) =>
      binding.targetIdentity?.status === "complete" ||
      binding.targetIdentity?.status === "irrelevant",
  );
  const dryRunBuilt = bindings.filter((binding) => binding.dryRun?.status === "built");
  const replacementGoal = replacementByCase.get(entry.caseId) ?? "not_in_stale_punish_shadow";
  const candidateFamilies = [
    ...(entry.scorelineLegal ? ["scoreline"] : []),
    ...(entry.advanceLegal ? ["advance"] : []),
    ...(entry.protectionLegal ? ["protection_rez"] : []),
    ...(entry.economyVisible ? ["economy_to_scoreline"] : []),
    ...(replacementGoal !== "no_replacement_candidate" &&
    replacementGoal !== "not_in_stale_punish_shadow"
      ? ["punish_replacement"]
      : []),
  ];
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
    primaryPath: entry.primaryPath,
    previousCutover: entry.cutover,
    candidateFamilies,
    scorelineLegal: entry.scorelineLegal,
    advanceLegal: entry.advanceLegal,
    protectionLegal: entry.protectionLegal,
    economyVisible: entry.economyVisible,
    punishVisible: entry.punishVisible,
    punishReplacementGoal: replacementGoal,
    candidatePathBindings: bindings.length,
    completeOrIrrelevantTargetIdentities: completeTargetIdentities.length,
    dryRunBuilt: dryRunBuilt.length,
    dryRunCapable: dryRunBuilt.length > 0,
    sourceDefinitions: [
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
  schemaVersion: "ai197-corp-tempo-candidate-binding-review",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  sources: {
    ai175: "docs/reviews/ai/ai175-corp-tempo-opportunity-solver-2026-06-13.json",
    ai191: "docs/reviews/ai/ai191-candidate-path-bindings-v1.json",
    ai192: "docs/reviews/ai/ai192-target-identity-v2-candidate-paths.json",
    ai193: "docs/reviews/ai/ai193-playeraction-dry-run-builder.json",
    ai195: "docs/reviews/ai/ai195-stale-punish-replacement-shadow.json",
  },
  relevantCardPaths: [
    "Corporate Boon",
    "Corporate Coup",
    "Political Coup",
    "Project Consultants",
    "Management Shake-Up",
    "Systematic Layoffs",
    "Chicago Branch",
    "On-Call Solo Team",
    "Scorched Earth",
    "Urban Renewal",
    "Solo Squad",
  ],
  aggregate: {
    cases: cases.length,
    dryRunCapable: cases.filter((entry) => entry.dryRunCapable).length,
    blocked: cases.filter((entry) => !entry.dryRunCapable).length,
    bindings: cases.reduce((sum, entry) => sum + entry.candidatePathBindings, 0),
    completeOrIrrelevantTargetIdentityCases: cases.filter(
      (entry) => entry.completeOrIrrelevantTargetIdentities > 0,
    ).length,
    scorelineCases: cases.filter((entry) => entry.candidateFamilies.includes("scoreline")).length,
    protectionCases: cases.filter((entry) => entry.candidateFamilies.includes("protection_rez")).length,
    punishReplacementCases: cases.filter((entry) => entry.candidateFamilies.includes("punish_replacement")).length,
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
        `| \`${entry.caseId}\` | \`${entry.primaryPath}\` | ${entry.candidatePathBindings} | ${entry.completeOrIrrelevantTargetIdentities} | ${entry.dryRunBuilt} | ${entry.candidateFamilies.map((value) => `\`${value}\``).join(", ") || "none"} | \`${entry.punishReplacementGoal}\` | \`${entry.gateStatus}\` |`,
    )
    .join("\n");
  return `# AI197 Corp Tempo Candidate Binding Review

Datum: 2026-06-14

Branch: \`codex/ai191-ai200-binding-replay-proof\`

## Ziel

AI197 prÃ¼ft Corp-Tempo-Kandidaten aus AI175/AI188 mit CandidatePathBinding, TargetIdentity v2, Dry-Run-FÃ¤higkeit und AI195-Punish-Replacement-Shadow. Es wird kein pauschaler Corp-Credit-Malus eingefÃ¼hrt.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Corp-Tempo-FÃ¤lle | ${input.aggregate.cases} |
| Dry-Run-fÃ¤hig | ${input.aggregate.dryRunCapable} |
| blockiert | ${input.aggregate.blocked} |
| CandidatePathBindings | ${input.aggregate.bindings} |
| FÃ¤lle mit complete/irrelevant TargetIdentity | ${input.aggregate.completeOrIrrelevantTargetIdentityCases} |
| Scoreline-FÃ¤lle | ${input.aggregate.scorelineCases} |
| Protection-FÃ¤lle | ${input.aggregate.protectionCases} |
| Punish-Replacement-FÃ¤lle | ${input.aggregate.punishReplacementCases} |
| Runtime-Wirkungen | ${input.aggregate.runtimeEffects} |

## FÃ¤lle

| Case | PrimÃ¤rpfad | Bindings | TargetIdentity complete/irrelevant | Dry-Run gebaut | Familien | Punish Replacement | Gate |
| --- | --- | ---: | ---: | ---: | --- | --- | --- |
${caseRows}

## Blocker

| Blocker | Count |
| --- | ---: |
${blockerRows}

## Schluss

Corp-Tempo-Kandidaten sind mit Binding und TargetIdentity besser eingegrenzt, bleiben aber mangels echter \`actionId\` nicht Dry-Run-fÃ¤hig. Scoreline-, Protection- und Punish-Replacement-Evidence bleibt Shadow-/Review-Material ohne Runtime-Gewichtung.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai197-corp-tempo-candidate-binding-review.ts\`
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
