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
  type SemanticShadowLeagueReport,
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
      playStrengthShadowLeagueExpectationsFromSamples(samples).filter(
        (expectation) =>
          (expectation.expectedTopActionTypes?.length ?? 0) > 0 ||
          (expectation.expectedTopActionIds?.length ?? 0) > 0,
      ).length,
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
    expect(report.metrics.scopeCandidateCount).toBe(samples.length * 3);
    expect(report.metrics.scopeAllowedCount).toBe(45);
    expect(report.metrics.pilotWouldOverrideCount).toBe(45);
    expect(report.metrics.pilotActualOverrideCount).toBe(0);
    expect(report.metrics.averageScoreGap).toBeGreaterThan(0);
    expect(report.metrics.blockedByReason).toMatchObject({
      basic_setup_action_type_blocked: expect.any(Number),
      corp_score_window_wrong_side: report.sideCounts.runner,
      runner_safe_access_wrong_side: report.sideCounts.corp,
    });
    expect(report.metrics.pilotEligibilityRate).toBeCloseTo(
      report.metrics.pilotEligibleCount / samples.length,
      3,
    );
    for (const side of ["runner", "corp"] as const) {
      const bySide = report.metrics.pilotEligibilityBySide[side];
      expect(bySide.scenarioCount).toBe(report.sideCounts[side]);
      expect(bySide.eligibleCount).toBeGreaterThan(0);
      expect(bySide.wouldOverrideCount).toBe(bySide.eligibleCount);
      expect(bySide.eligibleRate).toBeCloseTo(
        bySide.eligibleCount / bySide.scenarioCount,
        3,
      );
    }
    expect(
      Object.values(report.metrics.scopeBreakdown).reduce(
        (sum, scope) => sum + scope.eligibleCount,
        0,
      ),
    ).toBe(report.metrics.pilotEligibleCount);
    expect(report.metrics.scopeBreakdown.corp_score_window.eligibleCount).toBe(
      4,
    );
    expect(report.metrics.pilotCutoverReadiness).toMatchObject({
      productiveUseAllowed: false,
      runtimeConsumerStatus: "none",
      noRuntimeEffect: true,
      scopes: {
        basic_setup: {
          candidate: report.scenarioCount,
          allowed: report.metrics.scopeBreakdown.basic_setup.eligibleCount,
          wouldOverride:
            report.metrics.scopeBreakdown.basic_setup.wouldOverrideCount,
          actualOverride: 0,
          safeToEnableLocally: true,
          recommendedForDefaultOffPilot: true,
          blockedByDoctrineConflict: false,
          recommendation: "default_off_candidate",
        },
        runner_safe_access: {
          candidate: report.scenarioCount,
          allowed:
            report.metrics.scopeBreakdown.runner_safe_access.eligibleCount,
          wouldOverride:
            report.metrics.scopeBreakdown.runner_safe_access.wouldOverrideCount,
          actualOverride: 0,
          safeToEnableLocally: true,
          recommendedForDefaultOffPilot: true,
          blockedByRisk: false,
          recommendation: "default_off_candidate",
        },
        corp_score_window: {
          candidate: report.scenarioCount,
          allowed:
            report.metrics.scopeBreakdown.corp_score_window.eligibleCount,
          wouldOverride:
            report.metrics.scopeBreakdown.corp_score_window.wouldOverrideCount,
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
    expect(
      report.metrics.doctrineGoalActionFit.doctrineGoalsProduced,
    ).toBeGreaterThan(0);
    expect(
      report.metrics.doctrineGoalActionFit.goalsWithAtLeastOneFit,
    ).toBeGreaterThan(0);
    expect(report.metrics.remoteContestPilotCandidateCount).toBe(3);
    expect(report.metrics.remoteContestPilotCandidateScenarioIds).toEqual([
      "runner_real_remote_known_agenda_contest",
      "runner_real_remote_score_threat",
      "runner_real_target_choice_hq_remote_mix",
    ]);
    expect(report.topDisagreementReasons).toEqual(
      expect.arrayContaining([
        "corp_real_advance_score_window:expected=advance_card:observed=gain_credit",
        "runner_real_tag_cleanup:expected=remove_tag:observed=start_run",
      ]),
    );
    expect(report.topDisagreementReasons).not.toEqual(
      expect.arrayContaining([
        expect.stringMatching(/runner_real_.*damage.*expected=draw_card/),
      ]),
    );
    expect(report.followupCandidates).toHaveLength(
      report.topDisagreementReasons.length,
    );
    expect(report.followupCandidates).toEqual(
      expect.arrayContaining([
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
    ).toEqual(["start_run"]);
    expect(
      scenario(report, "runner_real_low_credits").expectedPilotEligibleScopes,
    ).toEqual(["runner_safe_access"]);
    expect(
      scenario(report, "runner_real_low_credits").forbiddenMistakes,
    ).toEqual(["missed_safe_access"]);
    expect(
      scenario(report, "runner_real_low_credits").expectationNotes,
    ).toEqual(["low credits should still take free unknown R&D access"]);
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
    expect(
      scenario(report, "runner_real_low_credits").pilotEligibility,
    ).toMatchObject({
      eligible: true,
      scopeCandidateCount: 3,
      scopeAllowedCount: 1,
      wouldOverride: true,
      actualOverride: false,
      scopes: ["runner_safe_access"],
      scoreGap: 3,
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
        "score_gap:3",
        "pilot_eligibility:report_only",
        "productive_use_allowed:false",
        "pilot_scope:runner_safe_access:eligible",
      ]),
    });
    expect(
      scenario(report, "runner_real_safe_hq_access").pilotEligibility,
    ).toMatchObject({
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
    const expectations =
      playStrengthShadowLeagueExpectationsFromSamples(samples);

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
      scenarioCount: report.scenarioCount,
      eligible: 21,
      wouldOverride: 21,
      badOverrideRisk: 0,
      knownNoGoCases: [],
      recommendation: "local_default_dry_run_candidate",
      productiveUseAllowed: false,
      runtimeConsumerStatus: "none",
      noRuntimeEffect: true,
    });
    expect(
      dryRun.blockedReasons.basic_setup_action_type_blocked,
    ).toBeGreaterThan(0);
    expect(dryRun.evidence).toEqual(
      expect.arrayContaining([
        "local_default_dry_run_scope:basic_setup",
        "recommendation:local_default_dry_run_candidate",
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
      scenarioCount: report.scenarioCount,
      eligible: 20,
      wouldOverride: 20,
      badOverrideRisk: 0,
      knownNoGoCases: [],
      recommendation: "local_default_dry_run_candidate",
      centralOnlyCases: expect.any(Number),
      riskBlockedCases: expect.any(Number),
      evidenceOnlyBlockedCases: expect.any(Number),
      structuredAlignmentCases: 20,
      falsePositiveCandidates: 0,
      productiveUseAllowed: false,
      runtimeConsumerStatus: "none",
      noRuntimeEffect: true,
    });
    expect(dryRun.centralOnlyCases).toBeGreaterThan(0);
    expect(dryRun.blockedReasons.runner_safe_access_wrong_side).toBe(
      report.sideCounts.corp,
    );
  });

  it("bounds runner safe access dry-run text classifiers", () => {
    const dryRun = buildLocalDefaultPilotDryRunReport(
      minimalRunnerSafeAccessReport(),
      "runner_safe_access",
    );

    expect(dryRun.centralOnlyCases).toBe(1);
    expect(dryRun.riskBlockedCases).toBe(1);
    expect(dryRun.evidenceOnlyBlockedCases).toBe(1);
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
      scenarioCount: report.scenarioCount,
      eligible: 4,
      wouldOverride: 4,
      recommendation: "keep_env_gated",
      productiveUseAllowed: false,
      runtimeConsumerStatus: "none",
      noRuntimeEffect: true,
    });
    expect(dryRun.blockedReasons.corp_score_window_wrong_side).toBe(
      report.sideCounts.runner,
    );
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

function minimalRunnerSafeAccessReport(): SemanticShadowLeagueReport {
  return {
    scenarioCount: 4,
    scenarios: [
      dryRunScenario({
        scenarioId: "safe-notremote-token",
        topActionId: "notremote-run",
        scopes: ["runner_safe_access"],
      }),
      dryRunScenario({
        scenarioId: "safe-remote-token",
        topActionId: "remote_run",
        scopes: ["runner_safe_access"],
      }),
      dryRunScenario({
        scenarioId: "risk-token",
        blockedByReason: {
          runner_safe_access_risk_gate: 1,
          runner_safe_access_brisk_gate: 1,
        },
      }),
      dryRunScenario({
        scenarioId: "structured-token",
        blockedByReason: {
          runner_safe_access_structured_alignment_required: 1,
          runner_safe_access_structured_alignment_requiredish: 1,
        },
      }),
    ],
    metrics: {
      pilotCutoverReadiness: {
        scopes: {
          runner_safe_access: {
            recommendation: "default_off_candidate",
          },
        },
      },
    },
  } as unknown as SemanticShadowLeagueReport;
}

function dryRunScenario(params: {
  scenarioId: string;
  topActionId?: string;
  scopes?: string[];
  blockedByReason?: Record<string, number>;
}) {
  return {
    scenarioId: params.scenarioId,
    side: "runner",
    topActionType: "start_run",
    topActionId: params.topActionId ?? "draw",
    observedMistakes: [],
    pilotEligibility: {
      scopes: params.scopes ?? [],
      wouldOverride: false,
      blockedByReason: params.blockedByReason ?? {},
    },
  };
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
