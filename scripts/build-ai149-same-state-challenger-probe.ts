import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

type ProbeCategory =
  | "same_state_legal_better"
  | "same_state_legal_equivalent"
  | "historical_only_not_legal_now"
  | "legal_but_risk_blocked"
  | "legal_but_not_progress_better"
  | "target_context_missing";

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
const challenger = readJson<ChallengerReport>(
  "docs/reviews/ai/ai136-semantic-shadow-endwindow-challenger-2026-06-12.json",
);
const probe = readJson<Probe>(
  "docs/reviews/ai/ai140-same-state-alternative-probe-2026-06-12.json",
);
const jsonOut = resolve(
  repoRoot,
  "docs/reviews/ai/ai149-same-state-challenger-probe-2026-06-12.json",
);
const mdOut = resolve(
  repoRoot,
  "docs/reviews/ai/ai149-same-state-challenger-probe-2026-06-12.md",
);

const candidates = challenger.comparisons.filter((entry) => !entry.noGo);
const cases = candidates.map((entry) => {
  const snapshot = findSameStateSnapshot(entry.pair, entry.seed, entry.legacySelected.actionIndex);
  const exactMatch = snapshot?.alternatives.find(
    (alternative) =>
      alternative.actionType === entry.challengerSelected.actionType &&
      alternative.selected !== true,
  );
  const equivalentMatch = snapshot?.alternatives.find(
    (alternative) =>
      alternative.semanticActionType !== undefined &&
      alternative.semanticActionType === exactMatch?.semanticActionType &&
      alternative.selected !== true,
  );
  const matched = exactMatch ?? equivalentMatch;
  const category = classify(entry.legacySelected.progressLabel, entry.challengerSelected.progressLabel, snapshot, matched);
  return {
    caseId: entry.caseId,
    pair: entry.pair,
    seed: entry.seed,
    dominantSubcluster: entry.dominantSubcluster,
    legacySelected: entry.legacySelected,
    historicalChallenger: entry.challengerSelected,
    sameStateSnapshotAvailable: Boolean(snapshot),
    sameStateLegalActionMatched: Boolean(exactMatch),
    sameStateEquivalentActionMatched: Boolean(!exactMatch && equivalentMatch),
    category,
    proof: {
      legalAtSameState: Boolean(matched),
      hardOrRiskBlocked: hardOrRiskBlocked(matched),
      targetContextStatus: matched?.targetContextStatus ?? "not_present",
      betterProgressDelta:
        labelScore(entry.challengerSelected.progressLabel) >
        labelScore(entry.legacySelected.progressLabel),
      equivalentProgressDelta:
        labelScore(entry.challengerSelected.progressLabel) ===
        labelScore(entry.legacySelected.progressLabel),
    },
    sameStateAlternatives:
      snapshot?.alternatives.map((alternative) => ({
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

const categoryCounts = countBy(cases, (entry) => entry.category);
const output = {
  schemaVersion: "ai149-same-state-challenger-probe-v1",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  source: {
    challenger: "docs/reviews/ai/ai136-semantic-shadow-endwindow-challenger-2026-06-12.json",
    sameStateProbe: "docs/reviews/ai/ai140-same-state-alternative-probe-2026-06-12.json",
  },
  redaction: scanRedaction({ cases }),
  aggregate: {
    candidates: cases.length,
    categoryCounts,
    sameStateLegalBetter: categoryCounts.same_state_legal_better ?? 0,
    sameStateLegalEquivalent: categoryCounts.same_state_legal_equivalent ?? 0,
    historicalOnlyNotLegalNow: categoryCounts.historical_only_not_legal_now ?? 0,
    targetContextMissing: categoryCounts.target_context_missing ?? 0,
    sameStateMatches: cases.filter(
      (entry) => entry.sameStateLegalActionMatched || entry.sameStateEquivalentActionMatched,
    ).length,
  },
  cases,
};

mkdirSync(dirname(jsonOut), { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(output, null, 2)}\n`, "utf8");
writeFileSync(mdOut, renderMarkdown(output), "utf8");
console.log(JSON.stringify(output.aggregate, null, 2));

function findSameStateSnapshot(pair: string, seed: string, actionIndex: number) {
  return probe.matrix
    .find((entry) => entry.pair.id.toUpperCase() === pair.toUpperCase())
    ?.summaries.find((summary) => summary.seed === seed)
    ?.actionAlternativeSnapshots?.find((snapshot) => snapshot.actionIndex === actionIndex);
}

function classify(
  legacyLabel: ProgressLabel,
  challengerLabel: ProgressLabel,
  snapshot: { alternatives: AlternativeSnapshot[] } | undefined,
  matched: AlternativeSnapshot | undefined,
): ProbeCategory {
  if (!snapshot) return "target_context_missing";
  if (!matched) return "historical_only_not_legal_now";
  if (hardOrRiskBlocked(matched)) return "legal_but_risk_blocked";
  const challengerScore = labelScore(challengerLabel);
  const legacyScore = labelScore(legacyLabel);
  if (challengerScore > legacyScore) return "same_state_legal_better";
  if (challengerScore === legacyScore) return "same_state_legal_equivalent";
  return "legal_but_not_progress_better";
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

function renderMarkdown(output: typeof output): string {
  return `# AI149 Same-State Challenger Probe

Datum: 2026-06-12

Branch: \`codex/ai149-ai158-same-state-semantic-endgame\`

## Ziel

AI149 prüft die 17 AI136-Verbesserungskandidaten erneut in den vom neuen Folgeblock geforderten Kategorien. Ein Kandidat ist nur cutover-tauglich, wenn am exakten terminalen Legacy-Entscheidungspunkt eine gleiche oder äquivalente LegalAction-Alternative sichtbar ist.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Kandidaten | ${output.aggregate.candidates} |
| Same-State Matches | ${output.aggregate.sameStateMatches} |
| Same-State Legal Better | ${output.aggregate.sameStateLegalBetter} |
| Same-State Legal Equivalent | ${output.aggregate.sameStateLegalEquivalent} |
| Historical Only Not Legal Now | ${output.aggregate.historicalOnlyNotLegalNow} |
| TargetContext Missing | ${output.aggregate.targetContextMissing} |
| Redaction-safe | ${output.redaction.safe ? 1 : 0} |

## Kategorien

${markdownCountTable(output.aggregate.categoryCounts, "Kategorie")}

## Kandidaten

| Case | Subcluster | Legacy | Historischer Challenger | Snapshot | Match | Kategorie | TargetContext |
| --- | --- | --- | --- | ---: | ---: | --- | --- |
${output.cases
  .map(
    (entry) =>
      `| \`${entry.caseId}\` | \`${entry.dominantSubcluster}\` | ${entry.legacySelected.side}/${entry.legacySelected.actionType}/\`${entry.legacySelected.progressLabel}\` | ${entry.historicalChallenger.side}/${entry.historicalChallenger.actionType}/\`${entry.historicalChallenger.progressLabel}\` | ${entry.sameStateSnapshotAvailable ? 1 : 0} | ${entry.sameStateLegalActionMatched || entry.sameStateEquivalentActionMatched ? 1 : 0} | \`${entry.category}\` | \`${entry.proof.targetContextStatus}\` |`,
  )
  .join("\n")}

## Schluss

AI149 findet keinen produktionsfähigen same-state Kandidaten. Alle 17 Verbesserungshinweise bleiben historische Challenger: Die bessere Aktion war im Korpus vorhanden, aber am terminalen Legacy-Entscheidungspunkt nicht als gleiche oder äquivalente LegalAction-Alternative belegt. Damit bleibt der Block weiterhin in Shadow-/Diagnosearbeit, bis ein späterer Fixture-Aufbau echte same-state Kandidaten liefert.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai149-same-state-challenger-probe.ts\`
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
