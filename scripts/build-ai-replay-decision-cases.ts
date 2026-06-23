import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  buildReplayDecisionCaseExtractionReport,
  type ReplayDecisionCaseExtractionReport,
  type ReplayDecisionTraceInput,
} from "../packages/ai/src/evaluation/replay-decision-case-extraction";

const repoRoot = findRepoRoot(process.cwd());
const dbPath = optionValue("--db") ?? "C:/Projekte/NETGRID/data/runtime/multiplayer/netgrid.sqlite";
const maxCreatedAt = optionValue("--max-created-at");
const jsonOut = resolve(repoRoot, "docs/reviews/ai/ai-replay-decision-cases-2026-06-23.json");
const mdOut = resolve(repoRoot, "docs/reviews/ai/ai-replay-decision-cases-2026-06-23.md");

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
      ? `local_sqlite_runtime:multiplayer/netgrid.sqlite:max_created_at:${maxCreatedAt}`
      : "local_sqlite_runtime:multiplayer/netgrid.sqlite",
    generatedAt: new Date().toISOString(),
  },
);

mkdirSync(dirname(jsonOut), { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(mdOut, renderMarkdown(report), "utf8");
console.log(JSON.stringify(report.aggregate, null, 2));

function renderMarkdown(report: ReplayDecisionCaseExtractionReport): string {
  return `# KI-Replay-DecisionCases

Stand: 2026-06-23

Quelle: lokale SQLite-Runtime, read-only

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

## Aktionstypen

${countRows(topEntries(report.aggregate.bySelectedActionType, 20))}

## Planarten

${countRows(topEntries(report.aggregate.byPlanKind, 20))}

## Sicherheitsgrenzen

- Die JSON-Datei enthaelt keine Roh-Trace-JSONs, keine FullState-Snapshots und keine privaten Deckdaten.
- Jeder Case enthaelt nur reproduzierbare Anker, ausgewaehlte Aktionsklasse, begrenzte sichtbarkeitsorientierte Diagnosefelder und einen Trace-Digest.
- Holdout-Cases duerfen erst nach Cluster-Auswahl und Minimalfix fuer Nebenwirkungspruefung genutzt werden.

## Verifikation

- \`corepack pnpm --filter @netgrid/ai typecheck\`
- \`corepack pnpm --filter @netgrid/ai exec vitest run src/evaluation/replay-decision-case-extraction.test.ts --maxWorkers=1 --testTimeout=30000\`
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
