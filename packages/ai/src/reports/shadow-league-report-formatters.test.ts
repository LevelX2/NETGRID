import { describe, expect, it } from "vitest";

import { containsForbiddenSemanticMarker } from "../diagnostics/semantic-redaction";
import type { SemanticShadowLeagueDeltaReport } from "../evaluation/semantic-shadow-league-delta";
import { formatSemanticShadowLeagueDeltaDashboard } from "./shadow-league-report-formatters";

describe("shadow league report formatters", () => {
  it("formats delta dashboards without runtime payloads", () => {
    const dashboard = formatSemanticShadowLeagueDeltaDashboard(deltaReport());

    expect(dashboard).toContain("# Semantic Shadow League Delta");
    expect(dashboard).toContain("| Mistake count | 4 | 2 | -2 | improved |");
    expect(dashboard).toContain("| basic_setup | +1 | +1 | +1 | yes |");
    expect(dashboard).toContain("Runtime consumer: `none`");
    expect(dashboard).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState/i,
    );
    expect(containsForbiddenSemanticMarker(dashboard)).toBe(false);
  });
});

function deltaReport(): SemanticShadowLeagueDeltaReport {
  const readiness = {
    baselineCandidate: 1,
    currentCandidate: 2,
    candidateDelta: 1,
    baselineAllowed: 1,
    currentAllowed: 2,
    allowedDelta: 1,
    baselineWouldOverride: 0,
    currentWouldOverride: 1,
    wouldOverrideDelta: 1,
    baselineRecommended: false,
    currentRecommended: true,
    recommendationChanged: true,
    evidence: ["readiness_scope:basic_setup"],
  };
  return {
    schemaVersion: "semantic-shadow-league-delta-v1",
    scope: "semantic_shadow_league_delta_report_only",
    baselineReference: "baseline",
    currentReference: "current",
    baselineScenarioCount: 10,
    currentScenarioCount: 11,
    scenarioCountDelta: 1,
    agreementRateDelta: metric(0.7, 0.8, 0.1, "improved"),
    mistakeCountDelta: metric(4, 2, -2, "improved"),
    mistakeDelta: metric(4, 2, -2, "improved"),
    pilotEligibilityDelta: metric(0.5, 0.6, 0.1, "improved"),
    pilotReadinessDelta: {
      basic_setup: readiness,
      runner_safe_access: { ...readiness, recommendationChanged: false },
      corp_score_window: { ...readiness, recommendationChanged: false },
    },
    targetChoiceCoverageDelta: readiness,
    doctrineFitDelta: {
      doctrineGoalsProducedDelta: metric(1, 2, 1, "improved"),
      goalsWithAtLeastOneFitDelta: metric(1, 2, 1, "improved"),
      goalsOnlyBlockedDelta: metric(1, 0, -1, "improved"),
      goalsNoCandidateDelta: metric(1, 0, -1, "improved"),
      addedTopFitFamilies: ["run_access"],
      removedTopFitFamilies: [],
      unchangedTopFitFamilies: [],
      evidence: ["doctrine_fit_added_family_count:1"],
    },
    remoteContestReadinessDelta: readiness,
    scopeBreakdownDelta: {
      basic_setup: scopeDelta(),
      runner_safe_access: scopeDelta(),
      corp_score_window: scopeDelta(),
    },
    topDisagreementReasonDelta: {
      baselineCount: 1,
      currentCount: 1,
      addedReasons: [],
      removedReasons: [],
      unchangedReasons: ["reason"],
      evidence: ["top_disagreement_reason_unchanged_count:1"],
    },
    followupCandidateCountDelta: metric(5, 4, -1, "improved"),
    dashboardSummary: {
      scenarioCountDelta: 1,
      agreementDirection: "improved",
      mistakeDirection: "improved",
      followupDirection: "improved",
      evidence: ["shadow_league_delta_dashboard_summary:report_only"],
    },
    redactionStatus: "passed",
    productiveUseAllowed: false,
    semanticExecutionAllowed: false,
    runtimeConsumerStatus: "none",
    noRuntimeEffect: true,
    evidence: ["semantic_shadow_league_delta:report_only"],
  };
}

function metric(
  baseline: number,
  current: number,
  delta: number,
  direction: SemanticShadowLeagueDeltaReport["agreementRateDelta"]["direction"],
): SemanticShadowLeagueDeltaReport["agreementRateDelta"] {
  return {
    baseline,
    current,
    delta,
    direction,
    evidence: [],
  };
}

function scopeDelta(): SemanticShadowLeagueDeltaReport["scopeBreakdownDelta"]["basic_setup"] {
  return {
    baselineEligibleCount: 1,
    currentEligibleCount: 2,
    eligibleCountDelta: 1,
    baselineWouldOverrideCount: 0,
    currentWouldOverrideCount: 1,
    wouldOverrideCountDelta: 1,
    addedScenarioIds: ["scenario"],
    removedScenarioIds: [],
    evidence: ["scope:basic_setup"],
  };
}
