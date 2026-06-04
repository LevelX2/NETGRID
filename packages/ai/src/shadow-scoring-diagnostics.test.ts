import { describe, expect, it } from "vitest";

import {
  DEFAULT_SHADOW_SCORING_FIXTURE_CORPUS,
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
