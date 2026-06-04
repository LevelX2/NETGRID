import { describe, expect, it } from "vitest";

import {
  META7_EXCLUDED_SCOPES,
  META7_MULTI_RUN_SETS,
  buildMeta7MultiRunSemanticEvaluationHumanReviewReport,
  buildMeta7ScopeReadinessPromotions,
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
