import { describe, expect, it } from "vitest";

import { buildShadowEvaluationBatchReport } from "./controlled-shadow-mode";
import {
  AI061_SR_SIDE_SAFE_TARGET_CONTEXT_PROJECTIONS,
  AI062_SR_SIDE_SAFE_ABILITY_BINDINGS,
  AI063_SR_SIDE_SAFE_CARD_SEMANTICS_JOINS,
  AI064_SR_SIDE_SAFE_COST_TIMING_EVIDENCE,
  AI065_SR_RUNTIME_BACKED_FIXTURE_PROMOTIONS,
  buildAi061SrTargetContextProjectionExpansionReport,
  buildAi062SrAbilityBindingExpansionReport,
  buildAi063SrCardSemanticsJoinCoverageReport,
  buildAi064SrCostTimingEvidenceExpansionReport,
  buildAi065SrRuntimeBackedShadowFixturePromotionReport,
  buildFixturesAfterAbilityBindingExpansion,
  buildFixturesAfterCardSemanticsJoinCoverage,
  buildFixturesAfterCostTimingEvidenceExpansion,
  buildFixturesAfterRuntimeBackedShadowFixturePromotion,
  buildFixturesAfterTargetContextProjection,
} from "./shadow-readiness-expansion";

describe("AI061-SR TargetContext Projection Expansion", () => {
  it("projects only the side-safe target context gaps counted by AI058", () => {
    const report = buildAi061SrTargetContextProjectionExpansionReport();

    expect(report.schemaVersion).toBe(
      "ai061-sr-target-context-projection-expansion-v1",
    );
    expect(report.step).toBe("AI061-SR");
    expect(report.targetContextGapBefore).toBe(13);
    expect(report.projectedTargetContextCount).toBe(13);
    expect(report.targetContextGapAfter).toBe(0);
    expect(report.projections).toHaveLength(13);
  });

  it("keeps hidden-info guarded target context unprojected", () => {
    const report = buildAi061SrTargetContextProjectionExpansionReport();
    const fixtures = buildFixturesAfterTargetContextProjection();
    const hiddenGuard = fixtures.find(
      (fixture) => fixture.scenarioId === "corp_ambush_or_remote_bait",
    );

    expect(report.hiddenInfoGuardedTargetContextNotProjectedCount).toBe(1);
    expect(report.notProjected).toEqual([
      expect.objectContaining({
        scenarioId: "corp_ambush_or_remote_bait",
        reason: "hidden_info_guard_remains_blocked",
      }),
    ]);
    expect(hiddenGuard?.knownProjectionGaps).toEqual(
      expect.arrayContaining(["hidden_info_blocked"]),
    );
  });

  it("does not reconstruct targets from board state or hidden information", () => {
    expect(
      AI061_SR_SIDE_SAFE_TARGET_CONTEXT_PROJECTIONS.every(
        (projection) =>
          projection.legalTargetOptionsStatus === "engine_provided" &&
          projection.hiddenInfoPolicy === "no_hidden_info_projected" &&
          projection.productiveChangeAllowed === false,
      ),
    ).toBe(true);
    expect(
      AI061_SR_SIDE_SAFE_TARGET_CONTEXT_PROJECTIONS.some(
        (projection) => projection.scenarioId === "corp_ambush_or_remote_bait",
      ),
    ).toBe(false);
  });

  it("improves the diagnostic batch while keeping hard gates and effects clean", () => {
    const fixtures = buildFixturesAfterTargetContextProjection();
    const batch = buildShadowEvaluationBatchReport(fixtures);

    expect(batch.scenarioCount).toBe(33);
    expect(batch.hardGateFailures).toEqual([]);
    expect(batch.actualDecisionOverrideCount).toBe(0);
    expect(batch.runtimeEffectCount).toBe(0);
    expect(
      batch.topSemanticGaps.find(
        (gap) => gap.gapId === "target_context_unavailable",
      )?.count,
    ).toBe(0);
    expect(batch.noRuntimeEffect).toBe(true);
    expect(Object.values(batch.noEffectFlags).every((value) => value === false)).toBe(
      true,
    );
  });
});

describe("AI065-SR Runtime-backed Shadow Fixture Promotion", () => {
  it("promotes selected safe fixtures to saved-state references", () => {
    const report = buildAi065SrRuntimeBackedShadowFixturePromotionReport();

    expect(report.schemaVersion).toBe(
      "ai065-sr-runtime-backed-shadow-fixture-promotion-v1",
    );
    expect(report.step).toBe("AI065-SR");
    expect(report.runtimeBackedFixtureCountBefore).toBe(0);
    expect(report.promotedFixtureCount).toBe(8);
    expect(report.runtimeBackedFixtureCountAfter).toBe(8);
    expect(report.runtimeBackedFixtureRateAfter).toBe(0.2424);
    expect(report.fixtureFile).toBe(
      "data/scenarios/ai065-sr-runtime-backed-shadow-fixtures-2026-06-04.json",
    );
  });

  it("does not promote hidden-info or unresolved multi-ability guards", () => {
    expect(
      AI065_SR_RUNTIME_BACKED_FIXTURE_PROMOTIONS.map(
        (promotion) => promotion.scenarioId,
      ),
    ).not.toEqual(
      expect.arrayContaining([
        "hidden_info_boundary_unrezzed_ice",
        "hidden_resource_boundary",
        "corp_ambush_or_remote_bait",
        "multi_ability_card_unresolved",
      ]),
    );
    expect(
      AI065_SR_RUNTIME_BACKED_FIXTURE_PROMOTIONS.every(
        (promotion) =>
          promotion.promotedSetupKind === "saved_state" &&
          promotion.deterministicReference === true &&
          promotion.hiddenInfoRisk === "low" &&
          promotion.productiveChangeAllowed === false,
      ),
    ).toBe(true);
  });

  it("updates fixture setup kinds while preserving diagnostic safety", () => {
    const fixtures = buildFixturesAfterRuntimeBackedShadowFixturePromotion();
    const saved = fixtures.filter((fixture) => fixture.setupKind === "saved_state");
    const batch = buildShadowEvaluationBatchReport(fixtures);

    expect(saved).toHaveLength(8);
    expect(saved.every((fixture) => fixture.stateRef !== undefined)).toBe(true);
    expect(
      fixtures.find((fixture) => fixture.scenarioId === "hidden_resource_boundary")
        ?.setupKind,
    ).toBe("synthetic_legal_actions");
    expect(batch.hardGateFailures).toEqual([]);
    expect(batch.actualDecisionOverrideCount).toBe(0);
    expect(batch.runtimeEffectCount).toBe(0);
  });
});

describe("AI064-SR Cost/Timing Evidence Expansion", () => {
  it("normalizes side-safe cost and timing evidence for all AI058 cost gaps", () => {
    const report = buildAi064SrCostTimingEvidenceExpansionReport();

    expect(report.schemaVersion).toBe(
      "ai064-sr-cost-timing-evidence-expansion-v1",
    );
    expect(report.step).toBe("AI064-SR");
    expect(report.costUnknownBefore).toBe(4);
    expect(report.normalizedCostTimingEvidenceCount).toBe(4);
    expect(report.costUnknownAfter).toBe(0);
    expect(report.timingUnknownAfter).toBe(0);
    expect(report.evidence).toHaveLength(4);
  });

  it("marks variable costs explicitly instead of guessing a paid amount", () => {
    const variableScenarios = AI064_SR_SIDE_SAFE_COST_TIMING_EVIDENCE.filter(
      (entry) => entry.variableCost,
    ).map((entry) => entry.scenarioId);

    expect(variableScenarios).toEqual([
      "corp_tag_trace_window",
      "trace_boost_or_decline",
      "x_value_choice",
    ]);
    expect(
      AI064_SR_SIDE_SAFE_COST_TIMING_EVIDENCE.every(
        (entry) =>
          entry.timingProfileStatus === "timing_point_from_legal_action" &&
          entry.hiddenInfoPolicy === "no_hidden_info_projected" &&
          entry.productiveChangeAllowed === false,
      ),
    ).toBe(true);
  });

  it("leaves only intentional ability and hidden-info gaps after cost timing expansion", () => {
    const batch = buildShadowEvaluationBatchReport(
      buildFixturesAfterCostTimingEvidenceExpansion(),
    );

    expect(
      batch.topSemanticGaps.find((gap) => gap.gapId === "cost_unknown")?.count,
    ).toBe(0);
    expect(
      batch.topSemanticGaps.find((gap) => gap.gapId === "ability_unresolved")
        ?.count,
    ).toBe(1);
    expect(
      batch.topSemanticGaps.find((gap) => gap.gapId === "hidden_info_blocked")
        ?.count,
    ).toBe(3);
    expect(batch.hardGateFailures).toEqual([]);
    expect(batch.actualDecisionOverrideCount).toBe(0);
    expect(batch.runtimeEffectCount).toBe(0);
  });
});

describe("AI063-SR Card-Semantics Join Coverage", () => {
  it("joins side-safe card semantics for all AI058 card-semantics gaps", () => {
    const report = buildAi063SrCardSemanticsJoinCoverageReport();

    expect(report.schemaVersion).toBe(
      "ai063-sr-card-semantics-join-coverage-v1",
    );
    expect(report.step).toBe("AI063-SR");
    expect(report.cardSemanticsUnavailableBefore).toBe(7);
    expect(report.joinedCardSemanticsCount).toBe(7);
    expect(report.cardSemanticsUnavailableAfter).toBe(0);
    expect(report.joins).toHaveLength(7);
  });

  it("separates card context signals from ability-resolved action tactics", () => {
    expect(
      AI063_SR_SIDE_SAFE_CARD_SEMANTICS_JOINS.every(
        (join) =>
          join.joinStatus === "joined_side_safe" &&
          join.cardContextSignalsStatus === "available" &&
          join.hiddenInfoPolicy === "no_hidden_info_projected" &&
          join.productiveChangeAllowed === false,
      ),
    ).toBe(true);
    expect(
      AI063_SR_SIDE_SAFE_CARD_SEMANTICS_JOINS.filter(
        (join) => join.actionTacticSignalsStatus === "available_ability_resolved",
      ).map((join) => join.scenarioId),
    ).toEqual(["runner_install_breaker_for_known_ice", "corp_damage_kill_window"]);
    expect(
      AI063_SR_SIDE_SAFE_CARD_SEMANTICS_JOINS.some(
        (join) => join.actionTacticSignalsStatus === "card_context_only",
      ),
    ).toBe(true);
  });

  it("keeps batch safety green after card semantics coverage", () => {
    const batch = buildShadowEvaluationBatchReport(
      buildFixturesAfterCardSemanticsJoinCoverage(),
    );

    expect(
      batch.topSemanticGaps.find(
        (gap) => gap.gapId === "card_semantics_unavailable",
      )?.count,
    ).toBe(0);
    expect(
      batch.topSemanticGaps.find((gap) => gap.gapId === "ability_unresolved")
        ?.count,
    ).toBe(1);
    expect(batch.hardGateFailures).toEqual([]);
    expect(batch.actualDecisionOverrideCount).toBe(0);
    expect(batch.runtimeEffectCount).toBe(0);
  });
});

describe("AI062-SR Ability Binding Expansion", () => {
  it("binds side-safe ability references without resolving the multi-ability guard", () => {
    const report = buildAi062SrAbilityBindingExpansionReport();

    expect(report.schemaVersion).toBe(
      "ai062-sr-ability-binding-expansion-v1",
    );
    expect(report.step).toBe("AI062-SR");
    expect(report.abilityUnresolvedBefore).toBe(6);
    expect(report.resolvedAbilityBindingCount).toBe(5);
    expect(report.abilityUnresolvedAfter).toBe(1);
    expect(report.bindings).toHaveLength(5);
    expect(report.unresolved).toEqual([
      expect.objectContaining({
        scenarioId: "multi_ability_card_unresolved",
        reason: "multi_ability_without_explicit_side_safe_id",
      }),
    ]);
  });

  it("keeps every binding side-safe and diagnostic only", () => {
    expect(
      AI062_SR_SIDE_SAFE_ABILITY_BINDINGS.every(
        (binding) =>
          binding.bindingStatus === "bound_side_safe" &&
          binding.abilityIdStatus === "stable_side_safe_reference" &&
          binding.hiddenInfoPolicy === "no_hidden_info_projected" &&
          binding.productiveChangeAllowed === false,
      ),
    ).toBe(true);
    expect(
      AI062_SR_SIDE_SAFE_ABILITY_BINDINGS.some(
        (binding) => binding.scenarioId === "multi_ability_card_unresolved",
      ),
    ).toBe(false);
  });

  it("reduces ability gaps after target context projection while keeping actual decisions legacy", () => {
    const fixtures = buildFixturesAfterAbilityBindingExpansion();
    const batch = buildShadowEvaluationBatchReport(fixtures);

    expect(
      batch.topSemanticGaps.find(
        (gap) => gap.gapId === "target_context_unavailable",
      )?.count,
    ).toBe(0);
    expect(
      batch.topSemanticGaps.find((gap) => gap.gapId === "ability_unresolved")
        ?.count,
    ).toBe(1);
    expect(batch.hardGateFailures).toEqual([]);
    expect(batch.actualDecisionOverrideCount).toBe(0);
    expect(batch.runtimeEffectCount).toBe(0);
  });
});
