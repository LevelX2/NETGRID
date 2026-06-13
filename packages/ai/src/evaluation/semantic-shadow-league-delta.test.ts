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
    expect(delta.pilotEligibilityDelta).toMatchObject({
      baseline: 0.82,
      current: current.metrics.pilotEligibilityRate,
      delta: 0.013,
      direction: "improved",
    });

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
    ],
  };
}

function roundMetric(value: number): number {
  return Math.round(value * 1000) / 1000;
}
