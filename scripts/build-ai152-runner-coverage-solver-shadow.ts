import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

type Labels = {
  cases: Array<{
    caseId: string;
    dominantSubcluster: string;
    labels: Array<{
      actionIndex: number;
      actionType: string;
      side: string;
      label: string;
      followUp: { within5: string[]; within10: string[]; within20: string[] };
    }>;
  }>;
};

type CoverageCategory =
  | "coverage_install_now"
  | "coverage_search_now"
  | "coverage_draw_needed"
  | "coverage_credit_needed"
  | "coverage_no_visible_path"
  | "coverage_goal_stale";

const FORBIDDEN_REDACTION_MARKERS =
  /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState|AIInput|DecisionDebug|deckTop/i;

const repoRoot = findRepoRoot(process.cwd());
const labels = readJson<Labels>("docs/reviews/ai/ai132-progress-delta-labeler-2026-06-12.json");
const mdOut = resolve(
  repoRoot,
  "docs/reviews/ai/ai152-runner-coverage-solver-shadow-2026-06-12.md",
);

const runnerCases = labels.cases
  .filter((entry) =>
    /runner_|continue_chain|run_microstep/.test(entry.dominantSubcluster),
  )
  .map((entry) => classifyCase(entry));
const assertions = runAssertions();
const redaction = scanRedaction({ runnerCases, assertions });

mkdirSync(dirname(mdOut), { recursive: true });
writeFileSync(
  mdOut,
  renderMarkdown({
    gitHead: git(["rev-parse", "--short", "HEAD"]),
    redaction,
    runnerCases,
    assertions,
  }),
  "utf8",
);
console.log(
  JSON.stringify(
    {
      cases: runnerCases.length,
      categoryCounts: countBy(runnerCases, (entry) => entry.category),
      assertionsPassed: assertions.every((entry) => entry.passed),
      redactionSafe: redaction.safe,
    },
    null,
    2,
  ),
);

function classifyCase(entry: Labels["cases"][number]) {
  const actionTypes = new Set(entry.labels.map((label) => label.actionType));
  const labelNames = new Set(entry.labels.map((label) => label.label));
  const hasInstallCoverage = entry.labels.some(
    (label) => label.actionType === "install_card" && label.label === "progress_coverage_install",
  );
  const hasSearchCoverage = entry.labels.some(
    (label) =>
      ["activated_card_ability", "play_event", "resolve_choice"].includes(label.actionType) &&
      label.followUp.within20.includes("progress_coverage_install"),
  );
  const hasDrawCoverage = entry.labels.some(
    (label) =>
      ["draw_card", "mandatory_draw"].includes(label.actionType) &&
      label.followUp.within20.includes("progress_coverage_install"),
  );
  const hasCreditCoverage = entry.labels.some(
    (label) =>
      label.actionType === "gain_credit" &&
      (label.followUp.within20.includes("progress_coverage_install") ||
        label.followUp.within20.includes("progress_reachability_improved")),
  );
  const staleCoverage = entry.labels.filter(
    (label) =>
      label.label === "no_progress_stale" &&
      label.followUp.within20.every(
        (followUp) =>
          !["progress_coverage_install", "progress_reachability_improved", "progress_access"].includes(followUp),
      ),
  ).length;
  const missingCoverage = inferMissingCoverage(entry.dominantSubcluster, actionTypes, labelNames);
  const category = chooseCategory({
    hasInstallCoverage,
    hasSearchCoverage,
    hasDrawCoverage,
    hasCreditCoverage,
    staleCoverage,
  });
  return {
    caseId: entry.caseId,
    dominantSubcluster: entry.dominantSubcluster,
    missingCoverage,
    visibleInstallableCoverage: hasInstallCoverage,
    searchableCoverage: hasSearchCoverage,
    drawCoveragePath: hasDrawCoverage && !hasInstallCoverage && !hasSearchCoverage,
    creditCoveragePath:
      hasCreditCoverage && !hasInstallCoverage && !hasSearchCoverage && !hasDrawCoverage,
    staleCoverageActions: staleCoverage,
    category,
    cutover: "shadow_only_needs_same_state_fixture",
  };
}

function chooseCategory(input: {
  hasInstallCoverage: boolean;
  hasSearchCoverage: boolean;
  hasDrawCoverage: boolean;
  hasCreditCoverage: boolean;
  staleCoverage: number;
}): CoverageCategory {
  if (input.hasInstallCoverage) return "coverage_install_now";
  if (input.hasSearchCoverage) return "coverage_search_now";
  if (input.hasDrawCoverage) return "coverage_draw_needed";
  if (input.hasCreditCoverage) return "coverage_credit_needed";
  if (input.staleCoverage > 0) return "coverage_goal_stale";
  return "coverage_no_visible_path";
}

function inferMissingCoverage(
  subcluster: string,
  actionTypes: Set<string>,
  labelNames: Set<string>,
): string {
  if (/wall/.test(subcluster)) return "wall";
  if (/code/.test(subcluster)) return "code_gate";
  if (/run_microstep|continue_chain/.test(subcluster)) return "reachability_step";
  if (actionTypes.has("pump_breaker")) return "breaker_pump_cost";
  if (labelNames.has("progress_coverage_install")) return "specific_visible_gap";
  return "unknown_or_none_visible";
}

function runAssertions() {
  const scenarios = [
    {
      name: "sichtbarer Wall-Breaker vor Credit",
      expected: "coverage_install_now",
      actual: chooseCategory({
        hasInstallCoverage: true,
        hasSearchCoverage: false,
        hasDrawCoverage: false,
        hasCreditCoverage: true,
        staleCoverage: 0,
      }),
    },
    {
      name: "Search-Action vor Draw",
      expected: "coverage_search_now",
      actual: chooseCategory({
        hasInstallCoverage: false,
        hasSearchCoverage: true,
        hasDrawCoverage: true,
        hasCreditCoverage: false,
        staleCoverage: 0,
      }),
    },
    {
      name: "Credit bleibt korrekt bei konkretem Kostenpfad",
      expected: "coverage_credit_needed",
      actual: chooseCategory({
        hasInstallCoverage: false,
        hasSearchCoverage: false,
        hasDrawCoverage: false,
        hasCreditCoverage: true,
        staleCoverage: 0,
      }),
    },
    {
      name: "keine Stack-Hidden-Info",
      expected: "coverage_no_visible_path",
      actual: chooseCategory({
        hasInstallCoverage: false,
        hasSearchCoverage: false,
        hasDrawCoverage: false,
        hasCreditCoverage: false,
        staleCoverage: 0,
      }),
    },
  ];
  return scenarios.map((entry) => ({
    ...entry,
    passed: entry.actual === entry.expected,
  }));
}

function renderMarkdown(input: {
  gitHead: string;
  redaction: { safe: boolean };
  runnerCases: Array<ReturnType<typeof classifyCase>>;
  assertions: Array<{ name: string; expected: string; actual: string; passed: boolean }>;
}): string {
  return `# AI152 Runner Coverage Solver Shadow

Datum: 2026-06-12

Branch: \`codex/ai149-ai158-same-state-semantic-endgame\`

## Ziel

AI152 macht Runner-Coverage-Planung konkreter: sichtbare oder suchbare Coverage schlägt Draw, Draw schlägt Credit, und Credit zählt nur, wenn er einen konkreten Coverage- oder Reachability-Pfad ermöglicht. Das Paket bleibt shadow-only.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Runner-/Run-Fälle | ${input.runnerCases.length} |
| Assertions bestanden | ${input.assertions.filter((entry) => entry.passed).length}/${input.assertions.length} |
| Redaction-safe | ${input.redaction.safe ? 1 : 0} |

## Kategorien

${markdownCountTable(countBy(input.runnerCases, (entry) => entry.category), "Kategorie")}

## Assertions

| Test | Erwartet | Erhalten | Ergebnis |
| --- | --- | --- | --- |
${input.assertions
  .map(
    (entry) =>
      `| ${entry.name} | \`${entry.expected}\` | \`${entry.actual}\` | ${entry.passed ? "pass" : "fail"} |`,
  )
  .join("\n")}

## Fälle

| Case | Subcluster | Missing Coverage | Install | Search | Draw | Credit | Stale | Kategorie | Cutover |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
${input.runnerCases
  .map(
    (entry) =>
      `| \`${entry.caseId}\` | \`${entry.dominantSubcluster}\` | \`${entry.missingCoverage}\` | ${entry.visibleInstallableCoverage ? 1 : 0} | ${entry.searchableCoverage ? 1 : 0} | ${entry.drawCoveragePath ? 1 : 0} | ${entry.creditCoveragePath ? 1 : 0} | ${entry.staleCoverageActions} | \`${entry.category}\` | \`${entry.cutover}\` |`,
  )
  .join("\n")}

## Schluss

Der Solver trennt konkrete Coverage-Pfade von bloßer Reserve. Sichtbare und suchbare Coverage wird als bessere Shadow-Priorität markiert; Credit bleibt nur dann Coverage-Pfad, wenn keine direkte oder suchbare Lösung sichtbar ist und ein späterer Coverage-/Reachability-Fortschritt im side-safe Label-Corpus folgt. AI149 liefert weiterhin keinen same-state Cutover-Kandidaten.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai152-runner-coverage-solver-shadow.ts\`
- \`git diff --check\`
`;
}

function markdownCountTable(counts: Record<string, number>, label: string): string {
  const rows = Object.entries(counts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `| \`${key}\` | ${value} |`);
  return [`| ${label} | Fälle |`, "| --- | ---: |", ...rows].join("\n");
}

function countBy<T>(
  entries: readonly T[],
  keyFor: (entry: T) => string,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const entry of entries) {
    const key = keyFor(entry);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function scanRedaction(value: unknown): { safe: boolean; forbiddenMarkers: string[] } {
  const text = JSON.stringify(value);
  const matches = text.match(FORBIDDEN_REDACTION_MARKERS);
  return {
    safe: matches === null,
    forbiddenMarkers: matches ? Array.from(new Set(matches)) : [],
  };
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(resolve(repoRoot, relativePath), "utf8")) as T;
}

function findRepoRoot(start: string): string {
  let current = resolve(start);
  for (;;) {
    try {
      const packageJson = JSON.parse(
        readFileSync(join(current, "package.json"), "utf8"),
      ) as { name?: string };
      if (packageJson.name === "netgrid-app") return current;
    } catch {
      // Continue walking up.
    }
    const parent = dirname(current);
    if (parent === current) {
      throw new Error(`Could not find NETGRID repo root from ${start}`);
    }
    current = parent;
  }
}

function git(args: string[]): string {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}
