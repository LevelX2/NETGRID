import { describe, expect, it } from "vitest";
import { containsForbiddenSemanticMarker } from "../diagnostics/semantic-redaction";
import {
  buildRealEngineDecisionCorpusScenarios,
  REAL_ENGINE_DECISION_CORPUS_SCENARIO_IDS,
} from "./real-engine-decision-corpus-fixtures";
import { buildRealEngineDecisionCorpus } from "./real-engine-decision-corpus";
import {
  buildLocalDefaultPilotDryRunReport,
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
    expect(report.metrics.pilotEligibleCount).toBe(45);
    expect(report.metrics.scopeCandidateCount).toBe(162);
    expect(report.metrics.scopeAllowedCount).toBe(45);
    expect(report.metrics.pilotWouldOverrideCount).toBe(45);
    expect(report.metrics.pilotActualOverrideCount).toBe(0);
    expect(report.metrics.averageScoreGap).toBe(25);
    expect(report.metrics.blockedByReason).toMatchObject({
      basic_setup_action_type_blocked: 30,
      corp_score_window_wrong_side: 27,
      runner_safe_access_wrong_side: 27,
    });
    expect(report.metrics.pilotEligibilityRate).toBe(0.833);
    expect(report.metrics.pilotEligibilityBySide.runner).toEqual({
      scenarioCount: 27,
      eligibleCount: 22,
      wouldOverrideCount: 22,
      eligibleRate: 0.815,
    });
    expect(report.metrics.pilotEligibilityBySide.corp).toEqual({
      scenarioCount: 27,
      eligibleCount: 23,
      wouldOverrideCount: 23,
      eligibleRate: 0.852,
    });
    expect(report.metrics.scopeBreakdown.basic_setup.eligibleCount).toBe(23);
    expect(report.metrics.scopeBreakdown.runner_safe_access.eligibleCount).toBe(18);
    expect(report.metrics.scopeBreakdown.corp_score_window.eligibleCount).toBe(4);
    expect(report.metrics.pilotCutoverReadiness).toMatchObject({
      productiveUseAllowed: false,
      runtimeConsumerStatus: "none",
      noRuntimeEffect: true,
      scopes: {
        basic_setup: {
          candidate: 54,
          allowed: 23,
          wouldOverride: 23,
          actualOverride: 0,
          safeToEnableLocally: true,
          recommendedForDefaultOffPilot: true,
          blockedByDoctrineConflict: false,
          recommendation: "default_off_candidate",
        },
        runner_safe_access: {
          candidate: 54,
          allowed: 18,
          wouldOverride: 18,
          actualOverride: 0,
          safeToEnableLocally: true,
          recommendedForDefaultOffPilot: true,
          blockedByRisk: false,
          recommendation: "default_off_candidate",
        },
        corp_score_window: {
          candidate: 54,
          allowed: 4,
          wouldOverride: 4,
          actualOverride: 0,
          safeToEnableLocally: false,
          recommendedForDefaultOffPilot: false,
          blockedByInsufficientCorpus: true,
          recommendation: "keep_env_gated",
        },
        remote_contest_report_only: {
          candidate: 3,
          allowed: 3,
          wouldOverride: 0,
          actualOverride: 0,
          safeToEnableLocally: false,
          recommendedForDefaultOffPilot: false,
          blockedByInsufficientCorpus: true,
          blockedByTargetChoice: true,
          recommendation: "report_only",
        },
        target_choice_shadow_only: {
          candidate: 0,
          allowed: 0,
          wouldOverride: 0,
          actualOverride: 0,
          safeToEnableLocally: false,
          recommendedForDefaultOffPilot: false,
          blockedByInsufficientCorpus: true,
          blockedByTargetChoice: true,
          recommendation: "report_only",
        },
      },
    });
    expect(report.metrics.pilotCutoverReadiness.evidence).toEqual(
      expect.arrayContaining([
        "pilot_cutover_readiness:report_only",
        "runtime_consumer:none",
        "productive_use_allowed:false",
      ]),
    );
    expect(report.metrics.doctrineGoalActionFit).toMatchObject({
      doctrineGoalsProduced: expect.any(Number),
      goalsWithAtLeastOneFit: expect.any(Number),
      goalsOnlyBlocked: expect.any(Number),
      goalsNoCandidate: expect.any(Number),
      topFitByFamily: expect.any(Object),
    });
    expect(report.metrics.doctrineGoalActionFit.doctrineGoalsProduced).toBeGreaterThan(
      0,
    );
    expect(
      report.metrics.doctrineGoalActionFit.goalsWithAtLeastOneFit,
    ).toBeGreaterThan(0);
    expect(report.metrics.remoteContestPilotCandidateCount).toBe(3);
    expect(report.metrics.remoteContestPilotCandidateScenarioIds).toEqual([
      "runner_real_remote_known_agenda_contest",
      "runner_real_remote_score_threat",
      "runner_real_target_choice_hq_remote_mix",
    ]);
    expect(report.topDisagreementReasons).toEqual([
      "corp_real_advance_not_score_yet:expected=advance_card:observed=gain_credit",
      "corp_real_advance_score_window:expected=advance_card:observed=gain_credit",
      "corp_real_target_choice_multi_advance_payload:expected=advance_card:observed=gain_credit",
      "runner_real_damage_buffer_needed:expected=draw_card:observed=start_run",
      "runner_real_draw_before_damage_risk:expected=draw_card:observed=start_run",
      "runner_real_tag_cleanup:expected=remove_tag:observed=start_run",
      "runner_real_tagged_remove_before_run:expected=remove_tag:observed=start_run",
    ]);
    expect(report.followupCandidates).toHaveLength(8);
    expect(report.followupCandidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          scenarioId: "corp_real_advance_score_window",
          issueClass: "forbidden_mistake",
          suggestedPackage: "forbidden-mistake-regression",
          evidence: expect.arrayContaining([
            "scenario:corp_real_advance_score_window",
            "issue_class:forbidden_mistake",
            "observed_mistake:missed_score_window",
          ]),
        }),
        expect.objectContaining({
          scenarioId: "runner_real_tag_cleanup",
          issueClass: "expectation_mismatch",
          suggestedPackage: "shadow-league-expectation-review",
        }),
      ]),
    );
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
      scoreGap: 25,
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
        "score_gap:25",
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

  it("reports basic setup as a local default dry-run candidate without runtime effect", () => {
    const report = buildSemanticShadowLeagueReport(
      buildRealEngineDecisionCorpus(buildRealEngineDecisionCorpusScenarios()),
    );

    const dryRun = buildLocalDefaultPilotDryRunReport(report, "basic_setup");

    expect(dryRun).toMatchObject({
      scope: "basic_setup",
      scenarioCount: 54,
      eligible: 23,
      wouldOverride: 23,
      badOverrideRisk: 1,
      knownNoGoCases: ["corp_real_advance_score_window"],
      recommendation: "do_not_default",
      productiveUseAllowed: false,
      runtimeConsumerStatus: "none",
      noRuntimeEffect: true,
    });
    expect(dryRun.blockedReasons.basic_setup_action_type_blocked).toBe(30);
    expect(dryRun.evidence).toEqual(
      expect.arrayContaining([
        "local_default_dry_run_scope:basic_setup",
        "recommendation:do_not_default",
        "productive_use_allowed:false",
      ]),
    );
  });

  it("reports runner safe access dry-run structure metrics", () => {
    const report = buildSemanticShadowLeagueReport(
      buildRealEngineDecisionCorpus(buildRealEngineDecisionCorpusScenarios()),
    );

    const dryRun = buildLocalDefaultPilotDryRunReport(
      report,
      "runner_safe_access",
    );

    expect(dryRun).toMatchObject({
      scope: "runner_safe_access",
      scenarioCount: 54,
      eligible: 18,
      wouldOverride: 18,
      badOverrideRisk: 0,
      knownNoGoCases: [],
      recommendation: "local_default_dry_run_candidate",
      centralOnlyCases: expect.any(Number),
      riskBlockedCases: expect.any(Number),
      evidenceOnlyBlockedCases: expect.any(Number),
      structuredAlignmentCases: 18,
      falsePositiveCandidates: 0,
      productiveUseAllowed: false,
      runtimeConsumerStatus: "none",
      noRuntimeEffect: true,
    });
    expect(dryRun.centralOnlyCases).toBeGreaterThan(0);
    expect(dryRun.blockedReasons.runner_safe_access_wrong_side).toBe(27);
  });

  it("keeps corp score window env-gated in the local default dry-run", () => {
    const report = buildSemanticShadowLeagueReport(
      buildRealEngineDecisionCorpus(buildRealEngineDecisionCorpusScenarios()),
    );

    const dryRun = buildLocalDefaultPilotDryRunReport(
      report,
      "corp_score_window",
    );

    expect(dryRun).toMatchObject({
      scope: "corp_score_window",
      scenarioCount: 54,
      eligible: 4,
      wouldOverride: 4,
      recommendation: "keep_env_gated",
      productiveUseAllowed: false,
      runtimeConsumerStatus: "none",
      noRuntimeEffect: true,
    });
    expect(dryRun.blockedReasons.corp_score_window_wrong_side).toBe(27);
    expect(dryRun.evidence).toEqual(
      expect.arrayContaining(["recommendation:keep_env_gated"]),
    );
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
