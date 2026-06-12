import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

type ProofCategory =
  | "same_state_legal_better"
  | "historical_only_not_legal_now"
  | "legal_but_risk_blocked"
  | "legal_but_no_progress_advantage"
  | "unknown_missing_target_context";

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

type ChallengerReport = {
  comparisons: Array<{
    caseId: string;
    pair: string;
    seed: string;
    dominantSubcluster: string;
    legacySelected: {
      actionIndex: number;
      side: string;
      actionType: string;
      progressLabel: ProgressLabel;
    };
    challengerSelected: {
      actionIndex: number;
      side: string;
      actionType: string;
      progressLabel: ProgressLabel;
    };
    noGo: boolean;
  }>;
};

type Probe = {
  matrix: Array<{
    pair: { id: string };
    summaries: Array<{
      seed: string;
      actionAlternativeSnapshots?: Array<{
        actionIndex: number;
        selectedActionType: string;
        alternatives: AlternativeSnapshot[];
      }>;
    }>;
  }>;
};

type AlternativeSnapshot = {
  rank?: number;
  actionType: string;
  semanticActionType?: string;
  selected?: boolean;
  scoreKeys?: string[];
  hardGates?: string[];
  targetContextStatus?: string;
  expectedProgressLabel?: ProgressLabel;
  blockedReason?: string;
  whyChosen?: string[];
  whyNot?: string[];
};

const FORBIDDEN_REDACTION_MARKERS =
  /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState|AIInput|DecisionDebug/i;

const repoRoot = findRepoRoot(process.cwd());
const challenger = JSON.parse(
  readFileSync(
    resolve(
      repoRoot,
      "docs/reviews/ai/ai136-semantic-shadow-endwindow-challenger-2026-06-12.json",
    ),
    "utf8",
  ),
) as ChallengerReport;
const probe = JSON.parse(
  readFileSync(
    resolve(
      repoRoot,
      "docs/reviews/ai/ai140-same-state-alternative-probe-2026-06-12.json",
    ),
    "utf8",
  ),
) as Probe;
const jsonOut = resolve(
  repoRoot,
  "docs/reviews/ai/ai140-same-state-challenger-proof-2026-06-12.json",
);
const mdOut = resolve(
  repoRoot,
  "docs/reviews/ai/ai140-same-state-challenger-proof-2026-06-12.md",
);

const improvements = challenger.comparisons.filter((entry) => !entry.noGo);
const proofCases = improvements.map((entry) => {
  const summary = findSummary(entry.pair, entry.seed);
  const sameStateSnapshot = summary?.actionAlternativeSnapshots?.find(
    (snapshot) => snapshot.actionIndex === entry.legacySelected.actionIndex,
  );
  const matchingAlternative = sameStateSnapshot?.alternatives.find(
    (alternative) =>
      alternative.actionType === entry.challengerSelected.actionType &&
      alternative.selected !== true,
  );
  const category = classifyProof(
    entry.legacySelected.progressLabel,
    entry.challengerSelected.progressLabel,
    sameStateSnapshot,
    matchingAlternative,
  );
  return {
    caseId: entry.caseId,
    pair: entry.pair,
    seed: entry.seed,
    dominantSubcluster: entry.dominantSubcluster,
    legacySelected: entry.legacySelected,
    historicalChallenger: entry.challengerSelected,
    sameStateSnapshotAvailable: Boolean(sameStateSnapshot),
    sameStateAlternativeMatched: Boolean(matchingAlternative),
    category,
    proof: {
      legalAtSameState: Boolean(matchingAlternative),
      affordableAtSameState: affordabilityKnown(matchingAlternative),
      sideSafeTargetKnown: sideSafeTargetKnown(matchingAlternative),
      hardOrRiskBlocked: hardOrRiskBlocked(matchingAlternative),
      betterProgressDelta:
        labelScore(entry.challengerSelected.progressLabel) >
        labelScore(entry.legacySelected.progressLabel),
      targetContextStatus:
        matchingAlternative?.targetContextStatus ??
        sameStateSnapshot?.alternatives[0]?.targetContextStatus ??
        "missing",
    },
    sameStateAlternatives:
      sameStateSnapshot?.alternatives.map((alternative) => ({
        rank: alternative.rank,
        actionType: alternative.actionType,
        semanticActionType: alternative.semanticActionType,
        selected: alternative.selected,
        targetContextStatus: alternative.targetContextStatus,
        expectedProgressLabel: alternative.expectedProgressLabel,
        hardGates: alternative.hardGates ?? [],
        blockedReason: alternative.blockedReason,
        scoreKeys: alternative.scoreKeys ?? [],
      })) ?? [],
  };
});
const categoryCounts = countBy(proofCases, (entry) => entry.category);
const output = {
  schemaVersion: "ai140-same-state-challenger-proof-v1",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  source: {
    challenger: "docs/reviews/ai/ai136-semantic-shadow-endwindow-challenger-2026-06-12.json",
    sameStateProbe: "docs/reviews/ai/ai140-same-state-alternative-probe-2026-06-12.json",
  },
  redaction: scanRedaction({ proofCases }),
  aggregate: {
    candidates: proofCases.length,
    categoryCounts,
    sameStateLegalBetter: categoryCounts.same_state_legal_better ?? 0,
    sameStateAlternativesMatched: proofCases.filter(
      (entry) => entry.sameStateAlternativeMatched,
    ).length,
    missingTargetContext: categoryCounts.unknown_missing_target_context ?? 0,
  },
  proofCases,
};

mkdirSync(dirname(jsonOut), { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(output, null, 2)}\n`, "utf8");
writeFileSync(mdOut, renderMarkdown(output), "utf8");
console.log(JSON.stringify(output.aggregate, null, 2));

function findSummary(pair: string, seed: string) {
  return probe.matrix
    .find((entry) => entry.pair.id.toUpperCase() === pair.toUpperCase())
    ?.summaries.find((entry) => entry.seed === seed);
}

function classifyProof(
  legacyLabel: ProgressLabel,
  challengerLabel: ProgressLabel,
  sameStateSnapshot: { alternatives: AlternativeSnapshot[] } | undefined,
  matchingAlternative: AlternativeSnapshot | undefined,
): ProofCategory {
  if (!sameStateSnapshot) return "unknown_missing_target_context";
  if (!matchingAlternative) return "historical_only_not_legal_now";
  if (hardOrRiskBlocked(matchingAlternative)) return "legal_but_risk_blocked";
  if (labelScore(challengerLabel) <= labelScore(legacyLabel)) {
    return "legal_but_no_progress_advantage";
  }
  return "same_state_legal_better";
}

function affordabilityKnown(alternative: AlternativeSnapshot | undefined): boolean {
  if (!alternative) return false;
  const text = [
    ...(alternative.scoreKeys ?? []),
    ...(alternative.whyChosen ?? []),
    ...(alternative.whyNot ?? []),
    alternative.blockedReason,
  ]
    .filter(Boolean)
    .join("|")
    .toLocaleLowerCase("en-US");
  return !/unaffordable|not_affordable|blocked_by_credits/.test(text);
}

function sideSafeTargetKnown(alternative: AlternativeSnapshot | undefined): boolean {
  if (!alternative) return false;
  return (
    alternative.targetContextStatus !== undefined &&
    alternative.targetContextStatus !== "opaque" &&
    alternative.targetContextStatus !== "missing"
  );
}

function hardOrRiskBlocked(alternative: AlternativeSnapshot | undefined): boolean {
  if (!alternative) return false;
  return (
    (alternative.hardGates?.length ?? 0) > 0 ||
    alternative.targetContextStatus === "blocked_by_hard_gate" ||
    Boolean(alternative.blockedReason)
  );
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

function renderMarkdown(output: {
  gitHead: string;
  redaction: { safe: boolean };
  aggregate: {
    candidates: number;
    categoryCounts: Record<string, number>;
    sameStateLegalBetter: number;
    sameStateAlternativesMatched: number;
    missingTargetContext: number;
  };
  proofCases: Array<{
    caseId: string;
    dominantSubcluster: string;
    legacySelected: { side: string; actionType: string; progressLabel: ProgressLabel };
    historicalChallenger: { side: string; actionType: string; progressLabel: ProgressLabel };
    sameStateSnapshotAvailable: boolean;
    sameStateAlternativeMatched: boolean;
    category: ProofCategory;
    proof: { targetContextStatus: string };
  }>;
}): string {
  return `# AI140 Same-State Challenger Proof

Datum: 2026-06-12

Branch: \`codex/ai140-ai148-semantic-endgame-optimization\`

## Ziel

AI140 prüft die 17 AI136-Verbesserungskandidaten gegen opt-in same-state Alternative-Snapshots. Ein historischer Challenger zählt nur dann als Cutover-tauglich, wenn am exakten Legacy-Entscheidungspunkt eine passende LegalAction-Alternative mit besserem Progress-Delta sichtbar ist.

## Methode

- AI136 liefert die historischen Verbesserungskandidaten.
- Der vollständige x10-Alternative-Probe \`ai140-same-state-alternative-probe-2026-06-12.json\` liefert redaction-safe Alternative-Snapshots.
- Geprüft wird nur \`actionIndex === legacySelected.actionIndex\`.
- Es wird keine Runtime-Entscheidung verändert.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| AI136-Verbesserungskandidaten | ${output.aggregate.candidates} |
| same-state Alternative matched | ${output.aggregate.sameStateAlternativesMatched} |
| same-state legal better | ${output.aggregate.sameStateLegalBetter} |
| missing target context | ${output.aggregate.missingTargetContext} |
| Redaction-safe | ${output.redaction.safe ? 1 : 0} |

## Kategorien

${markdownCountTable(output.aggregate.categoryCounts, "Kategorie")}

## Kandidaten

| Case | Subcluster | Legacy | historischer Challenger | same-state Snapshot | same-state Match | Kategorie | TargetContext |
| --- | --- | --- | --- | ---: | ---: | --- | --- |
${output.proofCases
  .map(
    (entry) =>
      `| \`${entry.caseId}\` | \`${entry.dominantSubcluster}\` | ${entry.legacySelected.side}/${entry.legacySelected.actionType}/\`${entry.legacySelected.progressLabel}\` | ${entry.historicalChallenger.side}/${entry.historicalChallenger.actionType}/\`${entry.historicalChallenger.progressLabel}\` | ${entry.sameStateSnapshotAvailable ? 1 : 0} | ${entry.sameStateAlternativeMatched ? 1 : 0} | \`${entry.category}\` | \`${entry.proof.targetContextStatus}\` |`,
  )
  .join("\n")}

## Schluss

AI140 belegt keine produktionsreife same-state Cutover-Freigabe. Die meisten AI136-Verbesserungen bleiben historische Hinweise oder haben am exakten Legacy-Entscheidungspunkt keinen passenden Alternative-Snapshot. Diese Fälle werden in AI141 nach TargetContext-Gaps weiter geprüft.

## Artefakte

- \`docs/reviews/ai/ai140-same-state-alternative-probe-2026-06-12.json\`
- \`docs/reviews/ai/ai140-same-state-challenger-proof-2026-06-12.json\`

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-selfplay-trace-matrix.ts --out docs/reviews/ai/ai140-same-state-alternative-probe-2026-06-12.json --seeds ai-v143-tuning-001,ai-v143-tuning-002,ai-v143-tuning-003,ai-v143-tuning-004,ai-v143-tuning-005,ai-v143-tuning-006,ai-v143-tuning-007,ai-v143-tuning-008,ai-v143-tuning-009,ai-v143-tuning-010 --max-actions 160 --max-findings 80 --include-action-alternatives --max-alternatives-per-finding 8\`
- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai140-same-state-challenger-proof.ts\`
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
