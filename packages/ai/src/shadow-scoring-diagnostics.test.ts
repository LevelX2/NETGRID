import { describe, expect, it } from "vitest";

import {
  DEFAULT_SHADOW_SCORING_FIXTURE_CORPUS,
  buildLegacySemanticComparisonHarnessReport,
  buildShadowActionRankingReport,
  buildShadowScoringFixtureDesignReport,
} from "./shadow-scoring-diagnostics";

describe("buildShadowScoringFixtureDesignReport", () => {
  it("defines a runner and corp fixture corpus for shadow-only scoring design", () => {
    const report = buildShadowScoringFixtureDesignReport();

    expect(report.scope).toBe("shadow_fixture_design_only");
    expect(report.productiveUseAllowed).toBe(false);
    expect(report.summary).toMatchObject({
      fixtureCount: DEFAULT_SHADOW_SCORING_FIXTURE_CORPUS.length,
      runnerFixtureCount: 7,
      corpFixtureCount: 7,
      semanticShadowAllowedCount: 13,
    });
    expect(report.fixtureCorpus).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          scenarioId: "ai047-runner-remote-contest",
          side: "runner",
          expectedRelevantGoals: ["runner_remote_contest"],
        }),
        expect.objectContaining({
          scenarioId: "ai047-corp-tag-trace-punish",
          side: "corp",
          expectedRelevantGoals: ["corp_tag_trace_punish"],
        }),
      ]),
    );
  });

  it("carries the documented top gaps into blocked-gap policy", () => {
    const report = buildShadowScoringFixtureDesignReport();

    expect(report.blockedGapPolicy).toMatchObject({
      scoreStatus: "blocked_by_gap",
      topGaps: expect.arrayContaining([
        "target_context_unavailable",
        "ability_unresolved",
        "card_semantics_unavailable",
      ]),
    });
    expect(report.summary.knownGapCategories).toEqual(
      expect.arrayContaining([
        "target_context_unavailable",
        "ability_unresolved",
        "card_semantics_unavailable",
      ]),
    );
  });

  it("keeps the score draft schema report-only without live score or selection fields", () => {
    const report = buildShadowScoringFixtureDesignReport();
    const serialized = JSON.stringify(report);

    expect(report.scoreDraftSchema.fields).toEqual([
      "candidateId",
      "scenarioId",
      "scoreStatus",
      "goalMatches",
      "hardGateResults",
      "positiveEvidence",
      "negativeEvidence",
      "riskEvidence",
      "missingEvidence",
    ]);
    expect(report.scoreDraftSchema.forbiddenFields).toEqual(
      expect.arrayContaining(["liveScore", "runtimeRank", "selectedAction"]),
    );
    expect(serialized).not.toContain("chooseSemanticAiAction");
    expect(serialized).not.toContain("selectedActionId");
    expect(serialized).not.toContain("rankedAlternatives");
  });
});

describe("buildLegacySemanticComparisonHarnessReport", () => {
  it("compares legacy references against semantic report-only references without execution", () => {
    const report = buildLegacySemanticComparisonHarnessReport();
    const serialized = JSON.stringify(report);

    expect(report.scope).toBe("diagnostic_legacy_semantic_comparison_only");
    expect(report.semanticExecutionAllowed).toBe(false);
    expect(report.productiveUseAllowed).toBe(false);
    expect(report.summary).toEqual({
      scenarioCount: 14,
      comparedScenarios: 6,
      sameReference: 2,
      safeDivergence: 1,
      riskyDivergence: 1,
      insufficientEvidence: 2,
      notCompared: 8,
    });
    expect(serialized).not.toContain("chooseSemanticAiAction");
    expect(serialized).not.toContain("selectedActionId");
    expect(serialized).not.toContain("rankedAlternatives");
  });

  it("surfaces risky legacy divergence when legacy points to a blocked gap candidate", () => {
    const report = buildLegacySemanticComparisonHarnessReport();
    const accessComparison = report.entries.find(
      (entry) => entry.scenarioId === "ai047-runner-access-decision",
    );

    expect(accessComparison).toEqual(
      expect.objectContaining({
        category: "risky_divergence",
        legacyActionRef: "ai047-runner-access-decision.trash_accessed_card",
        semanticReportOnlyRef: "ai047-runner-access-decision.steal_agenda",
        semanticBucket: "score_draft_available",
      }),
    );
  });

  it("marks fully blocked semantic references as insufficient evidence", () => {
    const report = buildLegacySemanticComparisonHarnessReport();
    const ambushComparison = report.entries.find(
      (entry) => entry.scenarioId === "ai047-corp-ambush-access-punish",
    );

    expect(ambushComparison).toEqual(
      expect.objectContaining({
        category: "insufficient_evidence",
        semanticBucket: "blocked_by_gate",
      }),
    );
  });
});

describe("buildShadowActionRankingReport", () => {
  it("creates report-only shadow ordering without semantic execution", () => {
    const report = buildShadowActionRankingReport();
    const serialized = JSON.stringify(report);

    expect(report.scope).toBe("report_only_shadow_ordering");
    expect(report.semanticExecutionAllowed).toBe(false);
    expect(report.productiveUseAllowed).toBe(false);
    expect(report.summary).toEqual({
      scenarioCount: 14,
      candidateCount: 26,
      scoreDraftAvailable: 15,
      blockedByGap: 10,
      blockedByGate: 1,
      notScored: 0,
    });
    expect(serialized).not.toContain("chooseSemanticAiAction");
    expect(serialized).not.toContain("selectedActionId");
    expect(serialized).not.toContain("rankedAlternatives");
  });

  it("orders available report-only candidates before blocked gap candidates per scenario", () => {
    const report = buildShadowActionRankingReport();
    const accessScenario = report.scenarioReports.find(
      (scenario) => scenario.scenarioId === "ai047-runner-access-decision",
    );

    expect(accessScenario?.orderedCandidates.map((candidate) => candidate.bucket)).toEqual([
      "score_draft_available",
      "score_draft_available",
      "blocked_by_gap",
    ]);
    expect(accessScenario?.orderedCandidates[2]).toEqual(
      expect.objectContaining({
        candidateId: "ai047-runner-access-decision.trash_accessed_card",
        unresolvedGaps: ["target_context_unavailable"],
      }),
    );
  });

  it("keeps hidden-info fixtures blocked by gate with explicit evidence", () => {
    const report = buildShadowActionRankingReport();
    const ambushScenario = report.scenarioReports.find(
      (scenario) => scenario.scenarioId === "ai047-corp-ambush-access-punish",
    );

    expect(ambushScenario?.hardGateFailureCategories).toEqual(["hidden_info"]);
    expect(ambushScenario?.orderedCandidates[0]).toEqual(
      expect.objectContaining({
        bucket: "blocked_by_gate",
        hardGateFailures: ["hidden_info"],
        reportOnlyOrderIndex: 0,
      }),
    );
  });
});
