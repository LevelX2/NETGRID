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

type CoveragePath =
  | "visible_installable_solution"
  | "search_solution"
  | "draw_solution"
  | "economy_before_install"
  | "no_visible_solution"
  | "opportunity_snapshot_missing";

const repoRoot = findRepoRoot(process.cwd());
const labels = readJson<Labels>("docs/reviews/ai/ai132-progress-delta-labeler-2026-06-12.json");
const mdOut = resolve(repoRoot, "docs/reviews/ai/ai161-coverage-path-solver-v2-2026-06-12.md");

const cases = labels.cases
  .filter((entry) => /runner_|continue_chain|run_microstep/.test(entry.dominantSubcluster))
  .map((entry) => classify(entry));
const assertions = runAssertions();

mkdirSync(dirname(mdOut), { recursive: true });
writeFileSync(
  mdOut,
  renderMarkdown({ gitHead: git(["rev-parse", "--short", "HEAD"]), cases, assertions }),
  "utf8",
);
console.log(
  JSON.stringify(
    {
      cases: cases.length,
      pathCounts: countBy(cases, (entry) => entry.coveragePath),
      assertionsPassed: assertions.every((entry) => entry.passed),
      opportunityCandidates: cases.filter((entry) => entry.opportunityCandidate !== "no_go_missing_snapshot").length,
    },
    null,
    2,
  ),
);

function classify(entry: Labels["cases"][number]) {
  const installNow = entry.labels.some((label) => label.actionType === "install_card" && label.label === "progress_coverage_install");
  const searchNow = entry.labels.some(
    (label) =>
      ["activated_card_ability", "play_event", "resolve_choice"].includes(label.actionType) &&
      label.followUp.within20.includes("progress_coverage_install"),
  );
  const drawPath = entry.labels.some(
    (label) => ["draw_card", "mandatory_draw"].includes(label.actionType) && label.followUp.within20.includes("progress_coverage_install"),
  );
  const economyPath = entry.labels.some(
    (label) =>
      label.actionType === "gain_credit" &&
      (label.followUp.within20.includes("progress_coverage_install") || label.followUp.within20.includes("progress_reachability_improved")),
  );
  const coveragePath = choosePath({ installNow, searchNow, drawPath, economyPath });
  return {
    caseId: entry.caseId,
    dominantSubcluster: entry.dominantSubcluster,
    missingIceType: inferIceType(entry.dominantSubcluster),
    visibleInstallable: installNow,
    searchSolution: searchNow,
    drawSolution: drawPath && !installNow && !searchNow,
    economyBeforeInstall: economyPath && !installNow && !searchNow && !drawPath,
    coveragePath,
    namedPathExamples: pathExamples(coveragePath),
    opportunityCandidate:
      coveragePath === "visible_installable_solution" || coveragePath === "search_solution"
        ? "candidate_needs_opportunity_legal_snapshot"
        : "no_go_missing_snapshot",
  };
}

function choosePath(input: {
  installNow: boolean;
  searchNow: boolean;
  drawPath: boolean;
  economyPath: boolean;
}): CoveragePath {
  if (input.installNow) return "visible_installable_solution";
  if (input.searchNow) return "search_solution";
  if (input.drawPath) return "draw_solution";
  if (input.economyPath) return "economy_before_install";
  return "no_visible_solution";
}

function pathExamples(path: CoveragePath): string {
  switch (path) {
    case "visible_installable_solution":
      return "classic breaker or visible Proteus breaker install";
    case "search_solution":
      return "Self-Modifying Code, Temple Microcode Outlet, The Short Circuit";
    case "draw_solution":
      return "draw only after no visible/searchable option";
    case "economy_before_install":
      return "credit only if install or run cost is concrete";
    case "no_visible_solution":
      return "no side-safe path visible";
    case "opportunity_snapshot_missing":
      return "no LegalAction snapshot";
  }
}

function inferIceType(subcluster: string): string {
  if (/wall/.test(subcluster)) return "wall";
  if (/code/.test(subcluster)) return "code_gate";
  if (/sentry/.test(subcluster)) return "sentry";
  if (/run_microstep|continue_chain/.test(subcluster)) return "reachability";
  return "unknown_or_mixed";
}

function runAssertions() {
  const scenarios = [
    { name: "sichtbar installierbare Coverage > Credit", expected: "visible_installable_solution", actual: choosePath({ installNow: true, searchNow: false, drawPath: false, economyPath: true }) },
    { name: "Suchaktion > Draw bei side-safe Suchziel", expected: "search_solution", actual: choosePath({ installNow: false, searchNow: true, drawPath: true, economyPath: false }) },
    { name: "Credit korrekt bei Kostenpfad", expected: "economy_before_install", actual: choosePath({ installNow: false, searchNow: false, drawPath: false, economyPath: true }) },
    { name: "Draw korrekt ohne installierbare/suchbare Option", expected: "draw_solution", actual: choosePath({ installNow: false, searchNow: false, drawPath: true, economyPath: true }) },
  ];
  return scenarios.map((entry) => ({ ...entry, passed: entry.actual === entry.expected }));
}

function renderMarkdown(input: {
  gitHead: string;
  cases: Array<ReturnType<typeof classify>>;
  assertions: Array<{ name: string; expected: string; actual: string; passed: boolean }>;
}): string {
  return `# AI161 Coverage Path Solver v2

Datum: 2026-06-12

Branch: \`codex/ai159-ai169-endgame-opportunity\`

## Ziel

AI161 trennt Runner-Coverage-Fälle nach konkreten side-safe Pfadtypen. Kartenpfade wie Self-Modifying Code, Temple Microcode Outlet, The Short Circuit und klassische Breaker werden nur als sichtbare oder suchbare Pfadklassen dokumentiert; es wird nicht über unbekannte Stackinhalte geraten.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Coverage-Fälle | ${input.cases.length} |
| Assertions bestanden | ${input.assertions.filter((entry) => entry.passed).length}/${input.assertions.length} |
| Opportunity-Kandidaten | ${input.cases.filter((entry) => entry.opportunityCandidate !== "no_go_missing_snapshot").length} |

## Pfadtypen

${markdownCountTable(countBy(input.cases, (entry) => entry.coveragePath), "Pfad")}

## Assertions

| Test | Erwartet | Erhalten | Ergebnis |
| --- | --- | --- | --- |
${input.assertions.map((entry) => `| ${entry.name} | \`${entry.expected}\` | \`${entry.actual}\` | ${entry.passed ? "pass" : "fail"} |`).join("\n")}

## Fälle

| Case | Subcluster | Missing ICE Type | Install | Search | Draw | Economy | Pfad | Beispiele | Opportunity |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- | --- |
${input.cases
  .map(
    (entry) =>
      `| \`${entry.caseId}\` | \`${entry.dominantSubcluster}\` | \`${entry.missingIceType}\` | ${entry.visibleInstallable ? 1 : 0} | ${entry.searchSolution ? 1 : 0} | ${entry.drawSolution ? 1 : 0} | ${entry.economyBeforeInstall ? 1 : 0} | \`${entry.coveragePath}\` | ${entry.namedPathExamples} | \`${entry.opportunityCandidate}\` |`,
  )
  .join("\n")}

## Schluss

Coverage-Pfade sind konkreter trennbar, aber AI159 zeigt keine verwertbaren Opportunity-LegalAction-Snapshots. Daher bleiben installierbare und suchbare Pfade Kandidaten für Fixture-Aufbau, nicht für Runtime-Cutover.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai161-coverage-path-solver-v2.ts\`
- \`git diff --check\`
`;
}

function markdownCountTable(counts: Record<string, number>, label: string): string {
  const rows = Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)).map(([key, value]) => `| \`${key}\` | ${value} |`);
  return [`| ${label} | Fälle |`, "| --- | ---: |", ...rows].join("\n");
}

function countBy<T>(entries: readonly T[], keyFor: (entry: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const entry of entries) counts[keyFor(entry)] = (counts[keyFor(entry)] ?? 0) + 1;
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
