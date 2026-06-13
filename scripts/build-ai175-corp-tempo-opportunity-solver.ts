import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

type Ai170 = {
  cases: Array<{
    caseId: string;
    dominantSubcluster: string;
    snapshots: Array<{
      snapshotAvailable: boolean;
      snapshot?: {
        side: "runner" | "corp";
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
        targetContextComplete: boolean;
        hardGateBlockedAlternatives: number;
      };
    }>;
  }>;
};

const repoRoot = findRepoRoot(process.cwd());
const input = readJson<Ai170>("docs/reviews/ai/ai170-opportunity-state-snapshots-2026-06-13.json");
const jsonOut = resolve(repoRoot, "docs/reviews/ai/ai175-corp-tempo-opportunity-solver-2026-06-13.json");
const mdOut = resolve(repoRoot, "docs/reviews/ai/ai175-corp-tempo-opportunity-solver-2026-06-13.md");

const cases = input.cases
  .filter((entry) => corpTempoRelevant(entry.dominantSubcluster))
  .map((entry) => {
    const snapshots = entry.snapshots.filter((snapshot) => snapshot.snapshotAvailable && snapshot.snapshot);
    const alternatives = snapshots.flatMap((snapshot) => snapshot.snapshot?.alternatives ?? []);
    const classes = sortedUnique(alternatives.map(corpTempoClassForAlternative));
    const primaryPath = primaryPathForClasses(classes);
    const cutover = cutoverStatus(snapshots, alternatives, primaryPath);
    return {
      caseId: entry.caseId,
      dominantSubcluster: entry.dominantSubcluster,
      snapshotCount: snapshots.length,
      classes,
      primaryPath,
      scorelineLegal: alternatives.some((alternative) => alternative.actionType === "score_agenda"),
      advanceLegal: alternatives.some((alternative) => alternative.actionType === "advance_card"),
      protectionLegal: alternatives.some((alternative) => /protect|rez|install/.test(corpTempoClassForAlternative(alternative))),
      economyVisible: alternatives.some((alternative) => alternative.actionType === "gain_credit"),
      punishVisible: alternatives.some((alternative) => corpTempoClassForAlternative(alternative) === "punish"),
      cutover,
    };
  });

const output = {
  schemaVersion: "ai175-corp-tempo-opportunity-solver-v1",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  source: "docs/reviews/ai/ai170-opportunity-state-snapshots-2026-06-13.json",
  aggregate: {
    cases: cases.length,
    cutoverCandidates: cases.filter((entry) => entry.cutover === "cutover_candidate").length,
    noGoCases: cases.filter((entry) => entry.cutover !== "cutover_candidate").length,
    pathCounts: countBy(cases, (entry) => entry.primaryPath),
  },
  cases,
};

mkdirSync(dirname(jsonOut), { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(output, null, 2)}\n`, "utf8");
writeFileSync(mdOut, renderMarkdown(output), "utf8");
console.log(JSON.stringify(output.aggregate, null, 2));

function corpTempoRelevant(subcluster: string): boolean {
  return /corp|continue_chain|runner_late|run_microstep/.test(subcluster);
}

function corpTempoClassForAlternative(alternative: {
  actionType: string;
  semanticActionType: string;
  targetContextStatus: string;
}): string {
  const text = `${alternative.actionType}|${alternative.semanticActionType}|${alternative.targetContextStatus}`.toLocaleLowerCase("en-US");
  if (/score_agenda|scoreline/.test(text)) return "scoreline";
  if (/advance_card/.test(text)) return "advance";
  if (/rez_ice|protect|server_protection/.test(text)) return "protection";
  if (/install_card/.test(text)) return "install_protection";
  if (/credit|economy|operation/.test(text)) return "economy";
  if (/tag|punish|damage|trash_resource/.test(text)) return "punish";
  if (/trigger_ability|ability/.test(text)) return "opaque_ability";
  return "opaque_or_basic";
}

function primaryPathForClasses(classes: string[]): string {
  for (const candidate of ["scoreline", "advance", "protection", "install_protection", "punish", "economy", "opaque_ability"]) {
    if (classes.includes(candidate)) return candidate;
  }
  return "opaque_or_basic";
}

function cutoverStatus(
  snapshots: Ai170["cases"][number]["snapshots"],
  alternatives: NonNullable<Ai170["cases"][number]["snapshots"][number]["snapshot"]>["alternatives"],
  path: string,
): "cutover_candidate" | "no_go_missing_snapshot" | "no_go_no_tempo_path" | "no_go_hard_gate_or_target_context" {
  if (snapshots.length === 0) return "no_go_missing_snapshot";
  if (path === "economy" || path === "opaque_ability" || path === "opaque_or_basic") {
    return "no_go_no_tempo_path";
  }
  const hasProgress = alternatives.some((alternative) => alternative.expectedProgressLabel.startsWith("progress_"));
  if (!hasProgress) return "no_go_no_tempo_path";
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
        `| \`${entry.caseId}\` | \`${entry.dominantSubcluster}\` | ${entry.snapshotCount} | \`${entry.primaryPath}\` | ${entry.classes.map((value) => `\`${value}\``).join(", ")} | \`${entry.cutover}\` |`,
    )
    .join("\n");
  return `# AI175 Corp Tempo Opportunity Solver

Datum: 2026-06-13

Branch: \`codex/ai170-ai180-opportunity-snapshots\`

## Ziel

AI175 übersetzt Corp-Endgame-Tempo aus AI170-Snapshots in konkrete shadow-only Pfade: Scoreline, Advance, Protection, Economy, Punish oder opake Ability. Es gibt keine Runtime-Wirkung.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Corp-/mixed-Fälle | ${input.aggregate.cases} |
| Cutover-Kandidaten | ${input.aggregate.cutoverCandidates} |
| No-Go-Fälle | ${input.aggregate.noGoCases} |

## Pfade

| Pfad | Fälle |
| --- | ---: |
${pathRows}

## Fälle

| Case | Subcluster | Snapshots | Primärpfad | Klassen | Cutover |
| --- | --- | ---: | --- | --- | --- |
${caseRows}

## Schluss

AI175 zeigt, dass Corp-Tempo aus Snapshots konkreter prüfbar ist. Cutover-Kandidaten bleiben dennoch vorläufig, bis AI177 das Gate und AI178 höchstens einen bewiesenen Kandidaten auswählt.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai175-corp-tempo-opportunity-solver.ts\`
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

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort();
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
