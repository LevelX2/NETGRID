import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  buildReplayDecisionCaseExtractionReport,
  type ReplayDecisionCaseExtractionReport,
  type ReplayDecisionTraceInput,
} from "../packages/ai/src/evaluation/replay-decision-case-extraction";

const repoRoot = findRepoRoot(process.cwd());
const runId = safeRunId(optionValue("--run-id") ?? "latest");
const outputDir = resolve(
  repoRoot,
  optionValue("--out-dir") ?? `data/local/ai-replay/${runId}`,
);
const dbPath =
  optionValue("--db") ??
  join(repoRoot, "data/runtime/multiplayer/netgrid.sqlite");
const maxCreatedAt = optionValue("--max-created-at");
const jsonOut = resolve(outputDir, `${runId}-decision-cases.json`);
const mdOut = resolve(outputDir, `${runId}-decision-cases.md`);

const db = new DatabaseSync(dbPath, { readOnly: true });
const rows = (
  maxCreatedAt
    ? db
        .prepare(
          `${selectTraceRowsSql()}
           WHERE t.created_at <= ?
           ORDER BY m.created_at ASC, t.decision_index ASC, t.trace_id ASC`,
        )
        .all(maxCreatedAt)
    : db
        .prepare(
          `${selectTraceRowsSql()}
           ORDER BY m.created_at ASC, t.decision_index ASC, t.trace_id ASC`,
        )
        .all()
) as Array<Omit<ReplayDecisionTraceInput, "traceJson"> & { traceJson: string }>;
const traceCoverageWarnings = selectAiMatchesWithoutTraceRows(db, maxCreatedAt);
if (traceCoverageWarnings.length > 0) {
  console.warn(
    JSON.stringify(
      {
        warning: "ai_replay_trace_gap",
        matchesWithoutTraces: traceCoverageWarnings.length,
        sampleMatchIds: traceCoverageWarnings
          .slice(0, 5)
          .map((entry) => entry.matchId),
      },
      null,
      2,
    ),
  );
}

function selectTraceRowsSql(): string {
  return `SELECT
       m.match_id AS matchId,
       m.mode AS mode,
       m.status AS status,
       t.trace_id AS traceId,
       t.event_id AS eventId,
       t.state_version AS stateVersion,
       t.match_version AS matchVersion,
       t.side AS side,
       t.turn AS turn,
       t.decision_index AS decisionIndex,
       t.selected_action_id AS selectedActionId,
       t.selected_action_type AS selectedActionType,
       t.plan_kind AS planKind,
       t.score AS score,
       t.confidence AS confidence,
       t.created_at AS createdAt,
       t.trace_json AS traceJson
     FROM ai_decision_traces t
     JOIN matches m ON m.match_id = t.match_id`;
}

const report = buildReplayDecisionCaseExtractionReport(
  rows.map((row) => ({
    ...row,
    traceJson: JSON.parse(row.traceJson) as unknown,
  })),
  {
    sourceLabel: maxCreatedAt
      ? `${sourceLabelFor(dbPath)}:max_created_at:${maxCreatedAt}`
      : sourceLabelFor(dbPath),
    generatedAt: new Date().toISOString(),
  },
);

mkdirSync(dirname(jsonOut), { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(mdOut, renderMarkdown(report, traceCoverageWarnings), "utf8");
console.log(JSON.stringify(report.aggregate, null, 2));

type TraceCoverageWarning = {
  matchId: string;
  mode: string;
  status: string;
  updatedAt: string;
  eventCount: number;
};

function selectAiMatchesWithoutTraceRows(
  db: DatabaseSync,
  maxCreatedAt?: string,
): TraceCoverageWarning[] {
  const sql = `SELECT
       m.match_id AS matchId,
       m.mode AS mode,
       m.status AS status,
       m.updated_at AS updatedAt,
       COUNT(DISTINCT e.event_id) AS eventCount,
       COUNT(DISTINCT t.trace_id) AS traceCount
     FROM matches m
     LEFT JOIN events e ON e.match_id = m.match_id
     LEFT JOIN ai_decision_traces t ON t.match_id = m.match_id
     WHERE m.mode LIKE '%ai%'
       ${maxCreatedAt ? "AND m.created_at <= ?" : ""}
     GROUP BY m.match_id, m.mode, m.status, m.updated_at
     HAVING traceCount = 0
     ORDER BY m.updated_at DESC
     LIMIT 20`;
  const rows = (maxCreatedAt
    ? db.prepare(sql).all(maxCreatedAt)
    : db.prepare(sql).all()) as Array<{
    matchId: string;
    mode: string;
    status: string;
    updatedAt: string;
    eventCount: number;
  }>;
  return rows.map((row) => ({
    ...row,
    eventCount: Number(row.eventCount),
  }));
}

function renderMarkdown(
  report: ReplayDecisionCaseExtractionReport,
  traceCoverageWarnings: readonly TraceCoverageWarning[],
): string {
  return `# KI-Replay-DecisionCases

Run-ID: \`${runId}\`

Quelle: \`${report.source.label}\`, read-only

Cutoff: ${maxCreatedAt ?? "keiner"}

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| DecisionCases | ${report.aggregate.cases} |
| Discovery | ${report.aggregate.discoveryCases} |
| Holdout | ${report.aggregate.holdoutCases} |
| Redaction | ${report.redactionStatus} |
| Runtime-Effekt | 0 |

## Seiten

${countRows(report.aggregate.bySide)}

## Modi

${countRows(report.aggregate.byMode)}

${renderTraceCoverageWarnings(traceCoverageWarnings)}

## Aktionstypen

${countRows(topEntries(report.aggregate.bySelectedActionType, 20))}

## Planarten

${countRows(topEntries(report.aggregate.byPlanKind, 20))}

## Sicherheitsgrenzen

- Die JSON-Datei ist lokaler Analyseoutput unter \`data/local/\` und wird nicht versioniert.
- Die Extraktion enthaelt keine Roh-Trace-JSONs, keine FullState-Snapshots und keine privaten Deckdaten.
- Jeder Case enthaelt nur reproduzierbare Anker, ausgewaehlte Aktionsklasse, begrenzte sichtbarkeitsorientierte Diagnosefelder und einen Trace-Digest.
- Holdout-Cases duerfen erst nach Cluster-Auswahl und Minimalfix fuer Nebenwirkungspruefung genutzt werden.

## Verifikation

- \`corepack pnpm --filter @netgrid/ai typecheck\`
- \`corepack pnpm --filter @netgrid/ai exec vitest run src/evaluation/replay-decision-case-extraction.test.ts --maxWorkers=1 --testTimeout=30000\`
`;
}

function renderTraceCoverageWarnings(
  warnings: readonly TraceCoverageWarning[],
): string {
  if (warnings.length === 0) return "";
  const rows = warnings
    .map(
      (warning) =>
        `| \`${warning.matchId}\` | \`${warning.mode}\` | \`${warning.status}\` | ${warning.eventCount} | \`${warning.updatedAt}\` |`,
    )
    .join("\n");
  return `## Trace-Coverage-Warnungen

Diese AI-Matches haben Events, aber keine Rows in \`ai_decision_traces\`. Replay-Fehlersuchen dürfen dafür nur PublicEvents, LegalActions, PlayerViews/Snapshots und explizit als Post-hoc markierte aktuelle AI-Diagnostik nutzen.

| Match | Modus | Status | Events | Updated |
| --- | --- | --- | ---: | --- |
${rows}
`;
}

function countRows(counts: Record<string, number>): string {
  const rows = Object.entries(counts)
    .sort(([, left], [, right]) => right - left)
    .map(([key, count]) => `| \`${key}\` | ${count} |`)
    .join("\n");
  return `| Wert | Anzahl |
| --- | ---: |
${rows}`;
}

function topEntries(
  counts: Record<string, number>,
  limit: number,
): Record<string, number> {
  return Object.fromEntries(
    Object.entries(counts)
      .sort(([, left], [, right]) => right - left)
      .slice(0, limit),
  );
}

function optionValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index < 0) return undefined;
  return process.argv[index + 1];
}

function sourceLabelFor(path: string): string {
  const resolvedPath = resolve(path);
  const repoRelative = relativePath(repoRoot, resolvedPath);
  return repoRelative.startsWith("..")
    ? "local_sqlite_runtime:external_sqlite"
    : `local_sqlite_runtime:${repoRelative.replaceAll("\\", "/")}`;
}

function relativePath(from: string, to: string): string {
  return relative(from, to) || ".";
}

function safeRunId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_.-]/g, "-").slice(0, 80) || "latest";
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
    if (parent === current) throw new Error(`Could not find NETGRID repo root from ${start}`);
    current = parent;
  }
}
