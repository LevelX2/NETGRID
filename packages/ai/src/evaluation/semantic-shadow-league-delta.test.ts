import { describe, expect, it } from "vitest";
import { containsForbiddenSemanticMarker } from "../diagnostics/semantic-redaction";
import { buildRealEngineDecisionCorpus } from "./real-engine-decision-corpus";
import { buildRealEngineDecisionCorpusScenarios } from "./real-engine-decision-corpus-fixtures";
import {
  buildSemanticShadowLeagueDeltaReport,
  SEMANTIC_SHADOW_LEAGUE_DELTA_SCHEMA_VERSION,
} from "./semantic-shadow-league-delta";
import {
  buildSemanticShadowLeagueReport,
  type SemanticShadowLeagueReport,
} from "./semantic-shadow-league";

describe("SemanticShadowLeagueDelta", () => {
  it("compares shadow league baseline and current reports without runtime effect", () => {
    const current = realShadowLeagueReport();
    const baseline = syntheticBaselineBeforeCurrentGrowth(current);

    const delta = buildSemanticShadowLeagueDeltaReport({
      baseline,
      current,
      baselineReference: "ai-shadow-league-baseline-2026-06-12",
      currentReference: "ai-shadow-league-current-2026-06-13",
    });

    expect(delta.schemaVersion).toBe(
      SEMANTIC_SHADOW_LEAGUE_DELTA_SCHEMA_VERSION,
    );
    expect(delta.scope).toBe("semantic_shadow_league_delta_report_only");
    expect(delta.productiveUseAllowed).toBe(false);
    expect(delta.semanticExecutionAllowed).toBe(false);
    expect(delta.runtimeConsumerStatus).toBe("none");
    expect(delta.noRuntimeEffect).toBe(true);
    expect(delta.redactionStatus).toBe("passed");

    expect(delta.baselineScenarioCount).toBe(current.scenarioCount - 1);
    expect(delta.currentScenarioCount).toBe(current.scenarioCount);
    expect(delta.scenarioCountDelta).toBe(1);
    expect(delta.agreementRateDelta).toMatchObject({
      baseline: baseline.metrics.agreementRate,
      current: current.metrics.agreementRate,
      delta: 0.1,
      direction: "improved",
    });
    expect(delta.mistakeCountDelta).toMatchObject({
      baseline: current.metrics.mistakeCount + 2,
      current: current.metrics.mistakeCount,
      delta: -2,
      direction: "improved",
    });
    expect(delta.mistakeDelta).toBe(delta.mistakeCountDelta);
    expect(delta.pilotEligibilityDelta).toMatchObject({
      baseline: 0.82,
      current: current.metrics.pilotEligibilityRate,
      delta: 0.013,
      direction: "improved",
    });
    expect(delta.pilotReadinessDelta.basic_setup).toMatchObject({
      baselineCandidate:
        current.metrics.pilotCutoverReadiness.scopes.basic_setup.candidate - 1,
      currentCandidate:
        current.metrics.pilotCutoverReadiness.scopes.basic_setup.candidate,
      candidateDelta: 1,
      allowedDelta: 1,
      wouldOverrideDelta: 1,
      recommendationChanged: true,
    });
    expect(delta.targetChoiceCoverageDelta).toMatchObject({
      baselineCandidate:
        current.metrics.pilotCutoverReadiness.scopes.target_choice_shadow_only
          .candidate,
      currentCandidate:
        current.metrics.pilotCutoverReadiness.scopes.target_choice_shadow_only
          .candidate,
      candidateDelta: 0,
      recommendationChanged: false,
    });
    expect(delta.remoteContestReadinessDelta).toMatchObject({
      baselineCandidate:
        current.metrics.pilotCutoverReadiness.scopes.remote_contest_report_only
          .candidate,
      currentCandidate:
        current.metrics.pilotCutoverReadiness.scopes.remote_contest_report_only
          .candidate,
      candidateDelta: 0,
      recommendationChanged: false,
    });
    expect(delta.doctrineFitDelta.doctrineGoalsProducedDelta).toMatchObject({
      baseline:
        current.metrics.doctrineGoalActionFit.doctrineGoalsProduced - 1,
      current: current.metrics.doctrineGoalActionFit.doctrineGoalsProduced,
      delta: 1,
      direction: "improved",
    });
    expect(delta.doctrineFitDelta.goalsWithAtLeastOneFitDelta).toMatchObject({
      baseline:
        current.metrics.doctrineGoalActionFit.goalsWithAtLeastOneFit - 1,
      current: current.metrics.doctrineGoalActionFit.goalsWithAtLeastOneFit,
      delta: 1,
      direction: "improved",
    });
    expect(delta.doctrineFitDelta.goalsOnlyBlockedDelta).toMatchObject({
      baseline: current.metrics.doctrineGoalActionFit.goalsOnlyBlocked + 1,
      current: current.metrics.doctrineGoalActionFit.goalsOnlyBlocked,
      delta: -1,
      direction: "improved",
    });
    expect(delta.doctrineFitDelta.goalsNoCandidateDelta).toMatchObject({
      baseline: current.metrics.doctrineGoalActionFit.goalsNoCandidate + 1,
      current: current.metrics.doctrineGoalActionFit.goalsNoCandidate,
      delta: -1,
      direction: "improved",
    });
    const currentDoctrineFamilies = Object.keys(
      current.metrics.doctrineGoalActionFit.topFitByFamily,
    ).sort();
    expect(currentDoctrineFamilies[0]).toBeDefined();
    expect(delta.doctrineFitDelta.addedTopFitFamilies).toEqual([
      currentDoctrineFamilies[0],
    ]);

    expect(delta.scopeBreakdownDelta.basic_setup).toMatchObject({
      baselineEligibleCount: current.metrics.scopeBreakdown.basic_setup.eligibleCount - 1,
      currentEligibleCount: current.metrics.scopeBreakdown.basic_setup.eligibleCount,
      eligibleCountDelta: 1,
      baselineWouldOverrideCount:
        current.metrics.scopeBreakdown.basic_setup.wouldOverrideCount - 1,
      currentWouldOverrideCount:
        current.metrics.scopeBreakdown.basic_setup.wouldOverrideCount,
      wouldOverrideCountDelta: 1,
      addedScenarioIds: [
        current.metrics.scopeBreakdown.basic_setup.scenarioIds[0],
      ],
      removedScenarioIds: [],
    });
    expect(delta.topDisagreementReasonDelta).toMatchObject({
      baselineCount: current.topDisagreementReasons.length - 1,
      currentCount: current.topDisagreementReasons.length,
      addedReasons: [current.topDisagreementReasons[0]],
      removedReasons: [],
    });
    expect(delta.topDisagreementReasonDelta.unchangedReasons).toEqual(
      current.topDisagreementReasons.slice(1).sort(),
    );
    expect(delta.followupCandidateCountDelta).toMatchObject({
      baseline: current.followupCandidates.length - 1,
      current: current.followupCandidates.length,
      delta: 1,
      direction: "regressed",
    });
    expect(delta.dashboardSummary).toMatchObject({
      scenarioCountDelta: 1,
      agreementDirection: "improved",
      mistakeDirection: "improved",
      followupDirection: "regressed",
      evidence: expect.arrayContaining([
        "shadow_league_delta_dashboard_summary:report_only",
      ]),
    });
    expect(delta.evidence).toEqual(
      expect.arrayContaining([
        "semantic_shadow_league_delta:report_only",
        "runtime_consumer:none",
        "productive_use_allowed:false",
      ]),
    );
    expect(containsForbiddenSemanticMarker(delta)).toBe(false);
  });

  it("marks null metric baselines as not comparable", () => {
    const current = realShadowLeagueReport();
    const baseline: SemanticShadowLeagueReport = {
      ...current,
      metrics: {
        ...current.metrics,
        agreementRate: null,
      },
    };

    const delta = buildSemanticShadowLeagueDeltaReport({ baseline, current });

    expect(delta.agreementRateDelta).toEqual({
      baseline: null,
      current: current.metrics.agreementRate,
      delta: null,
      direction: "not_comparable",
      evidence: ["agreementRate:not_comparable"],
    });
  });
});

function realShadowLeagueReport(): SemanticShadowLeagueReport {
  return buildSemanticShadowLeagueReport(
    buildRealEngineDecisionCorpus(buildRealEngineDecisionCorpusScenarios()),
  );
}

function syntheticBaselineBeforeCurrentGrowth(
  current: SemanticShadowLeagueReport,
): SemanticShadowLeagueReport {
  const [firstBasicSetupScenarioId, ...remainingBasicSetupScenarioIds] =
    current.metrics.scopeBreakdown.basic_setup.scenarioIds;
  const [firstDoctrineFamily, ...remainingDoctrineFamilies] = Object.keys(
    current.metrics.doctrineGoalActionFit.topFitByFamily,
  ).sort();
  const baselineTopFitByFamily: SemanticShadowLeagueReport["metrics"]["doctrineGoalActionFit"]["topFitByFamily"] =
    {};
  for (const family of remainingDoctrineFamilies) {
    const topFit = current.metrics.doctrineGoalActionFit.topFitByFamily[family];
    if (topFit) baselineTopFitByFamily[family] = topFit;
  }
  const currentBasicReadiness =
    current.metrics.pilotCutoverReadiness.scopes.basic_setup;

  return {
    ...current,
    scenarioCount: current.scenarioCount - 1,
    metrics: {
      ...current.metrics,
      agreementRate:
        current.metrics.agreementRate === null
          ? null
          : roundMetric(current.metrics.agreementRate - 0.1),
      mistakeCount: current.metrics.mistakeCount + 2,
      pilotEligibilityRate: 0.82,
      pilotCutoverReadiness: {
        ...current.metrics.pilotCutoverReadiness,
        scopes: {
          ...current.metrics.pilotCutoverReadiness.scopes,
          basic_setup: {
            ...currentBasicReadiness,
            candidate: currentBasicReadiness.candidate - 1,
            allowed: currentBasicReadiness.allowed - 1,
            wouldOverride: currentBasicReadiness.wouldOverride - 1,
            recommendedForDefaultOffPilot:
              !currentBasicReadiness.recommendedForDefaultOffPilot,
          },
        },
      },
      doctrineGoalActionFit: {
        ...current.metrics.doctrineGoalActionFit,
        doctrineGoalsProduced:
          current.metrics.doctrineGoalActionFit.doctrineGoalsProduced - 1,
        goalsWithAtLeastOneFit:
          current.metrics.doctrineGoalActionFit.goalsWithAtLeastOneFit - 1,
        goalsOnlyBlocked:
          current.metrics.doctrineGoalActionFit.goalsOnlyBlocked + 1,
        goalsNoCandidate:
          current.metrics.doctrineGoalActionFit.goalsNoCandidate + 1,
        topFitByFamily: baselineTopFitByFamily,
      },
      scopeBreakdown: {
        ...current.metrics.scopeBreakdown,
        basic_setup: {
          eligibleCount:
            current.metrics.scopeBreakdown.basic_setup.eligibleCount - 1,
          wouldOverrideCount:
            current.metrics.scopeBreakdown.basic_setup.wouldOverrideCount - 1,
          scenarioIds: remainingBasicSetupScenarioIds,
        },
      },
    },
    topDisagreementReasons: current.topDisagreementReasons.slice(1),
    followupCandidates: current.followupCandidates.slice(1),
    evidence: [
      ...current.evidence,
      `synthetic_baseline_removed:${firstBasicSetupScenarioId}`,
      `synthetic_baseline_removed_doctrine_family:${firstDoctrineFamily}`,
    ],
  };
}

function roundMetric(value: number): number {
  return Math.round(value * 1000) / 1000;
}
