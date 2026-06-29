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
  META5_ALLOWED_OVERRIDE_SCOPES,
  META5_BLOCKED_OVERRIDE_SCOPES,
  META5_DIVERGENCE_TRIAGE_CATEGORIES,
  META5_OVERRIDE_FIXTURES,
  META6_EXPANSION_PLAN,
  META6_LEGACY_FREEZE_CRITERIA,
  META6_SCOPE_READINESS_MATRIX,
  META6_TRACE_SCRUBBER_FORBIDDEN_SIGNALS,
  type StrategyHypothesis,
  adaptSemanticDecisionToLegacyActual,
  buildDeckDoctrineFromProfile,
  buildDeckStrategicProfile,
  buildMeta1DeckDoctrineTacticalGoalEngineReport,
  buildMeta2SemanticDecisionCoreReport,
  buildMeta3CutoverSafetyEnvelopeReport,
  buildMeta4AgreementOnlyRuntimeCanaryReport,
  buildMeta5ScopedSemanticOverridePilotReport,
  buildMeta6SemanticAiStabilizationLegacyFreezePrepReport,
  buildSemanticDecisionScore,
  evaluateScopedOverridePilotFixture,
  runAgreementOnlyCanary,
  scrubTraceForProduction,
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

  it("maps strategy ids to goal families by bounded terms", () => {
    const runnerHqDoctrine = buildDeckDoctrineFromProfile(
      buildDeckStrategicProfile({
        profileId: "test-runner-hq",
        side: "runner",
        primaryStrategies: [
          strategy("runner.hq_pressure"),
        ],
      }),
    );
    const runnerNoiseDoctrine = buildDeckDoctrineFromProfile(
      buildDeckStrategicProfile({
        profileId: "test-runner-hq-noise",
        side: "runner",
        primaryStrategies: [
          strategy("runner.hqish_noise"),
        ],
      }),
    );
    const corpRemoteDoctrine = buildDeckDoctrineFromProfile(
      buildDeckStrategicProfile({
        profileId: "test-corp-remote",
        side: "corp",
        primaryStrategies: [
          strategy("corp.remote_scoring"),
        ],
      }),
    );
    const corpNoiseDoctrine = buildDeckDoctrineFromProfile(
      buildDeckStrategicProfile({
        profileId: "test-corp-remote-noise",
        side: "corp",
        primaryStrategies: [
          strategy("corp.remoteish_noise"),
        ],
      }),
    );

    expect(runnerHqDoctrine.primaryPlan?.goalFamilies).toEqual([
      "runner_pressure_hq",
      "runner_access_payoff",
    ]);
    expect(runnerNoiseDoctrine.primaryPlan?.goalFamilies).toEqual([
      "runner_rig_setup",
      "runner_economy_stabilize",
    ]);
    expect(corpRemoteDoctrine.primaryPlan?.goalFamilies).toEqual([
      "corp_build_remote",
      "corp_create_score_window",
      "corp_score_agenda",
    ]);
    expect(corpNoiseDoctrine.primaryPlan?.goalFamilies).toEqual([
      "corp_economy_stabilize",
      "corp_defend_rnd",
    ]);
  });

  it("models multi-turn TacticalGoalState lifecycle, progress and blockers", () => {
    const report = buildMeta1DeckDoctrineTacticalGoalEngineReport();
    const goalState = (goalFamily: string) =>
      report.tacticalGoalStates.find(
        (entry) => entry.goalFamily === goalFamily,
      );

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
    expect(goalState("runner_economy_stabilize")?.supportedActionTypes).toEqual(
      ["gain_credit", "play_event", "play_operation"],
    );
    expect(goalState("runner_pressure_rnd")?.supportedActionTypes).toEqual([
      "start_run",
      "continue_run",
    ]);
    expect(goalState("runner_contest_remote")?.successCriteria).toEqual([
      "remote_threat_resolved_or_downgraded",
    ]);
    expect(
      goalState("corp_punish_tagged_runner")?.supportedActionTypes,
    ).toEqual(["remove_tag", "play_operation"]);
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

function strategy(strategyId: string): StrategyHypothesis {
  return {
    strategyId,
    role: "primary",
    confidence: "high",
    anchorCards: [],
    payoffCards: [],
    enablerCards: [],
    supportCards: [],
    evidenceSignals: [`strategy:${strategyId}`],
    missingRequirements: [],
  };
}

describe("META6 Stabilization + Limited Rollout / Legacy-Freeze Prep", () => {
  it("builds a scope readiness matrix with fallback and rollback for every scope", () => {
    const report = buildMeta6SemanticAiStabilizationLegacyFreezePrepReport();

    expect(report.schemaVersion).toBe(
      "meta6-semantic-ai-stabilization-legacy-freeze-prep-v0",
    );
    expect(report.step).toBe("META6");
    expect(report.scopeReadinessMatrix).toEqual(META6_SCOPE_READINESS_MATRIX);
    expect(report.scopeReadinessMatrix.length).toBeGreaterThanOrEqual(10);
    expect(
      report.scopeReadinessMatrix.every(
        (entry) => entry.fallbackAvailable && entry.rollbackAvailable,
      ),
    ).toBe(true);
    expect(report.scopeReadinessMatrix).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          scopeId: "basic_economy_draw",
          status: "limited_candidate",
        }),
        expect.objectContaining({
          scopeId: "trace_payment",
          status: "blocked",
        }),
      ]),
    );
  });

  it("scrubs production traces for hidden, wrong-side and private debug signals", () => {
    const unsafe = scrubTraceForProduction(
      "unsafe",
      "FullState exposes opponent hand, HQ detail, unrezzed ICE detail, facedown remote content, choice options and private debug data.",
    );
    const safe = scrubTraceForProduction(
      "safe",
      "candidateEvidence: gain_credit; goalMatches: basic_economy_draw",
    );
    const noisy = scrubTraceForProduction(
      "noisy",
      "FullStatement references opponent handler, HQ detailing and decisiondebugish notes.",
    );
    const exactTokens = scrubTraceForProduction(
      "exact-tokens",
      "gegnerhand fullstate decisiondebug",
    );

    expect(META6_TRACE_SCRUBBER_FORBIDDEN_SIGNALS).toEqual(
      expect.arrayContaining([
        "opponent_hand",
        "hq_or_rd_wrong_side_detail",
        "unrezzed_ice_detail_for_runner",
        "facedown_remote_content",
        "full_state_fragment",
        "choice_option_leak",
        "private_debug_data",
      ]),
    );
    expect(unsafe.safe).toBe(false);
    expect(unsafe.violations).toEqual(
      expect.arrayContaining([...META6_TRACE_SCRUBBER_FORBIDDEN_SIGNALS]),
    );
    expect(unsafe.redactedText).toContain("[redacted:full_state_fragment]");
    expect(safe.safe).toBe(true);
    expect(safe.violations).toEqual([]);
    expect(noisy.safe).toBe(true);
    expect(noisy.violations).toEqual([]);
    expect(exactTokens.safe).toBe(false);
    expect(exactTokens.violations).toEqual(
      expect.arrayContaining([
        "opponent_hand",
        "full_state_fragment",
        "private_debug_data",
      ]),
    );
  });

  it("keeps legacy freeze criteria strict and does not allow legacy removal", () => {
    const report = buildMeta6SemanticAiStabilizationLegacyFreezePrepReport();

    expect(report.legacyFreezeCriteria).toEqual(META6_LEGACY_FREEZE_CRITERIA);
    expect(report.legacyFreezeCriteria).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ criterionId: "human_review_complete", status: "blocked" }),
        expect.objectContaining({ criterionId: "multi_run_metrics_stable", status: "blocked" }),
      ]),
    );
    expect(report.goNoGo).toEqual({
      decision: "limited_rollout_candidate_for_selected_scopes",
      fullProductionReady: false,
      legacyRemovalReady: false,
      legacyFallbackAvailable: true,
      rollbackAvailable: true,
    });
  });

  it("defines the expansion plan while keeping full production and legacy removal false", () => {
    const report = buildMeta6SemanticAiStabilizationLegacyFreezePrepReport();

    expect(report.expansionPlan).toEqual(META6_EXPANSION_PLAN);
    expect(report.expansionPlan.map((step) => step.scopeId)).toEqual([
      "basic_economy_draw",
      "basic_install",
      "tag_removal",
      "simple_score_advance",
      "simple_run_choice",
      "simple_rez",
      "remote_contest",
      "access_trash_steal",
      "trace_payment",
      "damage_prevention",
      "multi_target_multi_ability",
    ]);
    expect(report.qualityGates).toEqual({
      scopeReadinessMatrixExists: true,
      traceScrubberPasses: true,
      legacyFallbackAvailable: true,
      rollbackAvailable: true,
      hardGateFailureCount: 0,
      unsafeDivergenceCount: 0,
      fullProductionReady: false,
      legacyRemovalReady: false,
    });
    expect(report.productiveUseAllowed).toBe(false);
    expect(report.semanticExecutionAllowed).toBe(false);
  });
});

describe("META5 Scoped Semantic Override Pilot", () => {
  it("defines a narrow test/internal whitelist and blocked scope list", () => {
    const report = buildMeta5ScopedSemanticOverridePilotReport();

    expect(report.schemaVersion).toBe(
      "meta5-scoped-semantic-override-pilot-v0",
    );
    expect(report.step).toBe("META5");
    expect(report.allowedScopes).toEqual(META5_ALLOWED_OVERRIDE_SCOPES);
    expect(report.blockedScopes).toEqual(META5_BLOCKED_OVERRIDE_SCOPES);
    expect(META5_ALLOWED_OVERRIDE_SCOPES).toEqual([
      "runner_basic_economy_vs_draw",
      "corp_basic_economy",
      "runner_remove_tag_when_tagged",
      "corp_score_agenda_when_engine_legal_and_clear",
      "simple_hq_or_rnd_run_when_goal_evidence_ready",
    ]);
    expect(META5_BLOCKED_OVERRIDE_SCOPES).toEqual(
      expect.arrayContaining([
        "hidden_info_access_choices",
        "trace_boost_or_payment",
        "x_value_decisions",
        "multi_target_unresolved",
        "multi_ability_unresolved",
      ]),
    );
  });

  it("allows overrides only when every override gate passes in whitelisted fixtures", () => {
    const report = buildMeta5ScopedSemanticOverridePilotReport();
    const allowed = report.fixtureResults.filter((result) => result.overrideAllowed);

    expect(META5_OVERRIDE_FIXTURES).toHaveLength(8);
    expect(allowed).toHaveLength(5);
    expect(allowed.map((result) => result.scope)).toEqual(
      expect.arrayContaining([...META5_ALLOWED_OVERRIDE_SCOPES]),
    );
    expect(
      allowed.every(
        (result) => result.testInternalActualActionId === result.semanticActionId,
      ),
    ).toBe(true);
  });

  it("blocks forbidden scopes, hidden info, trace payment and unresolved ability cases", () => {
    const hidden = evaluateScopedOverridePilotFixture(
      META5_OVERRIDE_FIXTURES.find(
        (fixture) => fixture.fixtureId === "meta5-hidden-access-choice-blocked",
      )!,
    );
    const trace = evaluateScopedOverridePilotFixture(
      META5_OVERRIDE_FIXTURES.find(
        (fixture) => fixture.fixtureId === "meta5-trace-payment-blocked",
      )!,
    );
    const multiAbility = evaluateScopedOverridePilotFixture(
      META5_OVERRIDE_FIXTURES.find(
        (fixture) => fixture.fixtureId === "meta5-multi-ability-blocked",
      )!,
    );

    expect(hidden.overrideAllowed).toBe(false);
    expect(hidden.blockReasons).toEqual(
      expect.arrayContaining([
        "Scope is blocked or not whitelisted: hidden_info_access_choices",
        "Hidden-info gate blocked.",
      ]),
    );
    expect(trace.overrideAllowed).toBe(false);
    expect(trace.blockReasons).toEqual(
      expect.arrayContaining([
        "Scope is blocked or not whitelisted: trace_boost_or_payment",
        "Cost or timing evidence is insufficient.",
      ]),
    );
    expect(multiAbility.overrideAllowed).toBe(false);
    expect(multiAbility.blockReasons).toEqual(
      expect.arrayContaining([
        "Scope is blocked or not whitelisted: multi_ability_unresolved",
        "Ability is unresolved.",
      ]),
    );
  });

  it("triages every divergence and keeps production and safety counters closed", () => {
    const report = buildMeta5ScopedSemanticOverridePilotReport();

    expect(report.divergenceTriageCategories).toEqual(
      META5_DIVERGENCE_TRIAGE_CATEGORIES,
    );
    expect(report.summary).toEqual({
      fixtureCount: 8,
      overrideAllowedCount: 5,
      blockedFixtureCount: 3,
      allDivergencesTriaged: true,
    });
    expect(report.qualityGates).toEqual({
      overrideAllowedCount: 5,
      unsafeDivergenceCount: 0,
      illegalSemanticDecisionCount: 0,
      hiddenInfoViolationCount: 0,
      engineRejectCount: 0,
      rollbackTested: true,
      allDivergencesTriaged: true,
      productionFlagEnabledCount: 0,
    });
    expect(report.productiveUseAllowed).toBe(false);
    expect(report.semanticExecutionAllowed).toBe(false);
    expect(report.runtimeConsumerStatus).toBe("test_internal_only");
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
