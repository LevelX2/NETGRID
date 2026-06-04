import { describe, expect, it } from "vitest";

import { buildShadowEvaluationBatchReport } from "./controlled-shadow-mode";
import {
  AI061_SR_SIDE_SAFE_TARGET_CONTEXT_PROJECTIONS,
  buildAi061SrTargetContextProjectionExpansionReport,
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
