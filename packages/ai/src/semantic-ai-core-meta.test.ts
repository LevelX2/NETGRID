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
  META3_CUTOVER_GATE,
  META3_DEFAULT_FLAGS,
  META3_ROLLBACK_TRIGGERS,
  META3_SCOPE_MATRIX,
  META3_TRACE_CONTRACT_FIELDS,
  META4_CANARY_FIXTURES,
  adaptSemanticDecisionToLegacyActual,
  buildDeckDoctrineFromProfile,
  buildDeckStrategicProfile,
  buildMeta1DeckDoctrineTacticalGoalEngineReport,
  buildMeta2SemanticDecisionCoreReport,
  buildMeta3CutoverSafetyEnvelopeReport,
  buildMeta4AgreementOnlyRuntimeCanaryReport,
  buildSemanticDecisionScore,
  runAgreementOnlyCanary,
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

describe("META4 Agreement-only Runtime Canary", () => {
  it("keeps default config legacy-only and behavior delta at zero", () => {
    const report = buildMeta4AgreementOnlyRuntimeCanaryReport();

    expect(report.schemaVersion).toBe(
      "meta4-agreement-only-runtime-canary-v0",
    );
    expect(report.step).toBe("META4");
    expect(report.defaultConfig).toMatchObject({
      semanticAiAgreementOnlyMode: false,
      semanticAiRollbackForceLegacy: true,
    });
    expect(report.fixtureResults.find((entry) => entry.fixtureId === "meta4-default-config-legacy")).toMatchObject({
      result: "default_legacy",
      actualActionId: "legal.gain_credit.1",
      behaviorDelta: false,
      sameActionConfirmation: false,
    });
    expect(report.summary.behaviorDeltaCount).toBe(0);
    expect(report.summary.actualDecisionOverrideCount).toBe(0);
  });

  it("confirms only same semantic and legacy action ids when every gate passes", () => {
    const sameAction = runAgreementOnlyCanary({
      fixtureId: "same",
      legalActionIds: ["legal.draw_card.1"],
      legacyActionId: "legal.draw_card.1",
      semanticActionId: "legal.draw_card.1",
      flags: {
        semanticAiShadowModeEnabled: false,
        semanticAiCutoverEnabled: false,
        semanticAiAgreementOnlyMode: true,
        semanticAiScopedOverrideEnabled: false,
        semanticAiRollbackForceLegacy: false,
      },
      hardGatesPass: true,
      hiddenInfoBlocked: false,
      rollbackForced: false,
      traceAvailable: true,
    });

    expect(sameAction).toMatchObject({
      actualActionId: "legal.draw_card.1",
      result: "same_action_confirmed",
      behaviorDelta: false,
      sameActionConfirmation: true,
      rollbackTriggers: [],
    });
  });

  it("falls back to legacy for differing, illegal, hidden-info, rollback and missing-trace cases", () => {
    const report = buildMeta4AgreementOnlyRuntimeCanaryReport();

    expect(META4_CANARY_FIXTURES).toHaveLength(7);
    expect(report.fixtureResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fixtureId: "meta4-semantic-differs-legacy",
          actualActionId: "legal.gain_credit.1",
          result: "semantic_differs_legacy",
        }),
        expect.objectContaining({
          fixtureId: "meta4-semantic-not-legal",
          actualActionId: "legal.gain_credit.1",
          result: "semantic_not_in_legal_actions",
        }),
        expect.objectContaining({
          fixtureId: "meta4-hidden-info-blocked",
          actualActionId: "legal.decline_trash.1",
          result: "hidden_info_blocked",
        }),
        expect.objectContaining({
          fixtureId: "meta4-rollback-force-legacy",
          actualActionId: "legal.end_turn.1",
          result: "rollback_forced",
        }),
        expect.objectContaining({
          fixtureId: "meta4-missing-trace",
          actualActionId: "legal.remove_tag.1",
          result: "missing_trace",
        }),
      ]),
    );
  });

  it("reports canary quality gates without semantic differing action execution", () => {
    const report = buildMeta4AgreementOnlyRuntimeCanaryReport();

    expect(report.summary).toMatchObject({
      fixtureCount: 7,
      sameActionConfirmationCount: 1,
      semanticDifferingActionExecutedCount: 0,
      behaviorDeltaCount: 0,
      actualDecisionOverrideCount: 0,
      engineRejectCount: 0,
      hiddenInfoViolationCount: 0,
      rollbackTested: true,
      defaultConfigLegacyOnly: true,
      traceCompleteRate: 1,
    });
    expect(report.productiveUseAllowed).toBe(false);
    expect(report.semanticExecutionAllowed).toBe(false);
    expect(report.runtimeConsumerStatus).toBe("test_harness_only");
  });
});

describe("META3 Cutover Safety Envelope", () => {
  it("keeps cutover design allowed but execution and productive cutover blocked", () => {
    const report = buildMeta3CutoverSafetyEnvelopeReport();

    expect(report.schemaVersion).toBe("meta3-cutover-safety-envelope-v0");
    expect(report.step).toBe("META3");
    expect(report.cutoverGate).toEqual(META3_CUTOVER_GATE);
    expect(report.cutoverGate).toEqual({
      cutoverDesignAllowed: true,
      cutoverExecutionAllowed: false,
      productiveCutoverAllowed: false,
    });
    expect(report.defaultFlags).toEqual(META3_DEFAULT_FLAGS);
    expect(report.defaultFlags).toMatchObject({
      semanticAiShadowModeEnabled: false,
      semanticAiCutoverEnabled: false,
      semanticAiAgreementOnlyMode: false,
      semanticAiScopedOverrideEnabled: false,
      semanticAiRollbackForceLegacy: true,
    });
  });

  it("adapts semantic decisions to legacy actual actions and cannot create actions", () => {
    const validDifferent = adaptSemanticDecisionToLegacyActual({
      legalActionIds: ["legacy", "semantic"],
      legacyActionId: "legacy",
      semanticActionId: "semantic",
      hardGateStatus: "pass",
      traceAvailable: true,
    });
    const invalidSemantic = adaptSemanticDecisionToLegacyActual({
      legalActionIds: ["legacy"],
      legacyActionId: "legacy",
      semanticActionId: "semantic-created",
      hardGateStatus: "pass",
      traceAvailable: true,
    });

    expect(validDifferent).toMatchObject({
      actualActionId: "legacy",
      adapterStatus: "semantic_valid_but_execution_disabled",
      semanticActionInLegalActions: true,
    });
    expect(invalidSemantic).toMatchObject({
      actualActionId: "legacy",
      adapterStatus: "semantic_not_in_legal_actions",
      semanticActionInLegalActions: false,
    });
    expect(invalidSemantic.rollbackState.triggers).toContain(
      "semantic_action_not_in_legal_actions",
    );
  });

  it("defines rollback triggers, scope matrix and developer-only trace fields", () => {
    const report = buildMeta3CutoverSafetyEnvelopeReport();

    expect(META3_ROLLBACK_TRIGGERS).toEqual(
      expect.arrayContaining([
        "semantic_action_not_in_legal_actions",
        "hidden_info_gate_failure",
        "engine_reject",
        "runtime_mutation",
        "public_payload_delta",
      ]),
    );
    expect(META3_SCOPE_MATRIX).toMatchObject({
      agreementOnlyScopes: expect.arrayContaining(["gain_credit", "draw_card"]),
      testOnlyOverrideScopes: expect.arrayContaining([
        "runner_remove_tag_when_tagged",
      ]),
      blockedScopes: expect.arrayContaining([
        "hidden_info_choices",
        "multi_ability_unresolved",
      ]),
    });
    expect(report.traceContract).toEqual({
      requiredFields: META3_TRACE_CONTRACT_FIELDS,
      visibilityScope: "developer_only",
      publicPayloadChangesAllowed: false,
    });
  });

  it("keeps every META3 safety quality gate closed for runtime use", () => {
    const report = buildMeta3CutoverSafetyEnvelopeReport();

    expect(report.qualityGates).toEqual({
      productiveFlagsDefaultOff: true,
      rollbackForceLegacyDefaultTrue: true,
      adapterCannotCreateActions: true,
      cutoverExecutionAllowed: false,
      actualDecision: "legacy",
      publicPayloadDeltaCount: 0,
      illegalSemanticDecisionCount: 0,
      hiddenInfoViolationCount: 0,
      engineRejectCount: 0,
    });
    expect(report.productiveUseAllowed).toBe(false);
    expect(report.semanticExecutionAllowed).toBe(false);
    expect(report.runtimeConsumerStatus).toBe("none");
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
