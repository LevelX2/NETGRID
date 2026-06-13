import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

type Label = {
  actionIndex: number;
  actionType: string;
  side: string;
  label: string;
  followUp: { within5: string[]; within10: string[]; within20: string[] };
};

type Labels = {
  cases: Array<{ caseId: string; dominantSubcluster: string; labels: Label[] }>;
};

type SameStateProbe = {
  cases: Array<{
    caseId: string;
    dominantSubcluster: string;
    legacySelected: { actionIndex: number; side: string; actionType: string; progressLabel: string };
    historicalChallenger: { actionIndex: number; side: string; actionType: string; progressLabel: string };
  }>;
};

type OpportunityCategory =
  | "opportunity_same_state_better"
  | "opportunity_legal_but_risk_blocked"
  | "opportunity_target_context_missing"
  | "opportunity_not_legal"
  | "no_opportunity_state_found";

const FORBIDDEN_REDACTION_MARKERS =
  /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState|AIInput|DecisionDebug|deckTop/i;
const repoRoot = findRepoRoot(process.cwd());
const labels = readJson<Labels>("docs/reviews/ai/ai132-progress-delta-labeler-2026-06-12.json");
const sameState = readJson<SameStateProbe>(
  "docs/reviews/ai/ai149-same-state-challenger-probe-2026-06-12.json",
);
const jsonOut = resolve(repoRoot, "docs/reviews/ai/ai159-opportunity-state-mining-2026-06-12.json");
const mdOut = resolve(repoRoot, "docs/reviews/ai/ai159-opportunity-state-mining-2026-06-12.md");

const labelsByCase = new Map(labels.cases.map((entry) => [entry.caseId, entry]));
const cases = sameState.cases.map((candidate) => {
  const labelCase = labelsByCase.get(candidate.caseId);
  const progress = labelCase?.labels.find((label) => isProgress(label.label));
  const previousSameSide = progress
    ? [...(labelCase?.labels ?? [])]
        .filter((label) => label.actionIndex < progress.actionIndex && label.side === progress.side)
        .at(-1)
    : undefined;
  const category = classifyOpportunity(progress, previousSameSide);
  return {
    caseId: candidate.caseId,
    dominantSubcluster: candidate.dominantSubcluster,
    terminalLegacy: candidate.legacySelected,
    historicalChallenger: candidate.historicalChallenger,
    firstProgressAction: progress
      ? {
          actionIndex: progress.actionIndex,
          side: progress.side,
          actionType: progress.actionType,
          progressLabel: progress.label,
        }
      : null,
    precedingSameSideDecision: previousSameSide
      ? {
          actionIndex: previousSameSide.actionIndex,
          side: previousSameSide.side,
          actionType: previousSameSide.actionType,
          progressLabel: previousSameSide.label,
        }
      : null,
    legalActionSnapshotAvailable: false,
    sameStateProgressAlternativeFound: false,
    category,
    blocker:
      category === "opportunity_target_context_missing"
        ? "no_earlier_legal_action_snapshot_in_failure_corpus"
        : category === "no_opportunity_state_found"
          ? "no_progress_action_in_endwindow"
          : "none",
  };
});
const categoryCounts = countBy(cases, (entry) => entry.category);
const output = {
  schemaVersion: "ai159-opportunity-state-mining-v1",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  source: {
    sameStateProbe: "docs/reviews/ai/ai149-same-state-challenger-probe-2026-06-12.json",
    progressLabels: "docs/reviews/ai/ai132-progress-delta-labeler-2026-06-12.json",
  },
  redaction: scanRedaction({ cases }),
  aggregate: {
    cases: cases.length,
    categoryCounts,
    opportunitySameStateBetter: categoryCounts.opportunity_same_state_better ?? 0,
    opportunityTargetContextMissing: categoryCounts.opportunity_target_context_missing ?? 0,
    noOpportunityStateFound: categoryCounts.no_opportunity_state_found ?? 0,
  },
  cases,
};

mkdirSync(dirname(jsonOut), { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(output, null, 2)}\n`, "utf8");
writeFileSync(mdOut, renderMarkdown(output), "utf8");
console.log(JSON.stringify(output.aggregate, null, 2));

function classifyOpportunity(
  progress: Label | undefined,
  previousSameSide: Label | undefined,
): OpportunityCategory {
  if (!progress || !previousSameSide) return "no_opportunity_state_found";
  return "opportunity_target_context_missing";
}

function isProgress(label: string): boolean {
  return label.startsWith("progress_");
}

function renderMarkdown(output: typeof output): string {
  return `# AI159 Opportunity-State Mining

Datum: 2026-06-12

Branch: \`codex/ai159-ai169-endgame-opportunity\`

## Ziel

AI159 prüft die 17 AI149-Fälle nicht am terminalen Zustand, sondern sucht den frühesten Progress-Punkt im Endfenster und die vorhergehende Entscheidung derselben Seite. Der Korpus enthält für diese früheren Punkte keine vollständigen LegalAction-Snapshots; diese Lücke wird ausdrücklich als TargetContext-/Snapshot-Blocker klassifiziert.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Fälle | ${output.aggregate.cases} |
| Opportunity same-state better | ${output.aggregate.opportunitySameStateBetter} |
| Opportunity TargetContext missing | ${output.aggregate.opportunityTargetContextMissing} |
| No Opportunity State Found | ${output.aggregate.noOpportunityStateFound} |
| Redaction-safe | ${output.redaction.safe ? 1 : 0} |

## Kategorien

${markdownCountTable(output.aggregate.categoryCounts, "Kategorie")}

## Fälle

| Case | Subcluster | First Progress | Previous Same-Side Decision | Legal Snapshot | Kategorie | Blocker |
| --- | --- | --- | --- | ---: | --- | --- |
${output.cases
  .map(
    (entry) =>
      `| \`${entry.caseId}\` | \`${entry.dominantSubcluster}\` | ${entry.firstProgressAction ? `${entry.firstProgressAction.side}/${entry.firstProgressAction.actionType}@${entry.firstProgressAction.actionIndex}/\`${entry.firstProgressAction.progressLabel}\`` : "none"} | ${entry.precedingSameSideDecision ? `${entry.precedingSameSideDecision.side}/${entry.precedingSameSideDecision.actionType}@${entry.precedingSameSideDecision.actionIndex}/\`${entry.precedingSameSideDecision.progressLabel}\`` : "none"} | ${entry.legalActionSnapshotAvailable ? 1 : 0} | \`${entry.category}\` | \`${entry.blocker}\` |`,
  )
  .join("\n")}

## Schluss

AI159 findet frühere Opportunity-Fenster, aber keine verwertbaren LegalAction-Snapshots für diese Zeitpunkte. Damit ist der nächste reale Engpass nicht Scoring, sondern Fixture-/Trace-Instrumentierung: Opportunity-State-Snapshots müssen LegalActions, TargetContext, Kosten- und Timingprofile enthalten, bevor ein Cutover möglich wird.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai159-opportunity-state-mining.ts\`
- \`git diff --check\`
`;
}

function markdownCountTable(counts: Record<string, number>, label: string): string {
  const rows = Object.entries(counts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `| \`${key}\` | ${value} |`);
  return [`| ${label} | Fälle |`, "| --- | ---: |", ...rows].join("\n");
}

function countBy<T>(entries: readonly T[], keyFor: (entry: T) => string): Record<string, number> {
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
  return { safe: matches === null, forbiddenMarkers: matches ? Array.from(new Set(matches)) : [] };
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
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}
