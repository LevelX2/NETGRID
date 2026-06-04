import { describe, expect, it } from "vitest";

import {
  META7_EXCLUDED_SCOPES,
  META7_MULTI_RUN_SETS,
  META8_DEFAULT_CONFIG,
  META8_INTERNAL_CANARY_CONFIG,
  META8_INTERNAL_CANARY_FIXTURES,
  META9_PRODUCTION_SAFE_SHADOW_CONFIG,
  buildMeta9ProductionSafeShadowAgreementCanaryReport,
  buildMeta8InternalSemanticCanaryReport,
  buildMeta7MultiRunSemanticEvaluationHumanReviewReport,
  buildMeta7ScopeReadinessPromotions,
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
