import { describe, expect, it } from "vitest";
import { containsForbiddenSemanticMarker } from "../diagnostics/semantic-redaction";
import {
  buildRealEngineDecisionCorpusScenarios,
  REAL_ENGINE_DECISION_CORPUS_SCENARIO_IDS,
} from "./real-engine-decision-corpus-fixtures";
import { buildRealEngineDecisionCorpus } from "./real-engine-decision-corpus";
import {
  buildSemanticShadowLeagueReport,
  SEMANTIC_SHADOW_LEAGUE_SCHEMA_VERSION,
  playStrengthShadowLeagueExpectationsFromSamples,
} from "./semantic-shadow-league";

describe("SemanticShadowLeague", () => {
  it("aggregates agreement, mistakes, scores and blockers without runtime effect", () => {
    const samples = buildRealEngineDecisionCorpus(
      buildRealEngineDecisionCorpusScenarios(),
    );
    const report = buildSemanticShadowLeagueReport(samples);
    expect(report.schemaVersion).toBe(SEMANTIC_SHADOW_LEAGUE_SCHEMA_VERSION);
    expect(report.scope).toBe("semantic_shadow_league_report_only");
    expect(report.scenarioCount).toBe(
      REAL_ENGINE_DECISION_CORPUS_SCENARIO_IDS.length,
    );
    expect(report.scenarioCount).toBe(samples.length);
    expect(report.sideCounts).toEqual(expectedSideCounts(samples));
    expect(
      report.metrics.pilotEligibilityBySide.runner.scenarioCount +
        report.metrics.pilotEligibilityBySide.corp.scenarioCount,
    ).toBe(samples.length);
    expect(report.evidence).toEqual(
      expect.arrayContaining([`scenario_count:${samples.length}`]),
    );
    expect(report.productiveUseAllowed).toBe(false);
    expect(report.semanticExecutionAllowed).toBe(false);
    expect(report.runtimeConsumerStatus).toBe("none");
    expect(report.noRuntimeEffect).toBe(true);

    expect(report.metrics.agreementComparedCount).toBe(
      playStrengthShadowLeagueExpectationsFromSamples(samples).length,
    );
    expect(report.metrics.agreementRate).not.toBeNull();
    expect(report.metrics.agreementCount).toBeGreaterThan(0);
    expect(report.metrics.rankedActionCount).toBeGreaterThan(0);
    expect(report.metrics.rejectedActionCount).toBeGreaterThanOrEqual(0);
    expect(report.metrics.blockersByKind).toBeDefined();
    expect(report.metrics.topScoreAverage).not.toBeNull();
    expect(report.metrics.topScoreMin).not.toBeNull();
    expect(report.metrics.topScoreMax).not.toBeNull();
    expect(report.metrics.mistakesByClass.hidden_info_dependency).toBe(0);
    expect(report.metrics.pilotEligibleCount).toBe(26);
    expect(report.metrics.pilotWouldOverrideCount).toBe(26);
    expect(report.metrics.pilotEligibilityRate).toBe(0.867);
    expect(report.metrics.pilotEligibilityBySide.runner).toEqual({
      scenarioCount: 15,
      eligibleCount: 14,
      wouldOverrideCount: 14,
      eligibleRate: 0.933,
    });
    expect(report.metrics.pilotEligibilityBySide.corp).toEqual({
      scenarioCount: 15,
      eligibleCount: 12,
      wouldOverrideCount: 12,
      eligibleRate: 0.8,
    });
    expect(report.metrics.scopeBreakdown.basic_setup.eligibleCount).toBe(13);
    expect(report.metrics.scopeBreakdown.runner_safe_access.eligibleCount).toBe(11);
    expect(report.metrics.scopeBreakdown.corp_score_window.eligibleCount).toBe(2);
    expect(report.metrics.remoteContestPilotCandidateCount).toBe(1);
    expect(report.metrics.remoteContestPilotCandidateScenarioIds).toEqual([
      "runner_real_remote_score_threat",
    ]);
    expect(report.topDisagreementReasons).toEqual([
      "corp_real_advance_score_window:expected=advance_card:observed=gain_credit",
      "runner_real_damage_buffer_needed:expected=draw_card:observed=start_run",
      "runner_real_tag_cleanup:expected=remove_tag:observed=start_run",
    ]);
    expect(report.redactionStatus).toBe("passed");
    expect(containsForbiddenSemanticMarker(report)).toBe(false);
  });

  it("keeps per-scenario observations stable enough for calibration work", () => {
    const report = buildSemanticShadowLeagueReport(
      buildRealEngineDecisionCorpus(buildRealEngineDecisionCorpusScenarios()),
    );

    expect(report.scenarios.map((scenario) => scenario.scenarioId)).toEqual(
      REAL_ENGINE_DECISION_CORPUS_SCENARIO_IDS,
    );
    expect(scenario(report, "corp_real_score_agenda_window")).toMatchObject({
      topActionType: "score_agenda",
      agreement: true,
    });
    expect(
      scenario(report, "runner_real_low_credits").expectedTopActionTypes,
    ).toEqual(["draw_card", "gain_credit"]);
    expect(
      scenario(report, "runner_real_safe_hq_access").expectedTopActionTypes,
    ).toEqual(["start_run"]);
    expect(
      scenario(report, "runner_real_remote_score_threat")
        .remoteContestPilotCandidate,
    ).toMatchObject({
      targetKind: "remote",
      scoreThreat: true,
      reportOnly: true,
      productiveUseAllowed: false,
      reason: "remote_contest_target_calibration_required",
      evidence: expect.arrayContaining([
        "remote_contest_pilot_candidate:report_only",
        "productive_use_allowed:false",
      ]),
    });
    expect(scenario(report, "runner_real_low_credits").pilotEligibility).toEqual({
      eligible: true,
      wouldOverride: true,
      scopes: ["basic_setup"],
      reportOnly: true,
      productiveUseAllowed: false,
      evidence: [
        "pilot_scope_eligible:true",
        "pilot_would_override:true",
        "pilot_eligibility:report_only",
        "productive_use_allowed:false",
        "pilot_scope:basic_setup:eligible",
      ],
    });
    expect(scenario(report, "runner_real_safe_hq_access").pilotEligibility).toEqual({
      eligible: true,
      wouldOverride: true,
      scopes: ["runner_safe_access"],
      reportOnly: true,
      productiveUseAllowed: false,
      evidence: [
        "pilot_scope_eligible:true",
        "pilot_would_override:true",
        "pilot_eligibility:report_only",
        "productive_use_allowed:false",
        "pilot_scope:runner_safe_access:eligible",
      ],
    });
    expect(
      report.scenarios.every(
        (candidate) =>
          candidate.pilotEligibility.reportOnly &&
          candidate.pilotEligibility.productiveUseAllowed === false,
      ),
    ).toBe(true);
  });
});

function scenario(
  report: ReturnType<typeof buildSemanticShadowLeagueReport>,
  scenarioId: string,
) {
  const result = report.scenarios.find(
    (candidate) => candidate.scenarioId === scenarioId,
  );
  if (!result) throw new Error(`Missing scenario ${scenarioId}`);
  return result;
}

function expectedSideCounts(
  samples: ReturnType<typeof buildRealEngineDecisionCorpus>,
) {
  return samples.reduce(
    (counts, sample) => ({
      ...counts,
      [sample.side]: counts[sample.side] + 1,
    }),
    { runner: 0, corp: 0 },
  );
}
