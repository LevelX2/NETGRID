import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

const reportPath = path.join(
  repoRoot,
  "docs/reviews/ai/aufgabe-004-batch1-compiler-diff-review-report-2026-05-25.json",
);

type BatchOneDiffReviewReport = {
  taskId: string;
  shapeDifferenceCount: number;
  monolithOnlyMechanicalFactCount: number;
  realSemanticConflictCount: number;
  shapeDifferenceClassifications: Record<string, number>;
  monolithOnlyClassifications: Record<string, number>;
  normalizationRuleCandidates: unknown[];
  deriverFollowupCandidates: unknown[];
  cards: Array<{
    cardId: string;
    shapeDifferences: Array<{
      classification: string;
      conflict: boolean;
      futureAction: string;
    }>;
    monolithOnlyMechanicalFacts: Array<{
      classification: string;
      futureAction: string;
    }>;
  }>;
};

describe("generated fact Batch-1 compiler diff review", () => {
  it("is deterministic against the committed report", () => {
    const first = runDiffReviewJson();
    const second = runDiffReviewJson();
    expect(first).toEqual(second);
    expect(first).toEqual(readReport());
  });

  it("classifies the seven shape differences without semantic conflicts", () => {
    const report = readReport();
    expect(report.taskId).toBe("Aufgabe 004");
    expect(report.shapeDifferenceCount).toBe(7);
    expect(report.realSemanticConflictCount).toBe(0);
    expect(report.shapeDifferenceClassifications).toEqual({
      semantic_equivalent_shape_difference: 0,
      generated_more_precise_than_monolith: 0,
      monolith_more_specific_than_generated: 6,
      board_context_shape_difference: 1,
      needs_future_normalization_rule: 0,
      real_semantic_conflict: 0,
    });
    expect(
      report.cards
        .flatMap((card) => card.shapeDifferences)
        .every((shape) => shape.conflict === false),
    ).toBe(true);
  });

  it("classifies the Employee Empowerment monolith-only fact as a deriver follow-up", () => {
    const report = readReport();
    expect(report.monolithOnlyMechanicalFactCount).toBe(1);
    expect(report.monolithOnlyClassifications).toEqual({
      legacy_keep_for_compat: 0,
      manual_strategy_not_generated: 0,
      generated_deriver_gap: 1,
      monolith_mechanical_duplication_candidate: 0,
      potential_hint_cleanup_candidate: 0,
    });
    const employee = report.cards.find(
      (card) => card.cardId === "onr_v1_199_employee-empowerment",
    );
    expect(employee?.monolithOnlyMechanicalFacts).toContainEqual(
      expect.objectContaining({
        classification: "generated_deriver_gap",
        futureAction: "descriptor_or_deriver_followup",
      }),
    );
  });

  it("keeps follow-up lists focused on normalization and derivation only", () => {
    const report = readReport();
    expect(report.normalizationRuleCandidates.length).toBe(3);
    expect(report.deriverFollowupCandidates.length).toBe(3);
    expect(
      report.cards
        .flatMap((card) => card.shapeDifferences)
        .every((shape) =>
          [
            "normalization_rule_candidate",
            "deriver_followup_candidate",
          ].includes(shape.futureAction),
        ),
    ).toBe(true);
  });

  it("does not emit hidden-info or runtime state fields", () => {
    const serialized = JSON.stringify(readReport());
    for (const blockedField of [
      "opponentDeckList",
      "actualRndOrder",
      "privatePayload",
      "fullGameState",
      "legalActions",
      "stateVersion",
      "stateHash",
    ]) {
      expect(serialized).not.toContain(`"${blockedField}"`);
    }
  });
});

function runDiffReviewJson(): BatchOneDiffReviewReport {
  return JSON.parse(
    execFileSync(
      "node",
      ["scripts/check-ai-generated-fact-batch1-diff-review.mjs", "--json"],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    ),
  ) as BatchOneDiffReviewReport;
}

function readReport(): BatchOneDiffReviewReport {
  return JSON.parse(
    fs.readFileSync(reportPath, "utf8"),
  ) as BatchOneDiffReviewReport;
}
