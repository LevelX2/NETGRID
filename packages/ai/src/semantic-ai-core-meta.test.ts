import { describe, expect, it } from "vitest";

import {
  META1_BOARDSTATE_OVERRIDE_EXAMPLES,
  META1_CORP_GOAL_FAMILIES,
  META1_PIVOT_RULES,
  META1_RUNNER_GOAL_FAMILIES,
  META2_ARCHETYPE_FIXTURES,
  META2_BOARDSTATE_OVERRIDE_FIXTURES,
  META2_CONSUMER_GROUPS,
  META2_EVALUATION_ORDER,
  META2_HUMAN_REVIEW_CATEGORIES,
  buildDeckDoctrineFromProfile,
  buildDeckStrategicProfile,
  buildMeta1DeckDoctrineTacticalGoalEngineReport,
  buildMeta2SemanticDecisionCoreReport,
  buildSemanticDecisionScore,
} from "./semantic-ai-core-meta";

describe("META1 DeckDoctrine + Multi-Turn TacticalGoal Engine v0", () => {
  it("defines side-balanced schema coverage without enabling runtime action selection", () => {
    const report = buildMeta1DeckDoctrineTacticalGoalEngineReport();

    expect(report.schemaVersion).toBe(
      "meta1-deck-doctrine-tactical-goal-engine-v0",
    );
    expect(report.step).toBe("META1");
    expect(report.schemaCoverage).toMatchObject({
      deckStrategicProfileSchema: true,
      deckDoctrineSchema: true,
      tacticalGoalStateSchema: true,
      neutralDoctrineRule: true,
      boardstatePivotRules: META1_PIVOT_RULES.length,
      runnerGoalFamilies: META1_RUNNER_GOAL_FAMILIES.length,
      corpGoalFamilies: META1_CORP_GOAL_FAMILIES.length,
    });
    expect(report.productiveUseAllowed).toBe(false);
    expect(report.semanticExecutionAllowed).toBe(false);
    expect(report.runtimeConsumerStatus).toBe("none");
    expect(report.hardGates).toEqual({
      illegalSemanticDecisionCount: 0,
      hiddenInfoViolationCount: 0,
      runtimeConsumerCount: 0,
      actionSelectionCount: 0,
      plannerWeightChangeCount: 0,
    });
  });

  it("keeps NeutralDoctrine from inventing a primary strategy from support packages", () => {
    const neutralProfile = buildDeckStrategicProfile({
      profileId: "test-neutral-runner",
      side: "runner",
      supportPackages: [
        {
          packageId: "economy",
          cards: ["basic-credit"],
          signals: ["economy.basic"],
          strength: "strong",
        },
      ],
    });
    const doctrine = buildDeckDoctrineFromProfile(neutralProfile);

    expect(neutralProfile.neutralDoctrine).toBe(true);
    expect(neutralProfile.primaryStrategies).toEqual([]);
    expect(neutralProfile.warnings).toContain(
      "NeutralDoctrine: support packages were not promoted to strategy.",
    );
    expect(doctrine.neutralDoctrine).toBe(true);
    expect(doctrine.primaryPlan).toBeUndefined();
    expect(doctrine.supportPriorities).toEqual([
      expect.objectContaining({ priorityId: "runner_economy_stabilize" }),
    ]);
  });

  it("models multi-turn TacticalGoalState lifecycle, progress and blockers", () => {
    const report = buildMeta1DeckDoctrineTacticalGoalEngineReport();

    expect(report.tacticalGoalStates.length).toBeGreaterThan(0);
    expect(report.tacticalGoalStates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          lifecycle: "active",
          requiredConditions: expect.arrayContaining([
            "engine_legal_action_membership",
            "side_safe_board_summary",
          ]),
          successCriteria: expect.any(Array),
          failureCriteria: expect.arrayContaining(["blocked_by_hard_gate"]),
        }),
        expect.objectContaining({
          lifecycle: "blocked",
          blockers: expect.arrayContaining(["boardstate_blocks_goal"]),
          whyBlocked: expect.arrayContaining([
            "Pivot rule blocks this goal until trigger condition is satisfied.",
          ]),
        }),
      ]),
    );
  });

  it("makes Boardstate able to override Doctrine through explicit pivot examples", () => {
    const report = buildMeta1DeckDoctrineTacticalGoalEngineReport();

    expect(META1_BOARDSTATE_OVERRIDE_EXAMPLES).toHaveLength(4);
    expect(report.gates.boardstateMayOverrideDoctrine).toBe(true);
    expect(report.boardstateOverrideExamples).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          exampleId: "runner-rnd-pressure-contests-remote",
          doctrinePreference: "runner_pressure_rnd",
          boardstateOverride: "runner_contest_remote",
        }),
        expect.objectContaining({
          exampleId: "corp-score-window-needs-economy",
          doctrinePreference: "corp_score_agenda",
          boardstateOverride: "corp_economy_stabilize",
        }),
      ]),
    );
  });
});

describe("META2 Semantic Decision Core + Quality Calibration", () => {
  it("defines consumer groups, ordered scoring stages and separated score components", () => {
    const report = buildMeta2SemanticDecisionCoreReport();

    expect(report.schemaVersion).toBe(
      "meta2-semantic-decision-core-quality-calibration-v0",
    );
    expect(report.step).toBe("META2");
    expect(report.consumerGroups).toEqual(META2_CONSUMER_GROUPS);
    expect(report.evaluationOrder).toEqual(META2_EVALUATION_ORDER);
    expect(report.evaluationOrder.slice(0, 5)).toEqual([
      "Engine LegalAction membership",
      "HiddenInfo / side visibility",
      "Reachability",
      "Cost / Timing",
      "Required Target / Ability / Card Semantics",
    ]);
    expect(report.scoreSchema.componentFields).toEqual([
      "goalFit",
      "doctrineFit",
      "boardUrgency",
      "reachability",
      "costFit",
      "timingFit",
      "targetFit",
      "riskPenalty",
      "opportunityValue",
    ]);
  });

  it("blocks totals when hard gates fail and blocks by gap when evidence is missing", () => {
    const hiddenScore = buildSemanticDecisionScore({
      candidateId: "hidden",
      actionId: "legal.hidden",
      actionType: "trash_accessed_card",
      legalActionMember: true,
      hiddenInfoSafe: false,
      reachabilityReady: true,
      costTimingReady: true,
      targetAbilityCardReady: true,
      matchedGoals: ["runner_access_payoff"],
      doctrineGoals: ["runner_access_payoff"],
      boardUrgency: "medium",
      consumerGroupMatches: [],
      riskPenalty: 0,
      opportunityValue: 1,
    });
    const gapScore = buildSemanticDecisionScore({
      candidateId: "gap",
      actionId: "legal.score",
      actionType: "score_agenda",
      legalActionMember: true,
      hiddenInfoSafe: true,
      reachabilityReady: true,
      costTimingReady: false,
      targetAbilityCardReady: false,
      matchedGoals: ["corp_score_agenda"],
      doctrineGoals: ["corp_score_agenda"],
      boardUrgency: "high",
      consumerGroupMatches: [],
      riskPenalty: 0,
      opportunityValue: 2,
    });

    expect(hiddenScore.scoreStatus).toBe("blocked_by_gate");
    expect(hiddenScore.total).toBeUndefined();
    expect(hiddenScore.whyNot).toEqual(
      expect.arrayContaining(["Hard gate blocked: hidden_info"]),
    );
    expect(gapScore.scoreStatus).toBe("blocked_by_gap");
    expect(gapScore.total).toBeUndefined();
    expect(gapScore.whyNot).toEqual(
      expect.arrayContaining([
        "Cost or timing evidence is missing.",
        "Target, ability or card semantic evidence is missing.",
      ]),
    );
  });

  it("covers archetype and boardstate-override fixtures required for calibration", () => {
    const report = buildMeta2SemanticDecisionCoreReport();

    expect(META2_ARCHETYPE_FIXTURES).toHaveLength(14);
    expect(META2_BOARDSTATE_OVERRIDE_FIXTURES).toHaveLength(6);
    expect(META2_HUMAN_REVIEW_CATEGORIES).toEqual(
      expect.arrayContaining([
        "semantic_better",
        "legacy_better",
        "unsafe_divergence",
        "missing_action_context",
      ]),
    );
    expect(report.boardstateOverrideFixtures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fixtureId: "rnd-pressure-runner-must-contest-remote",
          boardstateGoal: "runner_contest_remote",
        }),
        expect.objectContaining({
          fixtureId: "corp-open-rnd-prioritizes-central-defense",
          boardstateGoal: "corp_defend_rnd",
        }),
      ]),
    );
  });

  it("keeps quality gates green while actual decisions remain legacy", () => {
    const report = buildMeta2SemanticDecisionCoreReport();

    expect(report.summary).toMatchObject({
      archetypeFixtureCount: 14,
      boardstateOverrideFixtureCount: 6,
      shadowScoreAvailableCount: 1,
      blockedByGateCount: 1,
      blockedByGapCount: 1,
      whyNotCount: 2,
    });
    expect(report.qualityGates).toEqual({
      unsafeDivergenceCount: 0,
      illegalSemanticDecisionCount: 0,
      hiddenInfoViolationCount: 0,
      unreachablePreferredActionCount: 0,
      scoreWithoutExplanationCount: 0,
      actualDecision: "legacy",
    });
    expect(report.productiveUseAllowed).toBe(false);
    expect(report.semanticExecutionAllowed).toBe(false);
    expect(report.runtimeConsumerStatus).toBe("none");
  });
});
