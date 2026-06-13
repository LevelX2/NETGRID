import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

type Ai170 = {
  cases: Array<{
    caseId: string;
    dominantSubcluster: string;
    snapshots: Array<{
      requestKind: string;
      snapshotAvailable: boolean;
      snapshot?: {
        actionIndex: number;
        side: "runner" | "corp";
        selectedActionType: string;
        alternatives: Array<{
          actionType: string;
          semanticActionType: string;
          targetContextStatus: string;
          expectedProgressLabel: string;
          hardGates: string[];
          blockedReason?: string;
        }>;
      };
      proofSummary?: {
        progressAlternatives: number;
        targetContextComplete: boolean;
        hardGateBlockedAlternatives: number;
      };
    }>;
  }>;
};

const repoRoot = findRepoRoot(process.cwd());
const input = readJson<Ai170>("docs/reviews/ai/ai170-opportunity-state-snapshots-2026-06-13.json");
const jsonOut = resolve(repoRoot, "docs/reviews/ai/ai173-runner-coverage-opportunity-solver-2026-06-13.json");
const mdOut = resolve(repoRoot, "docs/reviews/ai/ai173-runner-coverage-opportunity-solver-2026-06-13.md");

const cases = input.cases
  .filter((entry) => runnerCoverageRelevant(entry.dominantSubcluster))
  .map((entry) => {
    const snapshots = entry.snapshots.filter((snapshot) => snapshot.snapshotAvailable && snapshot.snapshot);
    const alternatives = snapshots.flatMap((snapshot) => snapshot.snapshot?.alternatives ?? []);
    const path = coveragePathForAlternatives(alternatives);
    const cutover = cutoverStatus(snapshots, path);
    return {
      caseId: entry.caseId,
      dominantSubcluster: entry.dominantSubcluster,
      snapshotCount: snapshots.length,
      visibleInstallableSolution: alternatives.some(isVisibleInstallCoverage),
      searchSolution: alternatives.some(isSearchCoverage),
      drawSolution: alternatives.some((alternative) => alternative.actionType === "draw_card"),
      creditNeeded: alternatives.some((alternative) => alternative.actionType === "gain_credit"),
      noSolutionVisible: path === "no_solution_visible",
      path,
      cutover,
      topActions: alternatives.slice(0, 6).map((alternative) => ({
        actionType: alternative.actionType,
        semanticActionType: alternative.semanticActionType,
        targetContextStatus: alternative.targetContextStatus,
        expectedProgressLabel: alternative.expectedProgressLabel,
        blocked: Boolean(alternative.blockedReason || alternative.hardGates.length > 0),
      })),
    };
  });

const output = {
  schemaVersion: "ai173-runner-coverage-opportunity-solver-v1",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  source: "docs/reviews/ai/ai170-opportunity-state-snapshots-2026-06-13.json",
  aggregate: {
    cases: cases.length,
    cutoverCandidates: cases.filter((entry) => entry.cutover === "cutover_candidate").length,
    noGoCases: cases.filter((entry) => entry.cutover !== "cutover_candidate").length,
    pathCounts: countBy(cases, (entry) => entry.path),
  },
  cases,
};

mkdirSync(dirname(jsonOut), { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(output, null, 2)}\n`, "utf8");
writeFileSync(mdOut, renderMarkdown(output), "utf8");
console.log(JSON.stringify(output.aggregate, null, 2));

function runnerCoverageRelevant(subcluster: string): boolean {
  return /runner|coverage|continue_chain|run_microstep|break_pump|access_pending|breach_pending/.test(subcluster);
}

function coveragePathForAlternatives(alternatives: Ai170["cases"][number]["snapshots"][number]["snapshot"]["alternatives"]): string {
  if (alternatives.some(isVisibleInstallCoverage)) return "visible_installable_solution";
  if (alternatives.some(isSearchCoverage)) return "search_solution";
  if (alternatives.some((alternative) => alternative.actionType === "draw_card")) return "draw_solution";
  if (alternatives.some((alternative) => alternative.actionType === "gain_credit")) return "economy_before_install";
  return "no_solution_visible";
}

function isVisibleInstallCoverage(alternative: {
  actionType: string;
  semanticActionType: string;
  expectedProgressLabel: string;
}): boolean {
  return (
    alternative.actionType === "install_card" &&
    (alternative.semanticActionType === "coverage_setup" ||
      alternative.expectedProgressLabel.startsWith("progress_"))
  );
}

function isSearchCoverage(alternative: { actionType: string; semanticActionType: string }): boolean {
  return alternative.actionType === "trigger_ability" && /search|coverage/.test(alternative.semanticActionType);
}

function cutoverStatus(
  snapshots: Ai170["cases"][number]["snapshots"],
  path: string,
): "cutover_candidate" | "no_go_missing_snapshot" | "no_go_no_progress_path" | "no_go_hard_gate_or_target_context" {
  if (snapshots.length === 0) return "no_go_missing_snapshot";
  const hasProgress = snapshots.some((snapshot) => (snapshot.proofSummary?.progressAlternatives ?? 0) > 0);
  if (!hasProgress || path === "no_solution_visible") return "no_go_no_progress_path";
  const targetOk = snapshots.some((snapshot) => snapshot.proofSummary?.targetContextComplete === true);
  const hardGateFree = snapshots.some((snapshot) => (snapshot.proofSummary?.hardGateBlockedAlternatives ?? 0) === 0);
  return targetOk && hardGateFree ? "cutover_candidate" : "no_go_hard_gate_or_target_context";
}

function renderMarkdown(input: typeof output): string {
  const pathRows = Object.entries(input.aggregate.pathCounts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([path, count]) => `| \`${path}\` | ${count} |`)
    .join("\n");
  const caseRows = input.cases
    .map(
      (entry) =>
        `| \`${entry.caseId}\` | \`${entry.dominantSubcluster}\` | ${entry.snapshotCount} | \`${entry.path}\` | \`${entry.cutover}\` |`,
    )
    .join("\n");
  return `# AI173 Runner Coverage Opportunity Solver

Datum: 2026-06-13

Branch: \`codex/ai170-ai180-opportunity-snapshots\`

## Ziel

AI173 prüft Runner-Coverage-Fälle aus AI170-Snapshots auf konkrete, side-safe Opportunity-LegalActions. Das Ranking bleibt shadow-only: sichtbare installierbare Coverage vor Search, Draw und Credit, aber nur bei vorhandener LegalAction-Evidence.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Coverage-nahe Fälle | ${input.aggregate.cases} |
| Cutover-Kandidaten | ${input.aggregate.cutoverCandidates} |
| No-Go-Fälle | ${input.aggregate.noGoCases} |

## Pfade

| Pfad | Fälle |
| --- | ---: |
${pathRows}

## Fälle

| Case | Subcluster | Snapshots | Pfad | Cutover |
| --- | --- | ---: | --- | --- |
${caseRows}

## Schluss

AI173 findet Coverage-nahe Snapshot-Pfade und markiert erste shadow-only Cutover-Kandidaten. Diese Kandidaten sind noch keine Runtime-Freigabe: AI177 muss erst das übergreifende Gate prüfen und AI178 darf höchstens genau einen belegten Kandidaten testen.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai173-runner-coverage-opportunity-solver.ts\`
- \`git diff --check\`
`;
}

function countBy<T>(entries: readonly T[], keyFor: (entry: T) => string): Record<string, number> {
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
