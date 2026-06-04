import { describe, expect, it } from "vitest";

import {
  CONTROLLED_SHADOW_MODE_NO_EFFECT_FLAGS,
  FORBIDDEN_SHADOW_TRACE_CONSUMERS,
  buildSemanticShadowDecisionForFixture,
  buildSemanticShadowDecisionReport,
  buildDeviationTriageReport,
  buildLegacySemanticComparisonReport,
  buildShadowMetricsAndGatesReport,
  buildShadowScenarioCorpusReport,
  buildShadowModeTraceContractReport,
  buildRuntimeShadowHarnessReport,
  buildShadowEvaluationBatchReport,
  DEFAULT_SEMANTIC_AI_SHADOW_MODE_CONFIG,
  runRuntimeShadowHarness,
  type ShadowDecisionTrace,
} from "./controlled-shadow-mode";

describe("buildShadowModeTraceContractReport", () => {
  it("defines a developer-only no-runtime-effect trace contract", () => {
    const report = buildShadowModeTraceContractReport();

    expect(report.schemaVersion).toBe("shadow-mode-trace-contract-v1");
    expect(report.scope).toBe("trace_contract_only");
    expect(report.typeName).toBe("ShadowDecisionTrace");
    expect(report.visibilityScope).toBe("developer_only");
    expect(report.noRuntimeEffect).toBe(true);
    expect(report.productiveUseAllowed).toBe(false);
    expect(report.runtimeConsumerStatus).toBe("none");
  });

  it("requires legacy and semantic shadow decision evidence without allowing execution", () => {
    const report = buildShadowModeTraceContractReport();

    expect(report.requiredTraceFields).toEqual(
      expect.arrayContaining([
        "legacyDecision",
        "legalActionSummary",
        "candidateSummary",
        "tacticalGoals",
        "doctrineReadiness",
        "hardGates",
        "visibilityScope",
        "noRuntimeEffect",
      ]),
    );
    expect(report.requiredLegacyDecisionFields).toEqual(
      expect.arrayContaining([
        "selectedActionId",
        "selectedActionType",
        "source",
      ]),
    );
    expect(report.requiredSemanticDecisionFields).toEqual(
      expect.arrayContaining([
        "scoreStatus",
        "topCandidates",
        "blockedCandidates",
        "whyNot",
      ]),
    );
    expect(report.actualDecisionContract).toBe(
      "actualDecision_equals_legacyDecision",
    );
  });

  it("names public and runtime consumers as forbidden trace consumers", () => {
    const report = buildShadowModeTraceContractReport();

    expect(report.forbiddenConsumers).toEqual(FORBIDDEN_SHADOW_TRACE_CONSUMERS);
    expect(report.forbiddenConsumers).toEqual(
      expect.arrayContaining([
        "applyAction",
        "PlayerAction",
        "PublicEvent",
        "PlayerView",
        "WebSocket payload",
        "Replay payload",
        "Planner weights",
      ]),
    );
  });

  it("keeps every controlled shadow mode no-effect flag false", () => {
    const report = buildShadowModeTraceContractReport();

    expect(report.noEffectFlags).toEqual(CONTROLLED_SHADOW_MODE_NO_EFFECT_FLAGS);
    expect(Object.values(report.noEffectFlags)).toEqual(
      expect.arrayContaining([false]),
    );
    expect(Object.values(report.noEffectFlags).every((value) => value === false)).toBe(
      true,
    );
  });
});

describe("buildShadowScenarioCorpusReport", () => {
  it("defines the required runner, corp and advanced shadow scenarios", () => {
    const report = buildShadowScenarioCorpusReport();
    const scenarioIds = report.fixtures.map((fixture) => fixture.scenarioId);

    expect(report.schemaVersion).toBe("shadow-scenario-corpus-v1");
    expect(report.scope).toBe("shadow_scenario_corpus");
    expect(report.summary).toMatchObject({
      scenarioCount: 33,
      runnerScenarioCount: 16,
      corpScenarioCount: 17,
      advancedScenarioCount: 7,
      allowedShadowCount: 33,
      syntheticLegalActionCount: 33,
      runtimeBackedScenarioCount: 0,
    });
    expect(scenarioIds).toEqual(
      expect.arrayContaining([
        "runner_basic_economy",
        "runner_break_subroutine",
        "corp_basic_economy",
        "corp_operation_play",
        "trace_boost_or_decline",
        "hidden_info_boundary_unrezzed_ice",
        "multi_ability_card_unresolved",
      ]),
    );
  });

  it("marks known projection gaps instead of guessing missing semantics", () => {
    const report = buildShadowScenarioCorpusReport();

    expect(report.summary.knownProjectionGaps).toEqual(
      expect.arrayContaining([
        "target_context_unavailable",
        "ability_unresolved",
        "card_semantics_unavailable",
        "cost_unknown",
        "hidden_info_blocked",
      ]),
    );
    expect(
      report.fixtures.find(
        (fixture) => fixture.scenarioId === "multi_ability_card_unresolved",
      )?.knownProjectionGaps,
    ).toEqual(["ability_unresolved"]);
  });

  it("requires an explicit hidden-info boundary on every fixture", () => {
    const report = buildShadowScenarioCorpusReport();

    expect(
      report.fixtures.every((fixture) => fixture.hiddenInfoBoundary.length >= 2),
    ).toBe(true);
    expect(
      report.fixtures.find(
        (fixture) => fixture.scenarioId === "hidden_resource_boundary",
      )?.hiddenInfoBoundary,
    ).toEqual(
      expect.arrayContaining([
        "Hidden Runner resources and grip/stack contents stay outside Corp shadow input.",
      ]),
    );
  });

  it("keeps the corpus diagnostic with no runtime effect", () => {
    const report = buildShadowScenarioCorpusReport();

    expect(report.productiveUseAllowed).toBe(false);
    expect(report.noRuntimeEffect).toBe(true);
    expect(Object.values(report.noEffectFlags).every((value) => value === false)).toBe(
      true,
    );
  });
});

describe("buildSemanticShadowDecisionReport", () => {
  it("computes semantic shadow decisions for every AI052 fixture without runtime consumers", () => {
    const report = buildSemanticShadowDecisionReport();

    expect(report.schemaVersion).toBe("semantic-shadow-decision-v0");
    expect(report.scope).toBe("semantic_shadow_decision_v0_report_only");
    expect(report.runtimeConsumerStatus).toBe("none");
    expect(report.semanticExecutionAllowed).toBe(false);
    expect(report.productiveUseAllowed).toBe(false);
    expect(report.summary).toEqual({
      scenarioCount: 33,
      rankedShadowOnly: 8,
      blockedByGate: 3,
      blockedByGap: 22,
      noCandidate: 0,
      notScored: 0,
      selectedActionCount: 8,
      runtimeConsumerCount: 0,
      illegalSemanticDecisionCount: 0,
      hiddenInfoViolationCount: 0,
    });
  });

  it("selects only a synthetic LegalAction candidate when no hard gate or gap blocks ranking", () => {
    const corpus = buildShadowScenarioCorpusReport();
    const fixture = corpus.fixtures.find(
      (candidate) => candidate.scenarioId === "runner_draw_vs_credit",
    );

    expect(fixture).toBeDefined();
    const decision = buildSemanticShadowDecisionForFixture(fixture!);

    expect(decision.scoreStatus).toBe("ranked_shadow_only");
    expect(decision.selectedActionId).toBe("runner_draw_vs_credit.draw_card.1");
    expect(decision.selectedCandidateId).toBe(
      "runner_draw_vs_credit.draw_card.1",
    );
    expect(decision.noRuntimeEffect).toBe(true);
  });

  it("blocks target, ability, card and cost gaps without guessing semantics", () => {
    const report = buildSemanticShadowDecisionReport();
    const blocked = report.scenarioResults.find(
      (result) => result.scenarioId === "runner_break_subroutine",
    );

    expect(blocked?.decision.scoreStatus).toBe("blocked_by_gap");
    expect(blocked?.decision.selectedActionId).toBeUndefined();
    expect(blocked?.decision.blockingReasons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          scoreStatus: "blocked_by_gap",
          gap: "ability_unresolved",
        }),
        expect.objectContaining({
          scoreStatus: "blocked_by_gap",
          gap: "target_context_unavailable",
        }),
      ]),
    );
  });

  it("keeps hidden-info boundary scenarios blocked by gate", () => {
    const report = buildSemanticShadowDecisionReport();
    const hidden = report.scenarioResults.find(
      (result) => result.scenarioId === "hidden_info_boundary_unrezzed_ice",
    );

    expect(hidden?.decision.scoreStatus).toBe("blocked_by_gate");
    expect(hidden?.decision.selectedActionId).toBeUndefined();
    expect(hidden?.decision.blockingReasons[0]).toEqual(
      expect.objectContaining({
        scoreStatus: "blocked_by_gate",
        gateId: "hidden_info",
        gap: "hidden_info_blocked",
      }),
    );
  });
});

describe("buildLegacySemanticComparisonReport", () => {
  it("creates one comparison for every semantic shadow fixture", () => {
    const report = buildLegacySemanticComparisonReport();

    expect(report.schemaVersion).toBe("legacy-semantic-shadow-comparison-v1");
    expect(report.scope).toBe(
      "legacy_semantic_shadow_comparison_report_only",
    );
    expect(report.runtimeConsumerStatus).toBe("none");
    expect(report.semanticExecutionAllowed).toBe(false);
    expect(report.productiveUseAllowed).toBe(false);
    expect(report.summary).toEqual({
      comparisonCount: 33,
      sameAction: 8,
      sameActionType: 0,
      differentButPlausible: 0,
      semanticBetterCandidate: 0,
      legacyBetterCandidate: 0,
      semanticBlocked: 25,
      comparisonUnavailable: 0,
      hardGateErrorCount: 0,
      hiddenInfoBasedSemanticDecisionCount: 0,
      unreachableSemanticDecisionCount: 0,
      nonEngineLegalSemanticDecisionCount: 0,
    });
  });

  it("marks ranked synthetic legacy and semantic references as same action", () => {
    const report = buildLegacySemanticComparisonReport();
    const comparison = report.comparisons.find(
      (entry) => entry.scenarioId === "runner_draw_vs_credit",
    );

    expect(comparison).toEqual(
      expect.objectContaining({
        legacyActionId: "runner_draw_vs_credit.draw_card.1",
        semanticActionId: "runner_draw_vs_credit.draw_card.1",
        agreement: "same_action",
        deltaCategory: ["same_exact_action"],
        hardGateStatus: "pass",
      }),
    );
  });

  it("categorizes semantic target and ability gap blocks", () => {
    const report = buildLegacySemanticComparisonReport();
    const comparison = report.comparisons.find(
      (entry) => entry.scenarioId === "runner_break_subroutine",
    );

    expect(comparison).toEqual(
      expect.objectContaining({
        agreement: "semantic_blocked",
        hardGateStatus: "blocked_by_gap",
        deltaCategory: expect.arrayContaining([
          "semantic_blocked_by_ability_gap",
          "semantic_blocked_by_target_context",
        ]),
      }),
    );
  });

  it("keeps hidden-info semantic cases blocked instead of selecting them", () => {
    const report = buildLegacySemanticComparisonReport();
    const comparison = report.comparisons.find(
      (entry) => entry.scenarioId === "hidden_info_boundary_unrezzed_ice",
    );

    expect(comparison).toEqual(
      expect.objectContaining({
        agreement: "semantic_blocked",
        hardGateStatus: "blocked_by_gate",
        deltaCategory: ["semantic_avoids_hidden_info"],
      }),
    );
    expect(comparison?.semanticActionId).toBeUndefined();
  });
});

describe("buildDeviationTriageReport", () => {
  it("assigns a triage class to every comparison delta", () => {
    const report = buildDeviationTriageReport();

    expect(report.schemaVersion).toBe("shadow-deviation-triage-v1");
    expect(report.scope).toBe("deviation_taxonomy_and_triage_report_only");
    expect(report.humanReviewStopsProcess).toBe(false);
    expect(report.productiveUseAllowed).toBe(false);
    expect(report.summary).toEqual({
      comparisonCount: 33,
      triageEntryCount: 41,
      humanReviewItemCount: 33,
      acceptableDifference: 8,
      missingTargetContext: 13,
      missingAbilityBinding: 6,
      missingCostOrTiming: 4,
      needsCardSemanticsReview: 7,
      hiddenInfoBlocker: 3,
    });
  });

  it("generates a human-review list without stopping the process", () => {
    const report = buildDeviationTriageReport();

    expect(report.humanReviewList).toHaveLength(33);
    expect(
      report.humanReviewList.every(
        (item) => item.productiveChangeAllowed === false,
      ),
    ).toBe(true);
    expect(report.humanReviewStopsProcess).toBe(false);
  });

  it("maps target, ability, cost, card and hidden-info gaps to controlled classes", () => {
    const report = buildDeviationTriageReport();
    const classes = report.triageEntries.map((entry) => entry.triageClass);

    expect(classes).toEqual(
      expect.arrayContaining([
        "missing_target_context",
        "missing_ability_binding",
        "missing_cost_or_timing",
        "needs_card_semantics_review",
        "hidden_info_blocker",
      ]),
    );
  });

  it("keeps triage followups separate from shadow code changes", () => {
    const report = buildDeviationTriageReport();

    expect(
      report.triageEntries
        .filter((entry) => entry.requiresHumanReview)
        .every(
          (entry) => entry.followupScope === "separate_semantics_followup",
        ),
    ).toBe(true);
  });
});

describe("buildShadowMetricsAndGatesReport", () => {
  it("defines hard gates with zero allowed safety failures", () => {
    const report = buildShadowMetricsAndGatesReport();

    expect(report.schemaVersion).toBe("shadow-metrics-gates-v1");
    expect(report.scope).toBe("shadow_metrics_and_quality_gates_report_only");
    expect(report.hardGates).toHaveLength(6);
    expect(report.hardGates.every((gate) => gate.value === 0)).toBe(true);
    expect(report.hardGates.every((gate) => gate.requiredValue === 0)).toBe(true);
    expect(report.hardGates.every((gate) => gate.status === "pass")).toBe(true);
  });

  it("measures current shadow quality and marks unresolved projection rates as uncertain", () => {
    const report = buildShadowMetricsAndGatesReport();

    expect(report.qualityMetrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          metricId: "semanticDecisionAvailableRate",
          value: 0.2424,
          numerator: 8,
          denominator: 33,
        }),
        expect.objectContaining({
          metricId: "semanticBlockedByGapRate",
          value: 0.6667,
          numerator: 22,
          denominator: 33,
        }),
        expect.objectContaining({
          metricId: "sourceResolvedRate",
          value: null,
          measured: false,
        }),
      ]),
    );
  });

  it("documents initial and future quality thresholds without treating them as safety blockers", () => {
    const report = buildShadowMetricsAndGatesReport();

    expect(report.qualityGates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          gateId: "initial_semantic_decision_available_rate",
          threshold: 0.8,
          status: "fail_quality_gap",
          failurePolicy: "carry_to_readiness_review",
        }),
        expect.objectContaining({
          gateId: "future_semantic_decision_available_rate",
          threshold: 0.95,
          status: "fail_quality_gap",
        }),
      ]),
    );
    expect(report.failurePolicy).toEqual({
      hardSafetyGateFailure: "block_process",
      qualityGateFailure: "carry_to_readiness_review",
      humanReviewRate: "document_only_initially",
    });
  });

  it("keeps metrics and gates diagnostic only", () => {
    const report = buildShadowMetricsAndGatesReport();

    expect(report.runtimeConsumerStatus).toBe("none");
    expect(report.semanticExecutionAllowed).toBe(false);
    expect(report.productiveUseAllowed).toBe(false);
    expect(report.noRuntimeEffect).toBe(true);
  });
});

describe("runRuntimeShadowHarness", () => {
  it("is disabled by default and returns the exact legacy decision as actualDecision", () => {
    const legacyDecision = {
      selectedActionId: "legacy-gain-credit",
      selectedActionType: "gain_credit",
    };
    const result = runRuntimeShadowHarness({
      legacyDecision,
      stateVersion: 1,
    });

    expect(DEFAULT_SEMANTIC_AI_SHADOW_MODE_CONFIG.semanticAiShadowModeEnabled).toBe(
      false,
    );
    expect(result.shadowDiagnosticsEnabled).toBe(false);
    expect(result.actualDecision).toBe(legacyDecision);
    expect(result.legacyDecision).toBe(legacyDecision);
    expect(result.semanticShadowDecision).toBeUndefined();
    expect(result.trace).toBeUndefined();
  });

  it("can run diagnostics when explicitly enabled while actualDecision remains legacy", () => {
    const corpus = buildShadowScenarioCorpusReport();
    const fixture = corpus.fixtures.find(
      (candidate) => candidate.scenarioId === "runner_draw_vs_credit",
    );
    const legacyDecision = {
      selectedActionId: "legacy-draw",
      selectedActionType: "draw_card",
    };

    expect(fixture).toBeDefined();
    const result = runRuntimeShadowHarness({
      legacyDecision,
      fixture: fixture!,
      stateVersion: 2,
      config: {
        ...DEFAULT_SEMANTIC_AI_SHADOW_MODE_CONFIG,
        semanticAiShadowModeEnabled: true,
      },
    });

    expect(result.shadowDiagnosticsEnabled).toBe(true);
    expect(result.actualDecision).toBe(legacyDecision);
    expect(result.actualDecisionEqualsLegacyDecision).toBe(true);
    expect(result.semanticShadowDecision?.scoreStatus).toBe("ranked_shadow_only");
    expect(result.trace?.visibilityScope).toBe("developer_only");
    expect(result.trace?.noRuntimeEffect).toBe(true);
  });

  it("keeps hidden-info fixtures diagnostic and blocked when enabled", () => {
    const corpus = buildShadowScenarioCorpusReport();
    const fixture = corpus.fixtures.find(
      (candidate) => candidate.scenarioId === "hidden_resource_boundary",
    );
    const legacyDecision = {
      selectedActionId: "legacy-operation",
      selectedActionType: "play_operation",
    };

    expect(fixture).toBeDefined();
    const result = runRuntimeShadowHarness({
      legacyDecision,
      fixture: fixture!,
      stateVersion: 3,
      config: {
        ...DEFAULT_SEMANTIC_AI_SHADOW_MODE_CONFIG,
        semanticAiShadowModeEnabled: true,
      },
    });

    expect(result.actualDecision).toBe(legacyDecision);
    expect(result.semanticShadowDecision?.scoreStatus).toBe("blocked_by_gate");
    expect(result.trace?.hardGates.hiddenInfoViolationCount).toBe(0);
    expect(result.trace?.hardGates.actualDecisionOverrideCount).toBe(0);
  });
});

describe("buildRuntimeShadowHarnessReport", () => {
  it("documents the default-off diagnostic-only harness contract", () => {
    const report = buildRuntimeShadowHarnessReport();

    expect(report.schemaVersion).toBe("runtime-shadow-harness-v1");
    expect(report.scope).toBe("runtime_shadow_harness_default_off_diagnostic_only");
    expect(report.configContract.semanticAiShadowModeEnabled).toBe(false);
    expect(report.configContract.diagnosticsOnly).toBe(true);
    expect(report.configContract.visibilityScope).toBe("developer_only");
    expect(report.actualDecisionContract).toBe(
      "actualDecision_equals_legacyDecision",
    );
    expect(report.runtimeConsumerStatus).toBe("none");
    expect(report.publicPayloadChangesAllowed).toBe(false);
    expect(report.noRuntimeEffect).toBe(true);
  });
});

describe("buildShadowEvaluationBatchReport", () => {
  it("runs the diagnostic harness over every fixture with no hard gate failures", () => {
    const report = buildShadowEvaluationBatchReport();

    expect(report.schemaVersion).toBe("shadow-evaluation-batch-v1");
    expect(report.taskId).toBe("AI058");
    expect(report.scenarioCount).toBe(33);
    expect(report.decisionPointCount).toBe(33);
    expect(report.scenarioResults).toHaveLength(33);
    expect(report.hardGateFailures).toEqual([]);
    expect(report.knownBadDecisions).toEqual([]);
    expect(report.actualDecisionOverrideCount).toBe(0);
    expect(report.runtimeEffectCount).toBe(0);
  });

  it("proves every batch actualDecision remains the legacy decision", () => {
    const report = buildShadowEvaluationBatchReport();

    expect(
      report.scenarioResults.every(
        (result) =>
          result.actualDecisionEqualsLegacyDecision === true &&
          result.actualDecisionActionId === result.legacyDecisionActionId,
      ),
    ).toBe(true);
  });

  it("summarizes top semantic gaps and recommended followups", () => {
    const report = buildShadowEvaluationBatchReport();

    expect(report.topSemanticGaps).toEqual([
      { gapId: "target_context_unavailable", count: 13 },
      { gapId: "card_semantics_unavailable", count: 7 },
      { gapId: "ability_unresolved", count: 6 },
      { gapId: "cost_unknown", count: 4 },
      { gapId: "hidden_info_blocked", count: 3 },
    ]);
    expect(report.recommendedFollowups).toEqual(
      expect.arrayContaining([
        "Project side-safe TargetContext for target-sensitive LegalActions.",
        "Keep hidden-info boundary fixtures blocked and review only their visibility policy.",
      ]),
    );
  });

  it("keeps the batch report diagnostic only", () => {
    const report = buildShadowEvaluationBatchReport();

    expect(report.runtimeConsumerStatus).toBe("none");
    expect(report.semanticExecutionAllowed).toBe(false);
    expect(report.productiveUseAllowed).toBe(false);
    expect(report.noRuntimeEffect).toBe(true);
  });
});

describe("ShadowDecisionTrace", () => {
  it("can represent legacy execution and semantic shadow diagnostics side by side", () => {
    const trace = {
      traceId: "trace-ai051-example",
      stateVersion: 12,
      actorSide: "runner",
      legacyDecision: {
        selectedActionId: "gain-credit-1",
        selectedActionType: "gain_credit",
        source: "legacy_ai",
        selectedFromLegalActions: true,
        evidence: ["legacy selected an engine LegalAction"],
      },
      semanticShadowDecision: {
        selectedActionId: "draw-card-1",
        selectedCandidateId: "candidate-draw-card-1",
        scoreStatus: "ranked_shadow_only",
        topCandidates: [],
        blockedCandidates: [],
        whyNot: [],
        noRuntimeEffect: true,
      },
      legalActionSummary: [
        {
          actionId: "gain-credit-1",
          actionType: "gain_credit",
          source: "engine_legal_actions",
          visibilityScope: "actor_private",
        },
      ],
      candidateSummary: [
        {
          candidateId: "candidate-draw-card-1",
          actionId: "draw-card-1",
          actionType: "draw_card",
          primaryProjectionStatus: "projected",
          hardGateStatus: "pass",
          projectionIssues: [],
        },
      ],
      tacticalGoals: [
        {
          goalId: "runner.economy_stabilize",
          family: "runner_economy_stabilize",
          side: "runner",
          readiness: "ready",
          evidence: ["goal is side-safe"],
        },
      ],
      doctrineReadiness: {
        status: "ready",
        gaps: [],
        evidence: ["doctrine diagnostics are side-safe"],
      },
      hardGates: {
        gateResults: [
          {
            gateId: "actual_decision_legacy_only",
            status: "pass",
            severity: "info",
            evidence: ["actualDecision remains legacyDecision"],
          },
        ],
        illegalSemanticDecisionCount: 0,
        hiddenInfoViolationCount: 0,
        runtimeEffectCount: 0,
        actualDecisionOverrideCount: 0,
        nonEngineLegalAssumptionCount: 0,
      },
      visibilityScope: "developer_only",
      noRuntimeEffect: true,
    } satisfies ShadowDecisionTrace;

    expect(trace.legacyDecision.source).toBe("legacy_ai");
    expect(trace.semanticShadowDecision?.noRuntimeEffect).toBe(true);
    expect(trace.visibilityScope).toBe("developer_only");
    expect(trace.hardGates.actualDecisionOverrideCount).toBe(0);
  });
});
