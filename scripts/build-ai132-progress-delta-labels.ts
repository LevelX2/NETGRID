import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import {
  labelProgressDeltaWindow,
  type ProgressDeltaAction,
  type ProgressDeltaLabel,
} from "../packages/ai/src/simulation/progress-delta-labeler";

type Corpus = {
  cases: Array<{
    caseId: string;
    pair: string;
    seed: string;
    finalPublicSummary: {
      dominantSubcluster: string;
      dominantSide: string;
    };
    endwindow: ProgressDeltaAction[];
  }>;
};

const FORBIDDEN_REDACTION_MARKERS =
  /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState|AIInput|DecisionDebug/i;

const repoRoot = findRepoRoot(process.cwd());
const sourcePath = resolve(
  repoRoot,
  "docs/reviews/ai/ai131-x10-action-limit-failure-corpus-2026-06-12.json",
);
const jsonOut = resolve(
  repoRoot,
  "docs/reviews/ai/ai132-progress-delta-labeler-2026-06-12.json",
);
const mdOut = resolve(
  repoRoot,
  "docs/reviews/ai/ai132-progress-delta-labeler-review-2026-06-12.md",
);

const corpus = JSON.parse(readFileSync(sourcePath, "utf8")) as Corpus;
const cases = corpus.cases.map((entry) => {
  const labels = labelProgressDeltaWindow(entry.endwindow);
  return {
    caseId: entry.caseId,
    pair: entry.pair,
    seed: entry.seed,
    dominantSubcluster: entry.finalPublicSummary.dominantSubcluster,
    dominantSide: entry.finalPublicSummary.dominantSide,
    labels: labels.map((label, offset) => ({
      actionIndex: entry.endwindow[offset]?.index ?? label.index,
      actionType: entry.endwindow[offset]?.actionType ?? "unknown",
      side: entry.endwindow[offset]?.side ?? "unknown",
      label: label.label,
      primaryProgress: label.primaryProgress,
      followUp: label.followUp,
      rationale: label.rationale,
    })),
  };
});
const flatLabels = cases.flatMap((entry) => entry.labels);
const labelCounts = countBy(flatLabels, (entry) => entry.label);
const directProgressActions = flatLabels.filter((entry) => entry.primaryProgress);
const noProgressStaleActions = flatLabels.filter(
  (entry) => entry.label === "no_progress_stale",
);
const redaction = scanRedaction({ cases, labelCounts });
const output = {
  schemaVersion: "ai132-progress-delta-labels-v1",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  source: "docs/reviews/ai/ai131-x10-action-limit-failure-corpus-2026-06-12.json",
  redaction,
  aggregate: {
    cases: cases.length,
    actions: flatLabels.length,
    labelCounts,
    directProgressActions: directProgressActions.length,
    noProgressStaleActions: noProgressStaleActions.length,
    staleShare:
      flatLabels.length === 0
        ? 0
        : Number((noProgressStaleActions.length / flatLabels.length).toFixed(4)),
  },
  cases,
};

mkdirSync(dirname(jsonOut), { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(output, null, 2)}\n`, "utf8");
writeFileSync(mdOut, renderMarkdown(output), "utf8");
console.log(JSON.stringify(output.aggregate, null, 2));

function renderMarkdown(output: {
  schemaVersion: string;
  gitHead: string;
  redaction: { safe: boolean; forbiddenMarkers: string[] };
  aggregate: {
    cases: number;
    actions: number;
    labelCounts: Record<string, number>;
    directProgressActions: number;
    noProgressStaleActions: number;
    staleShare: number;
  };
  cases: Array<{
    caseId: string;
    dominantSubcluster: string;
    labels: Array<{ label: ProgressDeltaLabel; actionType: string; side: string }>;
  }>;
}): string {
  const caseRows = output.cases.map((entry) => {
    const counts = countBy(entry.labels, (label) => label.label);
    const terminal = entry.labels[entry.labels.length - 1];
    return `| \`${entry.caseId}\` | \`${entry.dominantSubcluster}\` | ${inlineCounts(counts)} | ${terminal?.side ?? "unknown"}/${terminal?.actionType ?? "unknown"} -> \`${terminal?.label ?? "unknown"}\` |`;
  });
  return `# AI132 Progress Delta Labeler Review

Datum: 2026-06-12

Branch: \`codex/ai131-ai139-semantic-endwindow-optimization\`

## Ziel

AI132 klassifiziert jede Action im AI131-x10-Endfenster mit einem Progress- oder No-Progress-Label und ergänzt 5/10/20-Action-Follow-up-Fenster. Das Paket bleibt shadow-only.

## Methode

- Quelle: \`docs/reviews/ai/ai131-x10-action-limit-failure-corpus-2026-06-12.json\`
- Schema: \`${output.schemaVersion}\`
- Git Head: \`${output.gitHead}\`
- Direkte Progress-Labels: Access, Trash, Steal, Score, Flatline, Coverage-Install, Reachability und Server-Protection.
- Economy wird nur als \`progress_economy_converted\` gezählt, wenn im 20-Action-Follow-up ein direkter Progress-Schritt sichtbar ist.
- Reserve-, Coverage-, Protection- und Affordability-Signale bleiben \`no_progress_plausible\`, wenn sie nicht direkt konvertieren.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Fälle | ${output.aggregate.cases} |
| gelabelte Actions | ${output.aggregate.actions} |
| direkte/konvertierte Progress-Actions | ${output.aggregate.directProgressActions} |
| stale No-Progress-Actions | ${output.aggregate.noProgressStaleActions} |
| stale Anteil | ${output.aggregate.staleShare} |
| Redaction-safe | ${output.redaction.safe ? 1 : 0} |

## Labelverteilung

${markdownCountTable(output.aggregate.labelCounts, "Label")}

## Fälle

| Case | dominanter Subcluster | Labels im Endfenster | Terminal-Label |
| --- | --- | --- | --- |
${caseRows.join("\n")}

## Schlüsse

- AI132 trennt notwendige Run-Mikroschritte und sichtbaren Progress klar von echten stale Endfenster-Aktionen.
- Economy ist nicht automatisch Fortschritt; sie wird nur bei späterer sichtbarer Konversion als \`progress_economy_converted\` markiert.
- Das Labelset ist geeignet, AI133-AI136 mit Ziel- und Alternativbewertung zu speisen, ohne Runtime-Verhalten zu ändern.

## Artefakt

- \`docs/reviews/ai/ai132-progress-delta-labeler-2026-06-12.json\`

## Verifikation

- \`corepack pnpm --filter @netgrid/ai test -- progress-delta-labeler\`
- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai132-progress-delta-labels.ts\`
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

function markdownCountTable(counts: Record<string, number>, label: string): string {
  const rows = rankedCounts(counts).map(
    (entry) => `| \`${entry.key}\` | ${entry.value} |`,
  );
  return [`| ${label} | Actions |`, "| --- | ---: |", ...rows].join("\n");
}

function inlineCounts(counts: Record<string, number>): string {
  return rankedCounts(counts)
    .map((entry) => `${entry.key}:${entry.value}`)
    .join(", ");
}

function rankedCounts(
  counts: Record<string, number>,
): Array<{ key: string; value: number }> {
  return Object.entries(counts)
    .map(([key, value]) => ({ key, value }))
    .sort((left, right) => right.value - left.value || left.key.localeCompare(right.key));
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
