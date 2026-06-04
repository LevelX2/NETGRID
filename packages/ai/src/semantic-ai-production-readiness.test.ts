import { describe, expect, it } from "vitest";

import {
  META7_EXCLUDED_SCOPES,
  META7_MULTI_RUN_SETS,
  META8_DEFAULT_CONFIG,
  META8_INTERNAL_CANARY_CONFIG,
  META8_INTERNAL_CANARY_FIXTURES,
  META9_PRODUCTION_SAFE_SHADOW_CONFIG,
  META10_SELECTED_PRODUCTION_SCOPES,
  buildMeta15ComplexScopeEnablementReport,
  buildMeta14LowRiskScopeExpansionReport,
  buildMeta13LegacyFreezeExtendedMonitoringReport,
  buildMeta12LegacyFreezeProductionStabilizationReport,
  buildMeta11ScopeExpansionCalibrationReport,
  buildMeta10LimitedScopedProductionCutoverReport,
  buildMeta9ProductionSafeShadowAgreementCanaryReport,
  buildMeta8InternalSemanticCanaryReport,
  buildMeta7MultiRunSemanticEvaluationHumanReviewReport,
  buildMeta7ScopeReadinessPromotions,
  evaluateMeta10CutoverFixture,
  evaluateMeta9AgreementShadowFixture,
  evaluateMeta9TraceScrubFixture,
  evaluateMeta8InternalCanaryFixture,
  promoteMeta7ScopeStatus,
} from "./semantic-ai-production-readiness";

describe("META7 Multi-Run Evaluation + Human Review Closure", () => {
  it("builds a multi-run corpus above the required decision-point threshold", () => {
    const report = buildMeta7MultiRunSemanticEvaluationHumanReviewReport();

    expect(report.schemaVersion).toBe(
      "meta7-multi-run-semantic-evaluation-human-review-v0",
    );
    expect(report.step).toBe("META7");
    expect(report.multiRunCorpus.runSetCount).toBe(4);
    expect(report.multiRunCorpus.decisionPointCount).toBe(250);
    expect(report.multiRunCorpus.preferredDecisionPointTargetMet).toBe(true);
    expect(report.multiRunCorpus.runnerDecisionPointCount).toBeGreaterThan(100);
    expect(report.multiRunCorpus.corpDecisionPointCount).toBeGreaterThan(100);
    expect(META7_MULTI_RUN_SETS.every((runSet) => runSet.seed)).toBe(true);
    expect(
      report.multiRunCorpus.runSets.flatMap(
        (runSet) => runSet.representativeDecisionPoints,
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          scenarioId: "meta7-basic-economy-draw-runner",
          actualDecision: {
            source: "legacy",
            actionId: "legal.gain_credit.1",
          },
        }),
        expect.objectContaining({
          scenarioId: "meta7-simple-score-advance-corp",
          traceRef: "meta7-dp-corp-score-001.trace.json",
        }),
      ]),
    );
  });

  it("keeps all META7 hard gates green and actual decisions legacy-only", () => {
    const report = buildMeta7MultiRunSemanticEvaluationHumanReviewReport();

    expect(report.qualityGates).toMatchObject({
      illegalSemanticDecisionCount: 0,
      hiddenInfoViolationCount: 0,
      engineRejectCount: 0,
      nonEngineLegalAssumptionCount: 0,
      determinismFailureCount: 0,
      publicPayloadDeltaCount: 0,
      unsafeDivergenceCount: 0,
      knownBadDecisionCount: 0,
      traceCompleteRate: 1,
      openHumanReviewItems: 0,
      goalWrongAbandonRate: 0,
    });
    expect(report.qualityGates.semanticDecisionAvailableRate).toBeGreaterThanOrEqual(
      0.85,
    );
    expect(report.qualityGates.semanticBlockedByGapRate).toBeLessThanOrEqual(0.05);
    expect(report.productiveUseAllowed).toBe(false);
    expect(report.semanticExecutionAllowed).toBe(false);
    expect(report.actualDecisionContract).toBe("legacy_only_during_meta7");
  });

  it("closes human review for evaluated scopes without allowing unsafe divergence", () => {
    const report = buildMeta7MultiRunSemanticEvaluationHumanReviewReport();

    expect(report.humanReviewClosure.openHumanReviewItems).toBe(0);
    expect(report.divergenceReview.summaries).toEqual(
      expect.arrayContaining([
        { category: "unsafe_divergence", count: 0 },
        { category: "semantic_better", count: 24 },
        { category: "acceptable_difference", count: 70 },
      ]),
    );
    expect(report.humanReviewClosure.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          scopeId: "remote_contest",
          status: "followup_created",
          removalCondition:
            "Calibrate remote contest target scoring before production cutover.",
        }),
      ]),
    );
    expect(
      report.humanReviewClosure.items.every((item) =>
        report.humanReviewClosure.allowedTerminalStatuses.includes(item.status),
      ),
    ).toBe(true);
  });

  it("promotes only allowed readiness statuses and keeps blocked scopes blocked", () => {
    const promotions = buildMeta7ScopeReadinessPromotions();

    expect(promoteMeta7ScopeStatus("limited_candidate")).toBe(
      "internal_canary_ready",
    );
    expect(promoteMeta7ScopeStatus("agreement_ready")).toBe("limited_candidate");
    expect(promoteMeta7ScopeStatus("shadow_ready")).toBe("agreement_ready");
    expect(promoteMeta7ScopeStatus("blocked")).toBe("blocked");
    expect(promotions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          scopeId: "basic_economy_draw",
          inputStatus: "limited_candidate",
          outputStatus: "internal_canary_ready",
          promoted: true,
        }),
        expect.objectContaining({
          scopeId: "basic_install",
          inputStatus: "agreement_ready",
          outputStatus: "limited_candidate",
          promoted: true,
        }),
        expect.objectContaining({
          scopeId: "remote_contest",
          inputStatus: "shadow_ready",
          outputStatus: "agreement_ready",
          promoted: true,
        }),
      ]),
    );
    for (const scopeId of META7_EXCLUDED_SCOPES) {
      expect(promotions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            scopeId,
            inputStatus: "blocked",
            outputStatus: "blocked",
            promoted: false,
          }),
        ]),
      );
    }
  });

  it("reports META7 as internal canary ready, not production ready", () => {
    const report = buildMeta7MultiRunSemanticEvaluationHumanReviewReport();

    expect(report.goNoGo).toEqual({
      decision: "internal_canary_ready_for_selected_scopes",
      productionReady: false,
      legacyRemovalReady: false,
      nextStep: "META8_internal_semantic_canary",
    });
    expect(report.noRuntimeEffect).toBe(true);
  });
});

describe("META12 Legacy Freeze + Production Stabilization", () => {
  it("marks selected production scopes as freeze-ready while keeping fallback", () => {
    const report = buildMeta12LegacyFreezeProductionStabilizationReport();

    expect(report.schemaVersion).toBe(
      "meta12-legacy-freeze-production-stabilization-v0",
    );
    expect(report.step).toBe("META12");
    expect(report.stabilizedProductionScopes).toEqual([
      "basic_economy_draw",
      "tag_removal",
      "simple_score_advance",
      "basic_install",
    ]);
    expect(report.freezeDecisions).toHaveLength(4);
    expect(
      report.freezeDecisions.every(
        (entry) =>
          entry.productionStable &&
          entry.legacyFreezeDecision === "freeze_ready" &&
          entry.legacyFallbackAvailable &&
          entry.rollbackAvailable,
      ),
    ).toBe(true);
  });

  it("reports a green stability dashboard for selected scopes", () => {
    const report = buildMeta12LegacyFreezeProductionStabilizationReport();

    expect(report.stabilityDashboard).toEqual({
      productionDecisionCount: 360,
      semanticDecisionShare: 0.72,
      legacyFallbackShare: 0.28,
      rollbackCount: 8,
      engineRejectCount: 0,
      hiddenInfoViolationCount: 0,
      unsafeDivergenceCount: 0,
      decisionLatencyP95Ms: 9.8,
      traceScrubPassRate: 1,
      scopeRegressionStatus: "green",
    });
  });

  it("keeps expansion policy explicit for productive, follow-up and blocked scopes", () => {
    const report = buildMeta12LegacyFreezeProductionStabilizationReport();

    expect(report.expansionPolicy).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          scopeId: "basic_economy_draw",
          policy: "freeze_legacy_for_scope",
        }),
        expect.objectContaining({
          scopeId: "simple_rez",
          policy: "semantic_followup_required",
        }),
        expect.objectContaining({
          scopeId: "trace_payment",
          policy: "remain_blocked",
        }),
      ]),
    );
    expect(report.laterLegacyRetirementConditions.map((entry) => entry.status)).toEqual(
      [
        "future_required",
        "future_required",
        "future_required",
        "future_required",
        "future_required",
      ],
    );
  });

  it("allows legacy freeze but not full production or legacy removal", () => {
    const report = buildMeta12LegacyFreezeProductionStabilizationReport();

    expect(report.qualityGates).toEqual({
      legacyFreezeAllowedForSelectedScopes: true,
      legacyFallbackAvailable: true,
      rollbackAvailable: true,
      hiddenInfoViolationCount: 0,
      illegalSemanticDecisionCount: 0,
      engineRejectCount: 0,
      unsafeDivergenceCount: 0,
      traceScrubberPasses: true,
      multiRunMetricsStable: true,
      fullProductionReady: false,
      legacyRemovalReady: false,
    });
    expect(report.goNoGo).toEqual({
      decision: "legacy_freeze_for_selected_scopes_ready",
      legacyRemoved: false,
      fullReplacementWithoutFallback: false,
      laterRetirementOnly: true,
    });
    expect(report.legacyFreezeScope).toBe("selected_scopes_only");
    expect(report.legacyRemovalReady).toBe(false);
    expect(report.fullProductionReady).toBe(false);
  });
});

describe("META13 Legacy-Freeze-Aktivierung + Extended Monitoring", () => {
  it("activates legacy freeze for exactly the stabilized META12 scopes", () => {
    const report = buildMeta13LegacyFreezeExtendedMonitoringReport();

    expect(report.schemaVersion).toBe(
      "meta13-legacy-freeze-extended-monitoring-v0",
    );
    expect(report.step).toBe("META13");
    expect(report.legacyFreezeActiveForScopes).toEqual([
      "basic_economy_draw",
      "tag_removal",
      "simple_score_advance",
      "basic_install",
    ]);
    expect(report.freezeStatus).toEqual({
      legacyFallbackAvailable: true,
      rollbackAvailable: true,
      legacyRemovalReady: false,
      freezeMeansLegacyDevelopmentStopped: true,
      freezeMeansLegacyCodeRemoved: false,
    });
  });

  it("extends monitoring while keeping hard gates green", () => {
    const report = buildMeta13LegacyFreezeExtendedMonitoringReport();

    expect(report.extendedMonitoring).toMatchObject({
      minimumObservationCycles: 6,
      observedObservationCycles: 6,
      minimumProductionDecisionCount: 500,
      observedProductionDecisionCount: 640,
      rollbackCount: 9,
      traceScrubPassRate: 1,
    });
    expect(report.extendedMonitoring.semanticDecisionShare).toBeGreaterThan(0.7);
    expect(report.extendedMonitoring.legacyFallbackShare).toBeGreaterThan(0);
    expect(report.qualityGates).toEqual({
      engineRejectCount: 0,
      hiddenInfoViolationCount: 0,
      unsafeDivergenceCount: 0,
      publicPayloadDeltaCount: 0,
      rollbackFailureCount: 0,
      traceScrubPassRate: 1,
      legacyFallbackAvailable: true,
      rollbackAvailable: true,
      legacyRemovalReady: false,
    });
  });

  it("covers freeze regression guards without allowing legacy removal", () => {
    const report = buildMeta13LegacyFreezeExtendedMonitoringReport();

    expect(report.regressionSuite.map((guard) => guard.guardId)).toEqual([
      "legacy_fallback_still_available",
      "rollback_forces_legacy",
      "semantic_action_engine_legal",
      "public_payload_delta_zero",
      "hidden_info_leak_zero",
      "trace_scrubber_passes",
      "freeze_does_not_remove_legacy",
    ]);
    expect(report.regressionSuite.every((guard) => guard.status === "passed")).toBe(
      true,
    );
    expect(report.goNoGo).toEqual({
      decision: "legacy_freeze_active_for_selected_scopes",
      nextStep: "META14_low_risk_scope_expansion",
      fullProductionReady: false,
      legacyRemovalReady: false,
    });
    expect(report.legacyFallbackAvailable).toBe(true);
    expect(report.rollbackAvailable).toBe(true);
    expect(report.legacyRemovalReady).toBe(false);
  });
});

describe("META14 Low-Risk Scope Expansion", () => {
  it("activates simple_rez as the only new production scope", () => {
    const report = buildMeta14LowRiskScopeExpansionReport();

    expect(report.schemaVersion).toBe("meta14-low-risk-scope-expansion-v0");
    expect(report.step).toBe("META14");
    expect(report.activeProductionScopesBefore).toEqual([
      "basic_economy_draw",
      "tag_removal",
      "simple_score_advance",
      "basic_install",
    ]);
    expect(report.activeProductionScopesAfter).toEqual([
      "basic_economy_draw",
      "tag_removal",
      "simple_score_advance",
      "basic_install",
      "simple_rez",
    ]);
    expect(report.newScopeActivated).toBe("simple_rez");
    expect(
      report.dossiers.filter((dossier) => dossier.productiveActivation),
    ).toHaveLength(1);
  });

  it("keeps simple_run_choice and remote_contest out of production", () => {
    const report = buildMeta14LowRiskScopeExpansionReport();

    expect(report.dossiers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          scopeId: "simple_run_choice",
          outputStatus: "limited_candidate",
          productiveActivation: false,
          releaseDecision: "candidate_not_activated",
        }),
        expect.objectContaining({
          scopeId: "remote_contest",
          outputStatus: "agreement_ready",
          productiveActivation: false,
          releaseDecision: "calibrated_not_productive",
          hiddenInfoPolicy: "side_safe_public_context_only",
        }),
      ]),
    );
    expect(report.calibrationResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          findingId: "remote_target_scoring_calibration",
          status: "calibrated",
        }),
      ]),
    );
  });

  it("reports low-risk expansion gates without bulk activation", () => {
    const report = buildMeta14LowRiskScopeExpansionReport();

    expect(report.qualityGates).toEqual({
      oneNewScopeActivatedAtMost: true,
      bulkActivationCount: 0,
      humanReviewOpenCount: 0,
      unsafeDivergenceCount: 0,
      engineRejectCount: 0,
      hiddenInfoViolationCount: 0,
      knownBadDecisionCount: 0,
      multiRunMetricsStable: true,
      rollbackTested: true,
    });
    expect(report.goNoGo).toEqual({
      decision: "simple_rez_limited_scoped_production_active",
      simpleRunChoiceDecision: "limited_candidate_not_activated",
      remoteContestDecision: "agreement_ready_not_productive",
      nextStep: "META15_complex_scope_enablement",
      fullProductionReady: false,
      legacyRemovalReady: false,
    });
    expect(report.legacyFallbackAvailable).toBe(true);
    expect(report.rollbackAvailable).toBe(true);
  });
});

describe("META15 Complex Scope Enablement", () => {
  it("classifies complex scopes without productive activation", () => {
    const report = buildMeta15ComplexScopeEnablementReport();

    expect(report.schemaVersion).toBe("meta15-complex-scope-enablement-v0");
    expect(report.step).toBe("META15");
    expect(report.evaluatedScopes).toEqual([
      "access_trash_steal",
      "trace_payment",
      "damage_prevention",
      "multi_target_multi_ability",
    ]);
    expect(report.productiveActivationCount).toBe(0);
    expect(
      report.dossiers.every(
        (dossier) => dossier.productiveActivationAllowed === false,
      ),
    ).toBe(true);
  });

  it("keeps multi_target_multi_ability blocked with explicit requirements", () => {
    const report = buildMeta15ComplexScopeEnablementReport();

    expect(report.dossiers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          scopeId: "access_trash_steal",
          outputStatus: "agreement_ready",
        }),
        expect.objectContaining({
          scopeId: "trace_payment",
          outputStatus: "shadow_ready",
        }),
        expect.objectContaining({
          scopeId: "damage_prevention",
          outputStatus: "shadow_ready",
        }),
        expect.objectContaining({
          scopeId: "multi_target_multi_ability",
          outputStatus: "still_blocked_with_requirements",
          blockedReasons: ["multi_ability_card_unresolved"],
        }),
      ]),
    );
    const multi = report.dossiers.find(
      (dossier) => dossier.scopeId === "multi_target_multi_ability",
    );
    expect(multi?.requiredContext).toEqual(
      expect.arrayContaining([
        "explicitAbilityId",
        "engineProvidedTargetOptions",
        "targetPriorityModel",
      ]),
    );
  });

  it("reports complex-scope gates as shadow/agreement ready or safely blocked", () => {
    const report = buildMeta15ComplexScopeEnablementReport();

    expect(report.qualityGates).toEqual({
      noHiddenInfoViolation: true,
      noIllegalAction: true,
      targetContextCompleteForEvaluatedCases: true,
      abilityResolvedForMultiAbilityCases: true,
      costTimingKnownWhenRequired: true,
      unsafeDivergenceCount: 0,
      blockedCasesRemainBlocked: true,
    });
    expect(report.goNoGo).toEqual({
      decision: "complex_scopes_shadow_or_blocked",
      accessTrashStealStatus: "agreement_ready",
      tracePaymentStatus: "shadow_ready",
      damagePreventionStatus: "shadow_ready",
      multiTargetMultiAbilityStatus: "still_blocked_with_requirements",
      nextStep: "META16_broad_scoped_production_expansion",
      fullProductionReady: false,
      legacyRemovalReady: false,
    });
    expect(report.legacyFallbackAvailable).toBe(true);
    expect(report.rollbackAvailable).toBe(true);
  });
});

describe("META11 Scope Expansion + Calibration", () => {
  it("promotes exactly one new scope after META10", () => {
    const report = buildMeta11ScopeExpansionCalibrationReport();

    expect(report.schemaVersion).toBe("meta11-scope-expansion-calibration-v0");
    expect(report.step).toBe("META11");
    expect(report.activeProductionScopesBefore).toEqual([
      "basic_economy_draw",
      "tag_removal",
      "simple_score_advance",
    ]);
    expect(report.activeProductionScopesAfter).toEqual([
      "basic_economy_draw",
      "tag_removal",
      "simple_score_advance",
      "basic_install",
    ]);
    expect(report.newScopeActivated).toBe("basic_install");
    expect(report.qualityGates.oneNewScopeActivated).toBe(true);
    expect(report.qualityGates.bulkActivationCount).toBe(0);
  });

  it("keeps simple_rez and remote_contest out of the same activation iteration", () => {
    const report = buildMeta11ScopeExpansionCalibrationReport();

    expect(report.scopeDossiers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          scopeId: "basic_install",
          releaseDecision: "promote_one_scope",
          targetStatus: "limited_scoped_production_active",
        }),
        expect.objectContaining({
          scopeId: "simple_rez",
          releaseDecision: "ready_but_not_activated",
          targetStatus: "production_shadow_stable",
        }),
        expect.objectContaining({
          scopeId: "remote_contest",
          releaseDecision: "blocked_by_calibration",
          blockedReasons: ["remote_target_scoring_calibration_open"],
        }),
      ]),
    );
  });

  it("records calibration findings and covers required regression guards", () => {
    const report = buildMeta11ScopeExpansionCalibrationReport();

    expect(report.calibrationFindings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          scopeId: "basic_install",
          category: "bad_goal_priority",
          count: 0,
          status: "clear",
        }),
        expect.objectContaining({
          scopeId: "remote_contest",
          category: "bad_target_choice",
          count: 2,
          status: "blocked",
        }),
      ]),
    );
    expect(report.regressionSuite.map((guard) => guard.guardId)).toEqual([
      "hidden_info_guard",
      "illegal_action_guard",
      "rollback_guard",
      "engine_reject_guard",
      "agreement_only_guard",
      "scoped_override_guard",
      "legacy_fallback_guard",
      "trace_scrubber_guard",
      "determinism_guard",
      "goal_persistence_guard",
    ]);
    expect(report.regressionSuite.every((guard) => guard.status === "covered")).toBe(
      true,
    );
  });

  it("reports one-scope promotion without full production or legacy removal", () => {
    const report = buildMeta11ScopeExpansionCalibrationReport();

    expect(report.qualityGates).toMatchObject({
      hardGateFailures: 0,
      unsafeDivergenceCount: 0,
      knownBadDecisionCount: 0,
      humanReviewOpenCount: 0,
      traceCompleteRate: 1,
      rollbackTested: true,
      semanticDecisionAvailableRate: 0.92,
      blockedByGapRate: 0.02,
      multiRunMetricsStable: true,
    });
    expect(report.goNoGo).toEqual({
      decision: "one_scope_promoted",
      bulkActivationAllowed: false,
      fullProductionReady: false,
      legacyRemovalReady: false,
      nextStep: "META12_legacy_freeze_production_stabilization",
    });
    expect(report.productiveUse).toBe("selected_scopes_plus_basic_install");
    expect(report.legacyFallbackAvailable).toBe(true);
    expect(report.rollbackAvailable).toBe(true);
  });
});

describe("META10 Limited Scoped Production Cutover", () => {
  it("freezes only selected low-risk scopes for limited production", () => {
    const report = buildMeta10LimitedScopedProductionCutoverReport();

    expect(report.schemaVersion).toBe(
      "meta10-limited-scoped-production-cutover-v0",
    );
    expect(report.step).toBe("META10");
    expect(report.selectedProductionScopes).toEqual(META10_SELECTED_PRODUCTION_SCOPES);
    expect(report.selectedProductionScopes).toEqual([
      "basic_economy_draw",
      "tag_removal",
      "simple_score_advance",
    ]);
    expect(report.scopeFreezeDossiers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          scopeId: "simple_run_choice",
          selectedForCutover: false,
          humanReviewStatus: "reviewed_legacy_preferred",
        }),
        expect.objectContaining({
          scopeId: "remote_contest",
          selectedForCutover: false,
          humanReviewStatus: "followup_created",
        }),
      ]),
    );
  });

  it("allows semantic actual decisions only for selected scopes", () => {
    const report = buildMeta10LimitedScopedProductionCutoverReport();
    const semanticActual = report.cutoverResults.filter(
      (entry) => entry.actualDecisionSource === "semantic",
    );

    expect(semanticActual).toHaveLength(3);
    expect(semanticActual.map((entry) => entry.scopeId)).toEqual([
      "basic_economy_draw",
      "tag_removal",
      "simple_score_advance",
    ]);
    expect(
      semanticActual.every(
        (entry) => entry.result === "semantic_limited_production_actual",
      ),
    ).toBe(true);
  });

  it("rolls back to legacy for disabled scopes and hard gate violations", () => {
    const report = buildMeta10LimitedScopedProductionCutoverReport();

    expect(report.cutoverResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fixtureId: "meta10-run-choice-not-enabled",
          actualDecisionSource: "legacy",
          result: "scope_disabled_legacy",
          rollbackTriggered: false,
        }),
        expect.objectContaining({
          fixtureId: "meta10-hidden-info-rollback",
          actualDecisionSource: "legacy",
          result: "hidden_info_blocked_legacy",
          rollbackTriggered: true,
        }),
        expect.objectContaining({
          fixtureId: "meta10-public-payload-delta-rollback",
          actualDecisionSource: "legacy",
          result: "public_payload_delta_guard_legacy",
          rollbackTriggered: true,
        }),
      ]),
    );
    expect(
      report.cutoverResults.every((entry) => entry.killSwitchAvailable),
    ).toBe(true);
  });

  it("evaluates custom cutover fixtures with semantic and legacy outcomes", () => {
    const semantic = evaluateMeta10CutoverFixture({
      fixtureId: "semantic",
      scopeId: "basic_economy_draw",
      legalActionIds: ["legacy", "semantic"],
      legacyActionId: "legacy",
      semanticActionId: "semantic",
      scopeEnabled: true,
      hardGatesPass: true,
      traceValidOrDroppable: true,
      rollbackForced: false,
      hiddenInfoBlocked: false,
      engineRejectSimulated: false,
      publicPayloadDeltaSimulated: false,
    });
    const legacy = evaluateMeta10CutoverFixture({
      fixtureId: "legacy",
      scopeId: "basic_economy_draw",
      legalActionIds: ["legacy"],
      legacyActionId: "legacy",
      semanticActionId: "created",
      scopeEnabled: true,
      hardGatesPass: true,
      traceValidOrDroppable: true,
      rollbackForced: false,
      hiddenInfoBlocked: false,
      engineRejectSimulated: false,
      publicPayloadDeltaSimulated: false,
    });

    expect(semantic).toMatchObject({
      actualDecisionSource: "semantic",
      result: "semantic_limited_production_actual",
      rollbackTriggered: false,
    });
    expect(legacy).toMatchObject({
      actualDecisionSource: "legacy",
      result: "semantic_not_legal_legacy",
      rollbackTriggered: true,
    });
  });

  it("reports active limited scoped production without full production or legacy removal", () => {
    const report = buildMeta10LimitedScopedProductionCutoverReport();

    expect(report.preActivationQualityGates).toMatchObject({
      meta7Green: true,
      meta8InternalCanaryStable: true,
      meta9ProductionShadowStable: true,
      openHumanReviewItems: 0,
      rollbackTested: true,
      traceScrubberPasses: true,
      scopeFreezeComplete: true,
    });
    expect(report.postActivationQualityGates).toEqual({
      engineRejectCount: 0,
      hiddenInfoViolationCount: 0,
      illegalSemanticDecisionCount: 0,
      publicPayloadDeltaCount: 0,
      rollbackFailureCount: 0,
      determinismFailureCount: 0,
      unsafeDivergenceCount: 0,
    });
    expect(report.monitoring).toMatchObject({
      semanticDecisionCount: 9,
      semanticOverrideCount: 3,
      legacyFallbackCount: 6,
      rollbackCount: 5,
      engineRejectCount: 0,
      publicPayloadDeltaCount: 0,
    });
    expect(report.goNoGo).toEqual({
      decision: "limited_scoped_production_active_with_rollback_constraints",
      fullProductionReady: false,
      legacyRemovalReady: false,
      broadCutoverAllowed: false,
      nextStep: "META11_scope_expansion_calibration",
    });
    expect(report.limitedScopedProductionActive).toBe(true);
    expect(report.productiveUse).toBe("selected_scopes_only");
    expect(report.legacyFallbackAvailable).toBe(true);
  });
});

describe("META9 Production-Safe Shadow / Agreement Canary", () => {
  it("uses production-safe shadow config without scoped override or cutover", () => {
    const report = buildMeta9ProductionSafeShadowAgreementCanaryReport();

    expect(report.schemaVersion).toBe(
      "meta9-production-safe-shadow-agreement-canary-v0",
    );
    expect(report.step).toBe("META9");
    expect(report.shadowConfig).toEqual(META9_PRODUCTION_SAFE_SHADOW_CONFIG);
    expect(report.shadowConfig).toMatchObject({
      semanticAiShadowModeEnabled: true,
      semanticAiCutoverEnabled: false,
      semanticAiAgreementOnlyMode: true,
      semanticAiScopedOverrideEnabled: false,
      semanticAiRollbackForceLegacy: true,
      semanticAiTraceMode: "production_safe_shadow",
      semanticAiTraceVisibility: "developer_only_scrubbed",
    });
  });

  it("scrubs or safely drops hidden-info and private debug traces", () => {
    const unsafe = evaluateMeta9TraceScrubFixture({
      fixtureId: "unsafe",
      inputText: "FullState exposes opponent hand, HQ detail and private debug data.",
      expectedSafe: false,
      expectedSafelyDropped: true,
    });
    const safe = evaluateMeta9TraceScrubFixture({
      fixtureId: "safe",
      inputText: "candidateEvidence: gain_credit; goalMatches: basic_economy_draw",
      expectedSafe: true,
      expectedSafelyDropped: false,
    });

    expect(unsafe.safe).toBe(false);
    expect(unsafe.safelyDropped).toBe(true);
    expect(unsafe.violations).toEqual(
      expect.arrayContaining([
        "opponent_hand",
        "hq_or_rd_wrong_side_detail",
        "full_state_fragment",
        "private_debug_data",
      ]),
    );
    expect(safe.safe).toBe(true);
    expect(safe.safelyDropped).toBe(false);
  });

  it("keeps actual decisions legacy for agreement, divergence and blocked shadow cases", () => {
    const report = buildMeta9ProductionSafeShadowAgreementCanaryReport();

    expect(report.agreementResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fixtureId: "meta9-basic-economy-agreement",
          agreement: true,
          actualDecisionSource: "legacy",
          result: "agreement_observed",
        }),
        expect.objectContaining({
          fixtureId: "meta9-score-differs-shadow-only",
          agreement: false,
          actualDecisionSource: "legacy",
          result: "semantic_differs_shadow_only",
        }),
        expect.objectContaining({
          fixtureId: "meta9-remote-contest-hard-gate-shadow-only",
          actualDecisionSource: "legacy",
          result: "hard_gate_blocked_shadow_only",
        }),
      ]),
    );
    expect(
      report.agreementResults.every(
        (entry) => entry.actualActionId === entry.legacyActionId,
      ),
    ).toBe(true);
  });

  it("evaluates a custom shadow fixture without behavior or public-payload delta", () => {
    const result = evaluateMeta9AgreementShadowFixture({
      fixtureId: "custom",
      scopeId: "basic_economy_draw",
      legalActionIds: ["legacy", "semantic"],
      legacyActionId: "legacy",
      semanticActionId: "semantic",
      hardGatesPass: true,
      traceSafeOrDropped: true,
    });

    expect(result).toMatchObject({
      actualActionId: "legacy",
      actualDecisionSource: "legacy",
      agreement: false,
      behaviorDelta: false,
      publicPayloadDelta: false,
      result: "semantic_differs_shadow_only",
    });
  });

  it("reports production shadow as stable without allowing broad cutover", () => {
    const report = buildMeta9ProductionSafeShadowAgreementCanaryReport();

    expect(report.publicPayloadChecks).toEqual(
      expect.arrayContaining([
        { surface: "PlayerView", status: "unchanged", publicPayloadDeltaCount: 0 },
        {
          surface: "WebSocket public payload",
          status: "unchanged",
          publicPayloadDeltaCount: 0,
        },
        { surface: "Logs", status: "scrubbed", publicPayloadDeltaCount: 0 },
      ]),
    );
    expect(report.qualityGates).toEqual({
      behaviorDeltaCount: 0,
      publicPayloadDeltaCount: 0,
      hiddenInfoViolationCount: 0,
      traceScrubViolationCount: 0,
      engineRejectCount: 0,
      rollbackFailureCount: 0,
      traceCompleteOrSafelyDroppedRate: 1,
      semanticScopedOverrideEnabled: false,
      actualDecisionAlwaysLegacy: true,
      runtimeOverheadBounded: true,
    });
    expect(report.goNoGo).toEqual({
      decision: "limited_cutover_candidate_for_selected_scopes",
      broadCutoverAllowed: false,
      legacyRemovalReady: false,
      nextStep: "META10_limited_scoped_production_cutover",
    });
    expect(report.productiveUseAllowed).toBe(false);
    expect(report.semanticExecutionAllowed).toBe(false);
    expect(report.noBehaviorDelta).toBe(true);
  });
});

describe("META8 Internal Semantic Canary", () => {
  it("keeps the default config legacy-only while defining an internal canary config", () => {
    const report = buildMeta8InternalSemanticCanaryReport();

    expect(report.schemaVersion).toBe("meta8-internal-semantic-canary-v0");
    expect(report.step).toBe("META8");
    expect(report.defaultConfig).toEqual(META8_DEFAULT_CONFIG);
    expect(report.defaultConfig).toMatchObject({
      semanticAiCutoverEnabled: false,
      semanticAiScopedOverrideEnabled: false,
      semanticAiRollbackForceLegacy: true,
      semanticAiCanaryScope: "disabled",
    });
    expect(report.internalCanaryConfig).toEqual(META8_INTERNAL_CANARY_CONFIG);
    expect(report.internalCanaryConfig).toMatchObject({
      semanticAiCutoverEnabled: true,
      semanticAiScopedOverrideEnabled: true,
      semanticAiRollbackForceLegacy: false,
      semanticAiCanaryScope: "internal",
    });
  });

  it("allows semantic actual decisions only for internal-canary-ready scopes", () => {
    const report = buildMeta8InternalSemanticCanaryReport();
    const semanticActual = report.fixtureResults.filter(
      (result) => result.actualDecisionSource === "semantic",
    );

    expect(semanticActual).toHaveLength(4);
    expect(semanticActual.map((result) => result.scopeId)).toEqual([
      "basic_economy_draw",
      "tag_removal",
      "simple_score_advance",
      "simple_run_choice",
    ]);
    expect(
      semanticActual.every(
        (result) => result.actualActionId === result.semanticActionId,
      ),
    ).toBe(true);
    expect(report.canaryScopes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          scopeId: "basic_install",
          status: "limited_candidate",
          enabled: false,
        }),
        expect.objectContaining({
          scopeId: "trace_payment",
          status: "blocked",
          enabled: false,
        }),
      ]),
    );
  });

  it("falls back to legacy for rollback, illegal, hidden-info, missing-trace and engine-reject cases", () => {
    const report = buildMeta8InternalSemanticCanaryReport();

    expect(META8_INTERNAL_CANARY_FIXTURES).toHaveLength(11);
    expect(report.fixtureResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fixtureId: "meta8-rollback-force-legacy",
          actualDecisionSource: "legacy",
          result: "rollback_forced",
          rollbackTriggers: ["unknown_hard_gate"],
        }),
        expect.objectContaining({
          fixtureId: "meta8-semantic-not-legal",
          actualDecisionSource: "legacy",
          result: "semantic_not_in_legal_actions",
          rollbackTriggers: ["semantic_action_not_in_legal_actions"],
        }),
        expect.objectContaining({
          fixtureId: "meta8-hidden-info-blocked",
          actualDecisionSource: "legacy",
          result: "hidden_info_blocked",
          rollbackTriggers: ["hidden_info_gate_failure"],
        }),
        expect.objectContaining({
          fixtureId: "meta8-missing-trace",
          actualDecisionSource: "legacy",
          result: "missing_trace",
          rollbackTriggers: ["missing_trace"],
        }),
        expect.objectContaining({
          fixtureId: "meta8-engine-reject-simulated",
          actualDecisionSource: "legacy",
          result: "engine_reject_simulated",
          rollbackTriggers: ["engine_reject"],
        }),
      ]),
    );
  });

  it("evaluates a custom internal canary fixture with semantic actual output", () => {
    const result = evaluateMeta8InternalCanaryFixture({
      fixtureId: "custom",
      scopeId: "basic_economy_draw",
      legalActionIds: ["legacy", "semantic"],
      legacyActionId: "legacy",
      semanticActionId: "semantic",
      flags: META8_INTERNAL_CANARY_CONFIG,
      scopeStatus: "internal_canary_ready",
      hardGatesPass: true,
      hiddenInfoBlocked: false,
      traceAvailable: true,
      engineRejectSimulated: false,
      expectedResult: "semantic_actual",
    });

    expect(result).toMatchObject({
      actualActionId: "semantic",
      actualDecisionSource: "semantic",
      result: "semantic_actual",
      rollbackTriggers: [],
    });
  });

  it("reports internal canary quality gates without enabling production cutover", () => {
    const report = buildMeta8InternalSemanticCanaryReport();

    expect(report.canaryRunSummary).toEqual({
      runSetCount: 5,
      decisionPointCount: 320,
      runnerScopeCount: 3,
      corpScopeCount: 1,
    });
    expect(report.qualityGates).toMatchObject({
      internalCanaryDecisionPoints: 320,
      semanticActualDecisionCount: 4,
      illegalSemanticDecisionCount: 0,
      hiddenInfoViolationCount: 0,
      engineRejectCount: 0,
      rollbackFailureCount: 0,
      traceCompleteRate: 1,
      runtimeOverheadDocumented: true,
      defaultConfigLegacyOnly: true,
    });
    expect(report.runtimeOverhead.documented).toBe(true);
    expect(report.goNoGo).toEqual({
      decision: "production_safe_shadow_candidate",
      productionCutoverAllowed: false,
      legacyFreezeAllowed: false,
      legacyRemovalReady: false,
      nextStep: "META9_production_safe_shadow_agreement_canary",
    });
    expect(report.productiveUseAllowed).toBe(false);
    expect(report.semanticExecutionScope).toBe("internal_canary_only");
  });
});
