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
    expect(report.metrics.scopeCandidateCount).toBe(90);
    expect(report.metrics.scopeAllowedCount).toBe(26);
    expect(report.metrics.pilotWouldOverrideCount).toBe(26);
    expect(report.metrics.pilotActualOverrideCount).toBe(0);
    expect(report.metrics.averageScoreGap).toBe(21.276);
    expect(report.metrics.blockedByReason).toMatchObject({
      basic_setup_action_type_blocked: 17,
      corp_score_window_wrong_side: 15,
      runner_safe_access_wrong_side: 15,
    });
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
      scenario(report, "runner_real_low_credits").expectedPilotEligibleScopes,
    ).toEqual(["basic_setup"]);
    expect(scenario(report, "runner_real_low_credits").forbiddenMistakes).toEqual([
      "economy_starvation",
    ]);
    expect(scenario(report, "runner_real_low_credits").expectationNotes).toEqual([
      "low credits should prefer economy or draw stabilization",
    ]);
    expect(scenario(report, "runner_real_low_credits").evidence).toEqual(
      expect.arrayContaining([
        "expectation_source:real_engine_corpus_metadata",
        "league_expectation_source:corpus_metadata:runner_real_low_credits",
      ]),
    );
    expect(
      scenario(report, "runner_real_safe_hq_access").expectedTopActionTypes,
    ).toEqual(["start_run"]);
    expect(
      scenario(report, "runner_real_remote_score_threat")
        .remoteContestPilotCandidate,
    ).toMatchObject({
      targetKind: "remote",
      scoreThreat: true,
      candidateStatus: "eligible",
      structuredAlignment: true,
      productiveUseAllowed: false,
      runtimeConsumerStatus: "none",
      evidence: expect.arrayContaining([
        "remote_contest_candidate:report_only",
        "productive_use_allowed:false",
        "runtime_consumer:none",
        "alignment_source:legal_action_payload",
        "remote_contest_candidate_status:eligible",
      ]),
    });
    expect(scenario(report, "runner_real_low_credits").pilotEligibility).toMatchObject({
      eligible: true,
      scopeCandidateCount: 3,
      scopeAllowedCount: 1,
      wouldOverride: true,
      actualOverride: false,
      scopes: ["basic_setup"],
      scoreGap: 37,
      blockedByReason: {
        corp_score_window_wrong_side: 1,
        runner_safe_access_action_type_blocked: 1,
      },
      reportOnly: true,
      productiveUseAllowed: false,
      evidence: expect.arrayContaining([
        "pilot_scope_eligible:true",
        "pilot_scope_candidate_count:3",
        "pilot_scope_allowed_count:1",
        "pilot_would_override:true",
        "pilot_actual_override:false",
        "score_gap:37",
        "pilot_eligibility:report_only",
        "productive_use_allowed:false",
        "pilot_scope:basic_setup:eligible",
      ]),
    });
    expect(scenario(report, "runner_real_safe_hq_access").pilotEligibility).toMatchObject({
      eligible: true,
      scopeCandidateCount: 3,
      scopeAllowedCount: 1,
      wouldOverride: true,
      actualOverride: false,
      scopes: ["runner_safe_access"],
      scoreGap: 7,
      blockedByReason: {
        basic_setup_action_type_blocked: 1,
        corp_score_window_wrong_side: 1,
      },
      reportOnly: true,
      productiveUseAllowed: false,
      evidence: expect.arrayContaining([
        "pilot_scope_eligible:true",
        "pilot_scope_candidate_count:3",
        "pilot_scope_allowed_count:1",
        "pilot_would_override:true",
        "pilot_actual_override:false",
        "score_gap:7",
        "pilot_eligibility:report_only",
        "productive_use_allowed:false",
        "pilot_scope:runner_safe_access:eligible",
      ]),
    });
    expect(
      report.scenarios.every(
        (candidate) =>
          candidate.pilotEligibility.reportOnly &&
          candidate.pilotEligibility.productiveUseAllowed === false,
      ),
    ).toBe(true);
  });

  it("derives league expectations directly from corpus sample metadata", () => {
    const samples = buildRealEngineDecisionCorpus(
      buildRealEngineDecisionCorpusScenarios(),
    );
    const expectations = playStrengthShadowLeagueExpectationsFromSamples(samples);

    expect(expectations).toEqual(
      samples.flatMap((sample) =>
        sample.leagueExpectation
          ? [
              {
                scenarioId: sample.scenarioId,
                ...sample.leagueExpectation,
              },
            ]
          : [],
      ),
    );
    expect(expectations.length).toBeGreaterThan(0);
    expect(
      expectations.every((expectation) =>
        expectation.evidence?.some((entry) =>
          entry.startsWith("league_expectation_source:corpus_metadata:"),
        ),
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
