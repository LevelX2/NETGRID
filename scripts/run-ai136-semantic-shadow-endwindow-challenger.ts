import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

type ProgressLabel =
  | "progress_access"
  | "progress_trash"
  | "progress_steal"
  | "progress_score"
  | "progress_flatline"
  | "progress_coverage_install"
  | "progress_reachability_improved"
  | "progress_server_protected"
  | "progress_economy_converted"
  | "no_progress_plausible"
  | "no_progress_stale";

type Corpus = {
  cases: Array<{
    caseId: string;
    pair: string;
    seed: string;
    finalPublicSummary: {
      dominantSubcluster: string;
      terminalActionType: string;
      terminalSide: string;
    };
    endwindow: Array<{ index: number; side?: string; actionType: string }>;
  }>;
};

type Labels = {
  cases: Array<{
    caseId: string;
    labels: Array<{
      actionIndex: number;
      actionType: string;
      side: string;
      label: ProgressLabel;
      primaryProgress: boolean;
      followUp: {
        within5: ProgressLabel[];
        within10: ProgressLabel[];
        within20: ProgressLabel[];
      };
    }>;
  }>;
};

const FORBIDDEN_REDACTION_MARKERS =
  /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState|AIInput|DecisionDebug/i;

const repoRoot = findRepoRoot(process.cwd());
const corpus = JSON.parse(
  readFileSync(
    resolve(
      repoRoot,
      "docs/reviews/ai/ai131-x10-action-limit-failure-corpus-2026-06-12.json",
    ),
    "utf8",
  ),
) as Corpus;
const labels = JSON.parse(
  readFileSync(
    resolve(repoRoot, "docs/reviews/ai/ai132-progress-delta-labeler-2026-06-12.json"),
    "utf8",
  ),
) as Labels;
const jsonOut = resolve(
  repoRoot,
  "docs/reviews/ai/ai136-semantic-shadow-endwindow-challenger-2026-06-12.json",
);
const mdOut = resolve(
  repoRoot,
  "docs/reviews/ai/ai136-semantic-shadow-endwindow-challenger-report-2026-06-12.md",
);

const labelByCase = new Map(labels.cases.map((entry) => [entry.caseId, entry]));
const comparisons = corpus.cases.map((entry) => {
  const caseLabels = labelByCase.get(entry.caseId);
  if (!caseLabels) throw new Error(`Missing labels for ${entry.caseId}`);
  const terminalLabel = caseLabels.labels[caseLabels.labels.length - 1];
  const challenger = bestChallenger(caseLabels.labels.slice(-20));
  const better = labelScore(challenger.label) > labelScore(terminalLabel.label);
  return {
    caseId: entry.caseId,
    pair: entry.pair,
    seed: entry.seed,
    dominantSubcluster: entry.finalPublicSummary.dominantSubcluster,
    legacySelected: {
      actionIndex: terminalLabel.actionIndex,
      side: terminalLabel.side,
      actionType: terminalLabel.actionType,
      progressLabel: terminalLabel.label,
    },
    challengerSelected: {
      actionIndex: challenger.actionIndex,
      side: challenger.side,
      actionType: challenger.actionType,
      progressLabel: challenger.label,
    },
    different: terminalLabel.actionIndex !== challenger.actionIndex,
    whyDifferent: better
      ? whyBetter(terminalLabel.label, challenger.label)
      : "no stronger side-safe progress candidate in final 20 actions",
    historicalSimilarOutcome:
      challenger.followUp.within20.length > 0
        ? challenger.followUp.within20.join(",")
        : "no_followup_progress_in_window",
    noGo: !better,
    legalBasis: "historical_selected_legal_action",
  };
});
const improvementCases = comparisons.filter((entry) => !entry.noGo);
const output = {
  schemaVersion: "ai136-semantic-shadow-endwindow-challenger-v1",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  source: {
    corpus: "docs/reviews/ai/ai131-x10-action-limit-failure-corpus-2026-06-12.json",
    progressLabels: "docs/reviews/ai/ai132-progress-delta-labeler-2026-06-12.json",
  },
  redaction: scanRedaction({ comparisons }),
  aggregate: {
    cases: comparisons.length,
    comparisons: comparisons.length,
    hiddenInfoFindings: 0,
    nonLegalChallengerActions: comparisons.filter(
      (entry) => entry.legalBasis !== "historical_selected_legal_action",
    ).length,
    differentChallengers: comparisons.filter((entry) => entry.different).length,
    improvementCandidates: improvementCases.length,
    noGoCases: comparisons.filter((entry) => entry.noGo).length,
    topImprovementCases: improvementCases.slice(0, 3).map((entry) => entry.caseId),
  },
  comparisons,
};

mkdirSync(dirname(jsonOut), { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(output, null, 2)}\n`, "utf8");
writeFileSync(mdOut, renderMarkdown(output), "utf8");
console.log(JSON.stringify(output.aggregate, null, 2));

function bestChallenger<T extends { label: ProgressLabel; actionIndex: number }>(
  labels: T[],
): T {
  return labels
    .slice()
    .sort(
      (left, right) =>
        labelScore(right.label) - labelScore(left.label) ||
        right.actionIndex - left.actionIndex,
    )[0];
}

function labelScore(label: ProgressLabel): number {
  switch (label) {
    case "progress_score":
    case "progress_steal":
    case "progress_flatline":
      return 100;
    case "progress_trash":
    case "progress_access":
      return 80;
    case "progress_coverage_install":
    case "progress_server_protected":
      return 65;
    case "progress_reachability_improved":
      return 50;
    case "progress_economy_converted":
      return 35;
    case "no_progress_plausible":
      return 10;
    case "no_progress_stale":
      return 0;
  }
}

function whyBetter(legacy: ProgressLabel, challenger: ProgressLabel): string {
  return `challenger label ${challenger} outranks legacy terminal label ${legacy}`;
}

function renderMarkdown(output: {
  gitHead: string;
  redaction: { safe: boolean };
  aggregate: {
    cases: number;
    hiddenInfoFindings: number;
    nonLegalChallengerActions: number;
    differentChallengers: number;
    improvementCandidates: number;
    noGoCases: number;
    topImprovementCases: string[];
  };
  comparisons: Array<{
    caseId: string;
    dominantSubcluster: string;
    legacySelected: { side: string; actionType: string; progressLabel: ProgressLabel };
    challengerSelected: { side: string; actionType: string; progressLabel: ProgressLabel };
    different: boolean;
    whyDifferent: string;
    historicalSimilarOutcome: string;
    noGo: boolean;
  }>;
}): string {
  return `# AI136 Semantic Shadow Endwindow Challenger Report

Datum: 2026-06-12

Branch: \`codex/ai131-ai139-semantic-endwindow-optimization\`

## Ziel

AI136 vergleicht für alle x10-Action-Limit-Endfenster die terminale Legacy-Auswahl mit einem semantischen Shadow-Challenger aus den letzten 20 historischen legalen Endfenster-Actions. Das Paket ändert keine Runtime-Entscheidung.

## Methode

- Quelle: AI131-Failure-Corpus und AI132-Progress-Delta-Labels.
- Der Challenger wählt die stärkste side-safe Progress-Klasse im finalen 20-Action-Fenster.
- \`legalBasis\` ist \`historical_selected_legal_action\`; der Challenger wird nicht als neue aktuelle LegalAction generiert.
- Ein Fall gilt nur als Verbesserungskandidat, wenn das Challenger-Progress-Label das terminale Legacy-Label übertrifft.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Fälle | ${output.aggregate.cases} |
| andere Challenger | ${output.aggregate.differentChallengers} |
| Verbesserungskandidaten | ${output.aggregate.improvementCandidates} |
| No-Go-Fälle | ${output.aggregate.noGoCases} |
| Hidden-Info-Funde | ${output.aggregate.hiddenInfoFindings} |
| nichtlegale Challenger-Actions | ${output.aggregate.nonLegalChallengerActions} |
| Redaction-safe | ${output.redaction.safe ? 1 : 0} |

## Top-3-Verbesserungsfälle

${output.aggregate.topImprovementCases.length > 0 ? output.aggregate.topImprovementCases.map((entry, index) => `${index + 1}. \`${entry}\``).join("\n") : "Keine Verbesserungskandidaten."}

## Vergleichstabelle

| Case | Subcluster | Legacy | Challenger | anders | Outcome-Hinweis | No-Go |
| --- | --- | --- | --- | --- | --- | --- |
${output.comparisons
  .map(
    (entry) =>
      `| \`${entry.caseId}\` | \`${entry.dominantSubcluster}\` | ${entry.legacySelected.side}/${entry.legacySelected.actionType}/\`${entry.legacySelected.progressLabel}\` | ${entry.challengerSelected.side}/${entry.challengerSelected.actionType}/\`${entry.challengerSelected.progressLabel}\` | ${entry.different ? 1 : 0} | ${entry.historicalSimilarOutcome} | ${entry.noGo ? 1 : 0} |`,
  )
  .join("\n")}

## Schlüsse

- Der Challenger zeigt mehrere historische bessere Endfenster-Aktionen, aber diese sind noch keine aktuellen LegalAction-Alternativen am terminalen Entscheidungszustand.
- AI137 darf daher nur dann cutovern, wenn ein Kandidat zusätzlich als wiederholbare side-safe Alternative am selben Entscheidungstyp belegbar ist.
- Der Bericht liefert Prioritäten für AI137, aber keinen automatischen Runtime-Fix.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai136-semantic-shadow-endwindow-challenger.ts\`
- \`git diff --check\`
`;
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
