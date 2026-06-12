import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

type CoverageCategory =
  | "completion_available"
  | "search_needed"
  | "draw_needed"
  | "reserve_needed"
  | "no_solution_visible";

type Corpus = {
  cases: Array<{
    caseId: string;
    pair: string;
    seed: string;
    finalPublicSummary: {
      dominantSide: string;
      dominantSubcluster: string;
    };
    endwindow: Array<{
      actionType: string;
      side?: string;
      runnerSetupMissingCoverageTypes?: string[];
      runnerBelowReserveBefore?: boolean;
      runnerBelowReserveAfter?: boolean;
      runnerPressureReadyTrue?: boolean;
    }>;
  }>;
};

type Labels = {
  cases: Array<{
    caseId: string;
    labels: Array<{ actionType: string; side: string; label: string }>;
  }>;
};

type Proof = {
  proofCases: Array<{
    caseId: string;
    sameStateAlternatives: Array<{
      actionType: string;
      semanticActionType?: string;
      targetContextStatus?: string;
      expectedProgressLabel?: string;
      hardGates?: string[];
    }>;
  }>;
};

const FORBIDDEN_REDACTION_MARKERS =
  /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState|AIInput|DecisionDebug/i;

const repoRoot = findRepoRoot(process.cwd());
const corpus = JSON.parse(
  readFileSync(
    resolve(repoRoot, "docs/reviews/ai/ai131-x10-action-limit-failure-corpus-2026-06-12.json"),
    "utf8",
  ),
) as Corpus;
const labels = JSON.parse(
  readFileSync(
    resolve(repoRoot, "docs/reviews/ai/ai132-progress-delta-labeler-2026-06-12.json"),
    "utf8",
  ),
) as Labels;
const proof = JSON.parse(
  readFileSync(
    resolve(repoRoot, "docs/reviews/ai/ai140-same-state-challenger-proof-2026-06-12.json"),
    "utf8",
  ),
) as Proof;
const mdOut = resolve(
  repoRoot,
  "docs/reviews/ai/ai142-runner-coverage-goal-completion-shadow-2026-06-12.md",
);

const labelByCase = new Map(labels.cases.map((entry) => [entry.caseId, entry]));
const proofByCase = new Map(proof.proofCases.map((entry) => [entry.caseId, entry]));
const runnerCases = corpus.cases
  .filter(
    (entry) =>
      entry.finalPublicSummary.dominantSide === "runner" ||
      entry.finalPublicSummary.dominantSubcluster.includes("runner") ||
      entry.finalPublicSummary.dominantSubcluster.includes("run"),
  )
  .map((entry) => {
    const caseLabels = labelByCase.get(entry.caseId)?.labels ?? [];
    const sameStateAlternatives = proofByCase.get(entry.caseId)?.sameStateAlternatives ?? [];
    const missingCoverageTypes = unique(
      entry.endwindow.flatMap((action) => action.runnerSetupMissingCoverageTypes ?? []),
    );
    const coverageInstallActions = caseLabels.filter(
      (label) => label.label === "progress_coverage_install",
    ).length;
    const sameStateInstallCompletion = sameStateAlternatives.some(
      (alternative) =>
        alternative.actionType === "install_card" &&
        alternative.semanticActionType === "coverage_setup" &&
        alternative.targetContextStatus !== "blocked_by_hard_gate" &&
        (alternative.hardGates?.length ?? 0) === 0,
    );
    const searchSeen = entry.endwindow.some((action) =>
      /search|tutor/.test(action.actionType.toLocaleLowerCase("en-US")),
    );
    const drawSeen = entry.endwindow.some((action) => action.actionType === "draw_card");
    const reserveSeen = entry.endwindow.some(
      (action) =>
        action.actionType === "gain_credit" ||
        action.runnerBelowReserveBefore ||
        action.runnerBelowReserveAfter,
    );
    const category = classify(
      missingCoverageTypes,
      sameStateInstallCompletion,
      coverageInstallActions,
      searchSeen,
      drawSeen,
      reserveSeen,
    );
    return {
      caseId: entry.caseId,
      dominantSubcluster: entry.finalPublicSummary.dominantSubcluster,
      missingCoverageTypes,
      coverageInstallActions,
      sameStateInstallCompletion,
      searchSeen,
      drawSeen,
      reserveSeen,
      category,
      cutoverCandidate:
        category === "completion_available"
          ? "possible_shadow_candidate_needs_same_state_specific_fixture"
          : "no_go",
    };
  });
const categoryCounts = countBy(runnerCases, (entry) => entry.category);
const redaction = scanRedaction({ runnerCases });
mkdirSync(dirname(mdOut), { recursive: true });
writeFileSync(
  mdOut,
  renderMarkdown({
    gitHead: git(["rev-parse", "--short", "HEAD"]),
    runnerCases,
    categoryCounts,
    redaction,
  }),
  "utf8",
);
console.log(
  JSON.stringify(
    {
      cases: runnerCases.length,
      categoryCounts,
      redactionSafe: redaction.safe,
      possibleCandidates: runnerCases.filter(
        (entry) => entry.cutoverCandidate !== "no_go",
      ).length,
    },
    null,
    2,
  ),
);

function classify(
  missingCoverageTypes: string[],
  sameStateInstallCompletion: boolean,
  coverageInstallActions: number,
  searchSeen: boolean,
  drawSeen: boolean,
  reserveSeen: boolean,
): CoverageCategory {
  if (missingCoverageTypes.length === 0 && coverageInstallActions === 0) {
    return "no_solution_visible";
  }
  if (sameStateInstallCompletion || coverageInstallActions > 0) {
    return "completion_available";
  }
  if (searchSeen) return "search_needed";
  if (drawSeen) return "draw_needed";
  if (reserveSeen) return "reserve_needed";
  return "no_solution_visible";
}

function renderMarkdown(input: {
  gitHead: string;
  redaction: { safe: boolean };
  categoryCounts: Record<string, number>;
  runnerCases: Array<{
    caseId: string;
    dominantSubcluster: string;
    missingCoverageTypes: string[];
    coverageInstallActions: number;
    sameStateInstallCompletion: boolean;
    searchSeen: boolean;
    drawSeen: boolean;
    reserveSeen: boolean;
    category: CoverageCategory;
    cutoverCandidate: string;
  }>;
}): string {
  return `# AI142 Runner Coverage Goal Completion Shadow

Datum: 2026-06-12

Branch: \`codex/ai140-ai148-semantic-endgame-optimization\`

## Ziel

AI142 bewertet Runner-dominante x10-Endfenster outcome-basiert danach, ob ein Coverage-Ziel abgeschlossen, gesucht, gezogen, durch Reserve vorbereitet oder sichtbar nicht lösbar war. Das Paket bleibt shadow-only.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| geprüfte Runner-/Run-Fälle | ${input.runnerCases.length} |
| mögliche Shadow-Cutover-Kandidaten | ${input.runnerCases.filter((entry) => entry.cutoverCandidate !== "no_go").length} |
| Redaction-safe | ${input.redaction.safe ? 1 : 0} |

## Kategorien

${markdownCountTable(input.categoryCounts, "Kategorie")}

## Fälle

| Case | Subcluster | Missing Coverage | Completion | Search | Draw | Reserve | Kategorie | Cutover |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- |
${input.runnerCases
  .map(
    (entry) =>
      `| \`${entry.caseId}\` | \`${entry.dominantSubcluster}\` | ${entry.missingCoverageTypes.length > 0 ? entry.missingCoverageTypes.join(",") : "none"} | ${entry.sameStateInstallCompletion || entry.coverageInstallActions > 0 ? 1 : 0} | ${entry.searchSeen ? 1 : 0} | ${entry.drawSeen ? 1 : 0} | ${entry.reserveSeen ? 1 : 0} | \`${entry.category}\` | \`${entry.cutoverCandidate}\` |`,
  )
  .join("\n")}

## Schluss

Runner-Coverage-Completion ist als Shadow-Signal sichtbar, aber AI140 hat keine same-state LegalAction-Cutover-Freigabe geliefert. Fälle mit \`completion_available\` sind Prioritäten für spätere spezifische Fixtures, nicht automatisch Runtime-Fixes. Credit bleibt plausibel, wenn keine konkrete same-state Completion belegt ist.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai142-runner-coverage-goal-completion-shadow.ts\`
- \`git diff --check\`
`;
}

function markdownCountTable(counts: Record<string, number>, label: string): string {
  const rows = Object.entries(counts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `| \`${key}\` | ${value} |`);
  return [`| ${label} | Fälle |`, "| --- | ---: |", ...rows].join("\n");
}

function unique(values: string[]): string[] {
  return [...new Set(values)].sort();
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
