import { createHash } from "node:crypto";
import type { Side } from "@netgrid/shared";
import {
  assertSemanticObjectSideSafe,
  redactSemanticString,
} from "../diagnostics/semantic-redaction";

export const CURRENT_AI_HOLDOUT_RUNNER_SCHEMA_VERSION =
  "current-ai-holdout-runner-v1" as const;

export type CurrentAiHoldoutEvaluationStatus =
  | "evaluated"
  | "reconstruction_error"
  | "ai_error"
  | "redaction_violation";

export type CurrentAiHoldoutEvaluation = {
  status: CurrentAiHoldoutEvaluationStatus;
  caseKey: string;
  side: Side;
  historical: {
    actionType: string;
    actionIdDigest?: string;
    planKind?: string;
    challengerActionType?: string;
    challengerPlanKind?: string;
  };
  current?: {
    actionType?: string;
    actionIdDigest?: string;
    planKind?: string;
    reasonCode?: string;
    confidence?: number;
    legalActionCount: number;
    legal: boolean;
  };
  changedDecision?: boolean;
  errorCode?: string;
};

export type CurrentAiHoldoutFixedPattern = {
  historicalActionType: string;
  historicalPlanKind: string;
  currentActionType: string;
  currentPlanKind: string;
};

export type CurrentAiHoldoutRunnerReport = {
  schemaVersion: typeof CURRENT_AI_HOLDOUT_RUNNER_SCHEMA_VERSION;
  scope: "current_ai_holdout_runner";
  runId: string;
  generatedAt?: string;
  source: {
    label: string;
    dbProvided: boolean;
    cutoff?: string;
  };
  aggregate: {
    holdoutCases: number;
    evaluated: number;
    changedDecisions: number;
    illegalActions: number;
    reconstructionErrors: number;
    aiErrors: number;
    redactionViolations: number;
    fixedPatternHistoricalCases: number;
    fixedPatternCurrentRecurrence: number;
  };
  bySide: Record<string, number>;
  byStatus: Record<string, number>;
  byHistoricalActionType: Record<string, number>;
  byCurrentActionType: Record<string, number>;
  examples: CurrentAiHoldoutEvaluation[];
  gates: {
    currentAiHoldoutEvaluated: boolean;
    noIllegalActions: boolean;
    noRedactionViolations: boolean;
    reconstructionComplete: boolean;
    productiveUseDisabled: true;
  };
  conclusions: string[];
  noRuntimeEffect: true;
  productiveUseAllowed: false;
};

export function buildCurrentAiHoldoutRunnerReport(
  evaluations: readonly CurrentAiHoldoutEvaluation[],
  options: {
    runId: string;
    sourceLabel: string;
    dbProvided: boolean;
    cutoff?: string;
    generatedAt?: string;
    fixedPattern?: CurrentAiHoldoutFixedPattern;
    maxExamples?: number;
  },
): CurrentAiHoldoutRunnerReport {
  const fixedPatternHistoricalCases = options.fixedPattern
    ? evaluations.filter((entry) => matchesHistoricalPattern(entry, options.fixedPattern!))
        .length
    : 0;
  const fixedPatternCurrentRecurrence = options.fixedPattern
    ? evaluations.filter((entry) => matchesCurrentRecurrence(entry, options.fixedPattern!))
        .length
    : 0;
  const evaluated = evaluations.filter((entry) => entry.status === "evaluated");
  const report: CurrentAiHoldoutRunnerReport = {
    schemaVersion: CURRENT_AI_HOLDOUT_RUNNER_SCHEMA_VERSION,
    scope: "current_ai_holdout_runner",
    runId: safeText(options.runId),
    ...(options.generatedAt ? { generatedAt: options.generatedAt } : {}),
    source: {
      label: safeText(options.sourceLabel),
      dbProvided: options.dbProvided,
      ...(options.cutoff ? { cutoff: safeText(options.cutoff) } : {}),
    },
    aggregate: {
      holdoutCases: evaluations.length,
      evaluated: evaluated.length,
      changedDecisions: evaluated.filter((entry) => entry.changedDecision).length,
      illegalActions: evaluated.filter((entry) => entry.current?.legal === false)
        .length,
      reconstructionErrors: evaluations.filter(
        (entry) => entry.status === "reconstruction_error",
      ).length,
      aiErrors: evaluations.filter((entry) => entry.status === "ai_error").length,
      redactionViolations: evaluations.filter(
        (entry) => entry.status === "redaction_violation",
      ).length,
      fixedPatternHistoricalCases,
      fixedPatternCurrentRecurrence,
    },
    bySide: countBy(evaluations, (entry) => entry.side),
    byStatus: countBy(evaluations, (entry) => entry.status),
    byHistoricalActionType: countBy(
      evaluations,
      (entry) => entry.historical.actionType,
    ),
    byCurrentActionType: countBy(
      evaluated,
      (entry) => entry.current?.actionType ?? "none",
    ),
    examples: evaluations
      .filter((entry) => entry.status !== "evaluated" || entry.changedDecision)
      .slice(0, options.maxExamples ?? 8)
      .map(safeEvaluation),
    gates: {
      currentAiHoldoutEvaluated: evaluated.length > 0,
      noIllegalActions: evaluated.every((entry) => entry.current?.legal !== false),
      noRedactionViolations: evaluations.every(
        (entry) => entry.status !== "redaction_violation",
      ),
      reconstructionComplete: evaluations.every(
        (entry) => entry.status === "evaluated",
      ),
      productiveUseDisabled: true,
    },
    conclusions: [],
    noRuntimeEffect: true,
    productiveUseAllowed: false,
  };
  report.conclusions = conclusions(report);
  assertSemanticObjectSideSafe(report, "CurrentAiHoldoutRunnerReport");
  return report;
}

export function renderCurrentAiHoldoutRunnerMarkdown(
  report: CurrentAiHoldoutRunnerReport,
): string {
  return `# Aktuelle KI auf Holdout-DecisionPoints

Run-ID: \`${report.runId}\`

Status: ${report.gates.currentAiHoldoutEvaluated ? "ausgeführt" : "nicht ausgeführt"}

Quelle: \`${report.source.label}\`

Cutoff: ${report.source.cutoff ?? "keiner"}

## Aggregate

| Metrik | Wert |
| --- | ---: |
| Holdout-Cases | ${report.aggregate.holdoutCases} |
| Ausgewertet | ${report.aggregate.evaluated} |
| Geänderte Entscheidungen | ${report.aggregate.changedDecisions} |
| IllegalActions | ${report.aggregate.illegalActions} |
| Rekonstruktionsfehler | ${report.aggregate.reconstructionErrors} |
| KI-Fehler | ${report.aggregate.aiErrors} |
| Redaction-Verstöße | ${report.aggregate.redactionViolations} |
| Historische Fix-Muster-Fälle | ${report.aggregate.fixedPatternHistoricalCases} |
| Aktuelle Fix-Muster-Recurrence | ${report.aggregate.fixedPatternCurrentRecurrence} |

## Gates

${gateRows(report.gates)}

## Seiten

${countRows(report.bySide)}

## Historische Aktionstypen

${countRows(topEntries(report.byHistoricalActionType, 12))}

## Aktuelle Aktionstypen

${countRows(topEntries(report.byCurrentActionType, 12))}

## Redigierte Beispiele

${exampleRows(report.examples)}

## Schlussfolgerungen

${report.conclusions.map((entry) => `- ${entry}`).join("\n")}

## Sicherheitsgrenzen

- Der Runner ist read-only und schreibt vollständige Laufdaten nur in einen lokalen Ausgabepfad.
- KI-Inputs werden aus \`PlayerView\` und \`LegalActions\` für den rekonstruierten Snapshot gebaut.
- Dieser Bericht enthält keine Match-IDs, Trace-IDs, FullState-Snapshots, Hidden Cards, Decklisten oder lokalen Pfade.
- Holdout bleibt Abnahme, nicht Fixableitung.
`;
}

export function currentAiHoldoutCaseKey(parts: {
  matchId: string;
  traceId: string;
  eventId: string;
  stateVersion: number;
  decisionIndex: number;
}): string {
  return `holdout-${digest(
    [
      parts.matchId,
      parts.traceId,
      parts.eventId,
      parts.stateVersion,
      parts.decisionIndex,
    ].join(":"),
  ).slice(0, 16)}`;
}

export function currentAiHoldoutActionDigest(actionId: string): string {
  return `action-${digest(actionId).slice(0, 12)}`;
}

function conclusions(report: CurrentAiHoldoutRunnerReport): string[] {
  const result = [
    `Aktuelle Holdout-Auswertung: ${report.aggregate.evaluated}/${report.aggregate.holdoutCases}.`,
    `Geänderte Entscheidungen: ${report.aggregate.changedDecisions}.`,
    `IllegalActions: ${report.aggregate.illegalActions}.`,
    `Rekonstruktionsfehler: ${report.aggregate.reconstructionErrors}.`,
    `Redaction-Verstöße: ${report.aggregate.redactionViolations}.`,
    `Aktuelle Recurrence des ersten Fix-Musters: ${report.aggregate.fixedPatternCurrentRecurrence}/${report.aggregate.fixedPatternHistoricalCases}.`,
  ];
  if (!report.gates.reconstructionComplete) {
    result.push(
      "Nicht alle Holdout-DecisionPoints konnten aus der lokalen SQLite rekonstruiert werden.",
    );
  }
  if (!report.gates.noIllegalActions) {
    result.push("Mindestens eine aktuelle KI-Ausgabe lag nicht in LegalActions.");
  }
  return result;
}

function matchesHistoricalPattern(
  entry: CurrentAiHoldoutEvaluation,
  pattern: CurrentAiHoldoutFixedPattern,
): boolean {
  const selectedMatches =
    entry.historical.actionType === pattern.historicalActionType &&
    (entry.historical.planKind ?? "none") === pattern.historicalPlanKind;
  if (!selectedMatches) return false;
  if (
    !entry.historical.challengerActionType &&
    !entry.historical.challengerPlanKind
  ) {
    return true;
  }
  return (
    entry.historical.challengerActionType === pattern.currentActionType &&
    (entry.historical.challengerPlanKind ?? "none") === pattern.currentPlanKind
  );
}

function matchesCurrentRecurrence(
  entry: CurrentAiHoldoutEvaluation,
  pattern: CurrentAiHoldoutFixedPattern,
): boolean {
  return (
    matchesHistoricalPattern(entry, pattern) &&
    entry.current?.actionType === pattern.historicalActionType &&
    (entry.current.planKind ?? "none") === pattern.historicalPlanKind
  );
}

function safeEvaluation(
  entry: CurrentAiHoldoutEvaluation,
): CurrentAiHoldoutEvaluation {
  return {
    status: entry.status,
    caseKey: safeText(entry.caseKey),
    side: entry.side,
    historical: {
      actionType: safeText(entry.historical.actionType),
      ...(entry.historical.actionIdDigest
        ? { actionIdDigest: safeText(entry.historical.actionIdDigest) }
        : {}),
      ...(entry.historical.planKind
        ? { planKind: safeText(entry.historical.planKind) }
        : {}),
      ...(entry.historical.challengerActionType
        ? {
            challengerActionType: safeText(
              entry.historical.challengerActionType,
            ),
          }
        : {}),
      ...(entry.historical.challengerPlanKind
        ? { challengerPlanKind: safeText(entry.historical.challengerPlanKind) }
        : {}),
    },
    ...(entry.current
      ? {
          current: {
            ...(entry.current.actionType
              ? { actionType: safeText(entry.current.actionType) }
              : {}),
            ...(entry.current.actionIdDigest
              ? { actionIdDigest: safeText(entry.current.actionIdDigest) }
              : {}),
            ...(entry.current.planKind
              ? { planKind: safeText(entry.current.planKind) }
              : {}),
            ...(entry.current.reasonCode
              ? { reasonCode: safeText(entry.current.reasonCode) }
              : {}),
            ...(entry.current.confidence !== undefined
              ? { confidence: round(entry.current.confidence) }
              : {}),
            legalActionCount: entry.current.legalActionCount,
            legal: entry.current.legal,
          },
        }
      : {}),
    ...(entry.changedDecision !== undefined
      ? { changedDecision: entry.changedDecision }
      : {}),
    ...(entry.errorCode ? { errorCode: safeText(entry.errorCode) } : {}),
  };
}

function gateRows(report: CurrentAiHoldoutRunnerReport["gates"]): string {
  return Object.entries(report)
    .map(([key, value]) => `| \`${key}\` | ${value ? "ja" : "nein"} |`)
    .join("\n")
    .replace(/^/, "| Gate | Erfüllt |\n| --- | --- |\n");
}

function countRows(counts: Record<string, number>): string {
  const rows =
    Object.entries(counts)
      .sort(([, left], [, right]) => right - left)
      .map(([key, count]) => `| \`${key}\` | ${count} |`)
      .join("\n") || "| `none` | 0 |";
  return `| Wert | Anzahl |
| --- | ---: |
${rows}`;
}

function exampleRows(examples: readonly CurrentAiHoldoutEvaluation[]): string {
  if (examples.length === 0) return "Keine Beispiele.";
  return `| Case | Status | Historisch | Aktuell | Geändert |
| --- | --- | --- | --- | --- |
${examples
  .map((entry) => {
    const historical = [
      entry.historical.actionType,
      entry.historical.planKind ?? "none",
    ].join("/");
    const current = [
      entry.current?.actionType ?? "none",
      entry.current?.planKind ?? "none",
    ].join("/");
    return `| \`${entry.caseKey}\` | \`${entry.status}\` | \`${historical}\` | \`${current}\` | ${entry.changedDecision ? "ja" : "nein"} |`;
  })
  .join("\n")}`;
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

function countBy<T>(
  values: readonly T[],
  keyFor: (value: T) => string,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const value of values) {
    const key = safeText(keyFor(value));
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.fromEntries(
    Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)),
  );
}

function safeText(value: string): string {
  return redactSemanticString(value.trim()).slice(0, 160) || "none";
}

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
