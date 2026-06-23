import { createHash } from "node:crypto";
import type { Side } from "@netgrid/shared";
import {
  assertSemanticObjectSideSafe,
  redactSemanticString,
} from "../diagnostics/semantic-redaction";

export const REPLAY_DECISION_CASE_EXTRACTION_SCHEMA_VERSION =
  "replay-decision-case-extraction-v1" as const;

export type ReplayDecisionCaseSplit = "discovery" | "holdout";

export type ReplayDecisionTraceInput = {
  matchId: string;
  traceId: string;
  eventId: string;
  mode: string;
  status: string;
  createdAt: string;
  stateVersion: number;
  matchVersion: number;
  side: Side;
  turn: number;
  decisionIndex: number;
  selectedActionId?: string | null;
  selectedActionType?: string | null;
  planKind?: string | null;
  score?: number | null;
  confidence?: number | null;
  traceJson: unknown;
};

export type ReplayDecisionCaseMetric = {
  key: string;
  label?: string;
  value?: number;
  weight?: number;
  reason?: string;
};

export type ReplayDecisionCaseRankedAlternative = {
  rank: number;
  selectedActionType?: string;
  planKind?: string;
  score?: number;
  confidence?: number;
  summary?: string;
  visibleReasons: string[];
  warnings: string[];
  whyNot: string[];
};

export type ReplayDecisionCase = {
  kind: "replay_decision_case";
  caseId: string;
  split: ReplayDecisionCaseSplit;
  source: {
    matchId: string;
    traceId: string;
    eventId: string;
    mode: string;
    status: string;
    stateVersion: number;
    matchVersion: number;
    turn: number;
    decisionIndex: number;
    traceDigest: string;
  };
  decision: {
    side: Side;
    selectedActionId?: string;
    selectedActionType: string;
    planKind?: string;
    planId?: string;
    profileId?: string;
    score?: number;
    confidence?: number;
    summary?: string;
  };
  observables: {
    facts: string[];
    hypotheses: string[];
    invalidations: string[];
    uncertainty: string[];
    beliefUncertainty: string[];
    visibleReasons: string[];
    warnings: string[];
    whyNot: string[];
    scoreBreakdown: ReplayDecisionCaseMetric[];
    rankedAlternatives: ReplayDecisionCaseRankedAlternative[];
  };
  reproducibility: {
    stateVersion: number;
    eventId: string;
    decisionIndex: number;
    requiresLocalRuntimeState: true;
    legalActionReconstructionRequired: true;
  };
  noRuntimeEffect: true;
  productiveUseAllowed: false;
};

export type ReplayDecisionCaseExtractionReport = {
  schemaVersion: typeof REPLAY_DECISION_CASE_EXTRACTION_SCHEMA_VERSION;
  scope: "local_replay_decision_case_extraction";
  generatedAt?: string;
  source: {
    label: string;
    traceRows: number;
  };
  aggregate: {
    cases: number;
    discoveryCases: number;
    holdoutCases: number;
    bySide: Record<string, number>;
    byMode: Record<string, number>;
    byStatus: Record<string, number>;
    bySelectedActionType: Record<string, number>;
    byPlanKind: Record<string, number>;
  };
  cases: ReplayDecisionCase[];
  redactionStatus: "passed";
  noRuntimeEffect: true;
  productiveUseAllowed: false;
  evidence: string[];
};

export type BuildReplayDecisionCaseExtractionReportOptions = {
  sourceLabel?: string;
  generatedAt?: string;
};

export function buildReplayDecisionCaseExtractionReport(
  traces: readonly ReplayDecisionTraceInput[],
  options: BuildReplayDecisionCaseExtractionReportOptions = {},
): ReplayDecisionCaseExtractionReport {
  const cases = traces.map(extractReplayDecisionCaseFromTrace);
  const report: ReplayDecisionCaseExtractionReport = {
    schemaVersion: REPLAY_DECISION_CASE_EXTRACTION_SCHEMA_VERSION,
    scope: "local_replay_decision_case_extraction",
    ...(options.generatedAt ? { generatedAt: options.generatedAt } : {}),
    source: {
      label: safeText(options.sourceLabel ?? "local_sqlite_runtime"),
      traceRows: traces.length,
    },
    aggregate: {
      cases: cases.length,
      discoveryCases: cases.filter((entry) => entry.split === "discovery")
        .length,
      holdoutCases: cases.filter((entry) => entry.split === "holdout").length,
      bySide: countBy(cases, (entry) => entry.decision.side),
      byMode: countBy(cases, (entry) => entry.source.mode),
      byStatus: countBy(cases, (entry) => entry.source.status),
      bySelectedActionType: countBy(
        cases,
        (entry) => entry.decision.selectedActionType,
      ),
      byPlanKind: countBy(
        cases,
        (entry) => entry.decision.planKind ?? "none",
      ),
    },
    cases,
    redactionStatus: "passed",
    noRuntimeEffect: true,
    productiveUseAllowed: false,
    evidence: [
      "replay_decision_case_extraction:local_only",
      `source_label:${safeText(options.sourceLabel ?? "local_sqlite_runtime")}`,
      `trace_rows:${traces.length}`,
      `case_count:${cases.length}`,
      "raw_match_records_not_embedded:true",
      "runtime_consumer:none",
      "productive_use_allowed:false",
    ],
  };
  assertSemanticObjectSideSafe(report, "ReplayDecisionCaseExtractionReport");
  return report;
}

export function extractReplayDecisionCaseFromTrace(
  trace: ReplayDecisionTraceInput,
): ReplayDecisionCase {
  const raw = isRecord(trace.traceJson) ? trace.traceJson : {};
  const selectedActionType =
    safeOptionalText(trace.selectedActionType) ??
    safeOptionalText(raw.selectedActionType) ??
    "none";
  const selectedActionId = safeOptionalText(trace.selectedActionId);
  const caseValue: ReplayDecisionCase = {
    kind: "replay_decision_case",
    caseId: replayDecisionCaseId(trace),
    split: replayDecisionCaseSplit(trace.matchId),
    source: {
      matchId: safeText(trace.matchId),
      traceId: safeText(trace.traceId),
      eventId: safeText(trace.eventId),
      mode: safeText(trace.mode),
      status: safeText(trace.status),
      stateVersion: trace.stateVersion,
      matchVersion: trace.matchVersion,
      turn: trace.turn,
      decisionIndex: trace.decisionIndex,
      traceDigest: digest(JSON.stringify(trace.traceJson) ?? "undefined"),
    },
    decision: {
      side: trace.side,
      ...(selectedActionId ? { selectedActionId } : {}),
      selectedActionType,
      ...optionalText("planKind", trace.planKind ?? raw.planKind),
      ...optionalText("planId", raw.planId),
      ...optionalText("profileId", raw.profileId),
      ...optionalNumber("score", trace.score ?? raw.score),
      ...optionalNumber("confidence", trace.confidence ?? raw.confidence),
      ...optionalText("summary", raw.summary),
    },
    observables: {
      facts: safeTextArray(raw.facts),
      hypotheses: safeTextArray(raw.hypotheses),
      invalidations: safeTextArray(raw.invalidations),
      uncertainty: safeTextArray(raw.uncertainty),
      beliefUncertainty: safeTextArray(raw.beliefUncertainty),
      visibleReasons: safeTextArray(raw.visibleReasons),
      warnings: safeTextArray(raw.warnings),
      whyNot: safeTextArray(raw.whyNot),
      scoreBreakdown: scoreBreakdown(raw.scoreBreakdown),
      rankedAlternatives: rankedAlternatives(raw.rankedAlternatives),
    },
    reproducibility: {
      stateVersion: trace.stateVersion,
      eventId: safeText(trace.eventId),
      decisionIndex: trace.decisionIndex,
      requiresLocalRuntimeState: true,
      legalActionReconstructionRequired: true,
    },
    noRuntimeEffect: true,
    productiveUseAllowed: false,
  };
  assertSemanticObjectSideSafe(caseValue, "ReplayDecisionCase");
  return caseValue;
}

export function replayDecisionCaseSplit(matchId: string): ReplayDecisionCaseSplit {
  const bucket = (createHash("sha256").update(matchId).digest()[0] ?? 0) % 10;
  return bucket < 8 ? "discovery" : "holdout";
}

function replayDecisionCaseId(trace: ReplayDecisionTraceInput): string {
  return `replay-case-${digest(
    [
      trace.matchId,
      trace.traceId,
      trace.eventId,
      trace.stateVersion,
      trace.decisionIndex,
    ].join(":"),
  ).slice(0, 16)}`;
}

function rankedAlternatives(value: unknown): ReplayDecisionCaseRankedAlternative[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 8).flatMap((entry, index) => {
    if (!isRecord(entry)) return [];
    return [
      {
        rank: numberValue(entry.rank) ?? index + 1,
        ...optionalText("selectedActionType", entry.selectedActionType),
        ...optionalText("planKind", entry.planKind),
        ...optionalNumber("score", entry.score),
        ...optionalNumber("confidence", entry.confidence),
        ...optionalText("summary", entry.summary),
        visibleReasons: safeTextArray(entry.visibleReasons),
        warnings: safeTextArray(entry.warnings),
        whyNot: safeTextArray(entry.whyNot),
      },
    ];
  });
}

function scoreBreakdown(value: unknown): ReplayDecisionCaseMetric[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 12).flatMap((entry) => {
    if (!isRecord(entry)) return [];
    const key = safeOptionalText(entry.key);
    if (!key) return [];
    return [
      {
        key,
        ...optionalText("label", entry.label),
        ...optionalNumber("value", entry.value),
        ...optionalNumber("weight", entry.weight),
        ...optionalText("reason", entry.reason),
      },
    ];
  });
}

function safeTextArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 12)
    .map(safeOptionalText)
    .filter((entry): entry is string => entry !== undefined);
}

function optionalText<K extends string>(
  key: K,
  value: unknown,
): Partial<Record<K, string>> {
  const text = safeOptionalText(value);
  return text ? ({ [key]: text } as Partial<Record<K, string>>) : {};
}

function optionalNumber<K extends string>(
  key: K,
  value: unknown,
): Partial<Record<K, number>> {
  const number = numberValue(value);
  return number === undefined
    ? {}
    : ({ [key]: Math.round(number * 1000) / 1000 } as Partial<
        Record<K, number>
      >);
}

function safeText(value: unknown): string {
  return safeOptionalText(value) ?? "[redacted]";
}

function safeOptionalText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return redactSemanticString(trimmed).slice(0, 240);
}

function numberValue(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function countBy<T>(
  values: readonly T[],
  keyFor: (value: T) => string,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const value of values) {
    const key = keyFor(value);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.fromEntries(
    Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)),
  );
}
