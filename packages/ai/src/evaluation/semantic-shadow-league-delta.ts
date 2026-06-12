import {
  BASIC_SETUP_PILOT_MODE,
  CORP_SCORE_WINDOW_PILOT_MODE,
  RUNNER_SAFE_ACCESS_PILOT_MODE,
  type AiPlayStrengthPilotScope,
} from "../decision/pilot-scope-registry";
import {
  findForbiddenSemanticPath,
  redactSemanticString,
} from "../diagnostics/semantic-redaction";
import type {
  SemanticShadowLeaguePilotScopeBreakdown,
  SemanticShadowLeagueReport,
} from "./semantic-shadow-league";

export const SEMANTIC_SHADOW_LEAGUE_DELTA_SCHEMA_VERSION =
  "semantic-shadow-league-delta-v1" as const;

export type SemanticShadowLeagueMetricDelta = {
  baseline: number | null;
  current: number | null;
  delta: number | null;
  direction: "improved" | "regressed" | "unchanged" | "not_comparable";
  evidence: string[];
};

export type SemanticShadowLeagueScopeBreakdownDelta = {
  baselineEligibleCount: number;
  currentEligibleCount: number;
  eligibleCountDelta: number;
  baselineWouldOverrideCount: number;
  currentWouldOverrideCount: number;
  wouldOverrideCountDelta: number;
  addedScenarioIds: string[];
  removedScenarioIds: string[];
  evidence: string[];
};

export type SemanticShadowLeagueTopDisagreementReasonDelta = {
  baselineCount: number;
  currentCount: number;
  addedReasons: string[];
  removedReasons: string[];
  unchangedReasons: string[];
  evidence: string[];
};

export type SemanticShadowLeagueDeltaReport = {
  schemaVersion: typeof SEMANTIC_SHADOW_LEAGUE_DELTA_SCHEMA_VERSION;
  scope: "semantic_shadow_league_delta_report_only";
  baselineReference: string;
  currentReference: string;
  baselineScenarioCount: number;
  currentScenarioCount: number;
  scenarioCountDelta: number;
  agreementRateDelta: SemanticShadowLeagueMetricDelta;
  mistakeCountDelta: SemanticShadowLeagueMetricDelta;
  pilotEligibilityDelta: SemanticShadowLeagueMetricDelta;
  scopeBreakdownDelta: Record<
    AiPlayStrengthPilotScope,
    SemanticShadowLeagueScopeBreakdownDelta
  >;
  topDisagreementReasonDelta: SemanticShadowLeagueTopDisagreementReasonDelta;
  redactionStatus: "passed";
  productiveUseAllowed: false;
  semanticExecutionAllowed: false;
  runtimeConsumerStatus: "none";
  noRuntimeEffect: true;
  evidence: string[];
};

export type BuildSemanticShadowLeagueDeltaReportInput = {
  baseline: SemanticShadowLeagueReport;
  current: SemanticShadowLeagueReport;
  baselineReference?: string;
  currentReference?: string;
};

const PILOT_SCOPES: readonly AiPlayStrengthPilotScope[] = [
  BASIC_SETUP_PILOT_MODE,
  RUNNER_SAFE_ACCESS_PILOT_MODE,
  CORP_SCORE_WINDOW_PILOT_MODE,
];

export function buildSemanticShadowLeagueDeltaReport({
  baseline,
  current,
  baselineReference = "baseline",
  currentReference = "current",
}: BuildSemanticShadowLeagueDeltaReportInput): SemanticShadowLeagueDeltaReport {
  const report: SemanticShadowLeagueDeltaReport = {
    schemaVersion: SEMANTIC_SHADOW_LEAGUE_DELTA_SCHEMA_VERSION,
    scope: "semantic_shadow_league_delta_report_only",
    baselineReference: safe(baselineReference),
    currentReference: safe(currentReference),
    baselineScenarioCount: baseline.scenarioCount,
    currentScenarioCount: current.scenarioCount,
    scenarioCountDelta: current.scenarioCount - baseline.scenarioCount,
    agreementRateDelta: buildHigherIsBetterDelta(
      "agreementRate",
      baseline.metrics.agreementRate,
      current.metrics.agreementRate,
    ),
    mistakeCountDelta: buildLowerIsBetterDelta(
      "mistakeCount",
      baseline.metrics.mistakeCount,
      current.metrics.mistakeCount,
    ),
    pilotEligibilityDelta: buildHigherIsBetterDelta(
      "pilotEligibilityRate",
      baseline.metrics.pilotEligibilityRate,
      current.metrics.pilotEligibilityRate,
    ),
    scopeBreakdownDelta: buildScopeBreakdownDelta(
      baseline.metrics.scopeBreakdown,
      current.metrics.scopeBreakdown,
    ),
    topDisagreementReasonDelta: buildTopDisagreementReasonDelta(
      baseline.topDisagreementReasons,
      current.topDisagreementReasons,
    ),
    redactionStatus: "passed",
    productiveUseAllowed: false,
    semanticExecutionAllowed: false,
    runtimeConsumerStatus: "none",
    noRuntimeEffect: true,
    evidence: [
      "semantic_shadow_league_delta:report_only",
      `baseline_reference:${safe(baselineReference)}`,
      `current_reference:${safe(currentReference)}`,
      `baseline_scenario_count:${baseline.scenarioCount}`,
      `current_scenario_count:${current.scenarioCount}`,
      "runtime_consumer:none",
      "productive_use_allowed:false",
    ],
  };
  assertDeltaReportSideSafe(report);
  return report;
}

function buildHigherIsBetterDelta(
  label: string,
  baseline: number | null,
  current: number | null,
): SemanticShadowLeagueMetricDelta {
  return buildMetricDelta(label, baseline, current, "higher");
}

function buildLowerIsBetterDelta(
  label: string,
  baseline: number | null,
  current: number | null,
): SemanticShadowLeagueMetricDelta {
  return buildMetricDelta(label, baseline, current, "lower");
}

function buildMetricDelta(
  label: string,
  baseline: number | null,
  current: number | null,
  favorableDirection: "higher" | "lower",
): SemanticShadowLeagueMetricDelta {
  if (baseline === null || current === null) {
    return {
      baseline,
      current,
      delta: null,
      direction: "not_comparable",
      evidence: [`${safe(label)}:not_comparable`],
    };
  }

  const delta = roundMetric(current - baseline);
  return {
    baseline,
    current,
    delta,
    direction: directionForDelta(delta, favorableDirection),
    evidence: [
      `${safe(label)}:baseline:${baseline}`,
      `${safe(label)}:current:${current}`,
      `${safe(label)}:delta:${delta}`,
    ],
  };
}

function directionForDelta(
  delta: number,
  favorableDirection: "higher" | "lower",
): SemanticShadowLeagueMetricDelta["direction"] {
  if (delta === 0) return "unchanged";
  if (favorableDirection === "higher") {
    return delta > 0 ? "improved" : "regressed";
  }
  return delta < 0 ? "improved" : "regressed";
}

function buildScopeBreakdownDelta(
  baseline: Record<AiPlayStrengthPilotScope, SemanticShadowLeaguePilotScopeBreakdown>,
  current: Record<AiPlayStrengthPilotScope, SemanticShadowLeaguePilotScopeBreakdown>,
): Record<AiPlayStrengthPilotScope, SemanticShadowLeagueScopeBreakdownDelta> {
  return Object.fromEntries(
    PILOT_SCOPES.map((scope) => [
      scope,
      buildSingleScopeDelta(scope, baseline[scope], current[scope]),
    ]),
  ) as Record<AiPlayStrengthPilotScope, SemanticShadowLeagueScopeBreakdownDelta>;
}

function buildSingleScopeDelta(
  scope: AiPlayStrengthPilotScope,
  baseline: SemanticShadowLeaguePilotScopeBreakdown,
  current: SemanticShadowLeaguePilotScopeBreakdown,
): SemanticShadowLeagueScopeBreakdownDelta {
  const baselineScenarioIds = new Set(baseline.scenarioIds);
  const currentScenarioIds = new Set(current.scenarioIds);
  const addedScenarioIds = current.scenarioIds
    .filter((scenarioId) => !baselineScenarioIds.has(scenarioId))
    .map(safe)
    .sort();
  const removedScenarioIds = baseline.scenarioIds
    .filter((scenarioId) => !currentScenarioIds.has(scenarioId))
    .map(safe)
    .sort();

  return {
    baselineEligibleCount: baseline.eligibleCount,
    currentEligibleCount: current.eligibleCount,
    eligibleCountDelta: current.eligibleCount - baseline.eligibleCount,
    baselineWouldOverrideCount: baseline.wouldOverrideCount,
    currentWouldOverrideCount: current.wouldOverrideCount,
    wouldOverrideCountDelta:
      current.wouldOverrideCount - baseline.wouldOverrideCount,
    addedScenarioIds,
    removedScenarioIds,
    evidence: [
      `scope:${safe(scope)}`,
      `eligible_count_delta:${current.eligibleCount - baseline.eligibleCount}`,
      `would_override_count_delta:${
        current.wouldOverrideCount - baseline.wouldOverrideCount
      }`,
      `added_scenario_count:${addedScenarioIds.length}`,
      `removed_scenario_count:${removedScenarioIds.length}`,
    ],
  };
}

function buildTopDisagreementReasonDelta(
  baselineReasons: readonly string[],
  currentReasons: readonly string[],
): SemanticShadowLeagueTopDisagreementReasonDelta {
  const baseline = new Set(baselineReasons.map(safe));
  const current = new Set(currentReasons.map(safe));
  const addedReasons = [...current].filter((reason) => !baseline.has(reason)).sort();
  const removedReasons = [...baseline]
    .filter((reason) => !current.has(reason))
    .sort();
  const unchangedReasons = [...current]
    .filter((reason) => baseline.has(reason))
    .sort();
  return {
    baselineCount: baselineReasons.length,
    currentCount: currentReasons.length,
    addedReasons,
    removedReasons,
    unchangedReasons,
    evidence: [
      `top_disagreement_reason_added_count:${addedReasons.length}`,
      `top_disagreement_reason_removed_count:${removedReasons.length}`,
      `top_disagreement_reason_unchanged_count:${unchangedReasons.length}`,
    ],
  };
}

function roundMetric(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function safe(value: string): string {
  return redactSemanticString(value);
}

function assertDeltaReportSideSafe(report: SemanticShadowLeagueDeltaReport): void {
  const forbiddenPath = findForbiddenSemanticPath(
    report,
    "SemanticShadowLeagueDeltaReport",
  );
  if (!forbiddenPath) return;
  throw new Error(
    `Semantic shadow league delta report contains forbidden hidden-info marker: ${forbiddenPath}`,
  );
}
