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
  "docs/reviews/ai/aufgabe-009-batch2-diff-review-report-2026-05-25.json",
);

type BatchTwoDiffReviewReport = {
  taskId: string;
  batch: string;
  hardErrorCount: number;
  shapeDifferenceCount: number;
  targetProfileShapeDifferenceCount: number;
  trashCreditTargetShapeDifferenceCount: number;
  costProfileShapeDifferenceCount: number;
  boardContextRequiredCount: number;
  realSemanticConflictCount: number;
  classificationCountsByWarningKind: Record<string, number>;
  boardContextClassifications: Record<string, number>;
  normalizationRuleCandidates: Array<{ rule: string; appliesTo: unknown[] }>;
  cards: Array<{
    cardId: string;
    classifications: Array<{
      sourceWarningKind: string;
      fact: string;
      classification: string;
      normalizedSemanticMeaning: string;
      conflict: boolean;
    }>;
    realSemanticConflicts: unknown[];
  }>;
};

describe("generated fact Batch-2 diff review", () => {
  it("is deterministic against the committed report", () => {
    const first = runDiffReviewJson();
    const second = runDiffReviewJson();
    expect(first).toEqual(second);
    expect(first).toEqual(readReport());
  });

  it("classifies every Aufgabe-008 diff group without semantic conflicts", () => {
    const report = readReport();
    expect(report.taskId).toBe("Aufgabe 009");
    expect(report.batch).toBe("batch_2_breaker_target_trash_credit");
    expect(report.hardErrorCount).toBe(0);
    expect(report.realSemanticConflictCount).toBe(0);
    expect(report.shapeDifferenceCount).toBe(2);
    expect(report.targetProfileShapeDifferenceCount).toBe(2);
    expect(report.trashCreditTargetShapeDifferenceCount).toBe(0);
    expect(report.costProfileShapeDifferenceCount).toBe(6);
    expect(report.boardContextRequiredCount).toBe(7);
    expect(report.classificationCountsByWarningKind).toMatchObject({
      board_context_required: 7,
      cost_profile_shape_difference: 6,
      shape_difference: 2,
      target_profile_shape_difference: 2,
    });
    expect(
      report.classificationCountsByWarningKind
        .trash_credit_target_shape_difference ?? 0,
    ).toBe(0);
  });

  it("keeps SMC normal-cost target profile distinct from Mystery Box free install", () => {
    const report = readReport();
    const smc = card(report, "onr_v1_059_self-modifying-code");
    const mysteryBox = card(report, "onr_v1_043_mystery-box");

    expect(
      smc.classifications.some(
        (item) =>
          item.sourceWarningKind === "target_profile_shape_difference" &&
          item.normalizedSemanticMeaning.includes("normal-cost"),
      ),
    ).toBe(true);
    expect(
      smc.classifications.some(
        (item) =>
          item.sourceWarningKind === "shape_difference" &&
          item.fact === "effect:install_discount",
      ),
    ).toBe(false);
    expect(
      mysteryBox.classifications.some(
        (item) =>
          item.sourceWarningKind === "target_profile_shape_difference" &&
          item.normalizedSemanticMeaning.includes("free") &&
          item.normalizedSemanticMeaning.includes("top-five"),
      ),
    ).toBe(true);
  });

  it("keeps Poltergeist and Scatter Shot target classifications separate", () => {
    const report = readReport();
    expect(
      card(report, "onr_v1_048_poltergeist").classifications.some(
        (item) => item.classification === "target_equivalent_node_trash_credit",
      ),
    ).toBe(false);
    expect(
      card(report, "onr_v1_057_scatter-shot").classifications.some(
        (item) =>
          item.classification === "target_equivalent_upgrade_trash_credit",
      ),
    ).toBe(false);
  });

  it("splits CostProfile and BoardContext into explicit non-conflict classes", () => {
    const report = readReport();
    expect(
      report.cards.every((item) =>
        item.classifications.some(
          (classification) =>
            classification.classification ===
            "cost_profile_requires_overlay_split",
        ),
      ),
    ).toBe(true);
    expect(report.boardContextClassifications).toEqual({
      install_cost_requires_engine_cost_context: 1,
      target_profile_requires_search_legalaction_context: 6,
    });
  });

  it("contains the expected normalization rule candidates and no hidden info", () => {
    const report = readReport();
    expect(
      report.normalizationRuleCandidates.map((candidate) => candidate.rule),
    ).toEqual([
      "board_context_required_classification",
      "breaker_profile_shape_normalization",
      "cost_profile_split_normalization",
      "target_profile_install_cost_normalization",
      "target_profile_stack_search_normalization",
    ]);
    const serialized = JSON.stringify(report);
    for (const blockedField of [
      "opponentDeckList",
      "actualRndOrder",
      "privatePayload",
      "fullGameState",
    ]) {
      expect(serialized).not.toContain(`"${blockedField}"`);
    }
  });
});

function card(report: BatchTwoDiffReviewReport, cardId: string) {
  const found = report.cards.find((item) => item.cardId === cardId);
  if (!found) throw new Error(`Missing card ${cardId}`);
  return found;
}

function runDiffReviewJson(): BatchTwoDiffReviewReport {
  return JSON.parse(
    runJsonCommand(
      "node",
      ["scripts/check-ai-generated-fact-batch2-diff-review.mjs", "--json"],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    ),
  ) as BatchTwoDiffReviewReport;
}

function readReport(): BatchTwoDiffReviewReport {
  return JSON.parse(
    fs.readFileSync(reportPath, "utf8"),
  ) as BatchTwoDiffReviewReport;
}

function runJsonCommand(
  command: string,
  args: string[],
  options: { cwd: string; encoding: BufferEncoding },
): string {
  try {
    return execFileSync(command, args, options);
  } catch (error) {
    const output = (error as { stdout?: Buffer | string }).stdout;
    if (output) {
      return Buffer.isBuffer(output) ? output.toString(options.encoding) : output;
    }
    throw error;
  }
}
