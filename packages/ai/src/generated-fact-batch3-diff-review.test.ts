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
  "docs/reviews/ai/aufgabe-013-batch3-diff-review-report-2026-05-25.json",
);

type BatchThreeDiffReviewReport = {
  taskId: string;
  shapeDifferenceCount: number;
  remoteRoleShapeDifferenceCount: number;
  futureRunShapeDifferenceCount: number;
  boardContextRequiredCount: number;
  runpathContextRequiredCount: number;
  descriptorContextRequiredCount: number;
  realSemanticConflictCount: number;
  classificationCountsByWarningKind: Record<string, number>;
  splitRecommendation: {
    decision: string;
    followupShape: string;
    remoteUpgrades: string[];
    futureRunIce: string[];
  };
  cards: Array<{
    cardId: string;
    title: string;
    recommendedSubBatch: string;
    classifications: Array<{
      classification: string;
      sourceWarningKind: string;
      fact: string;
    }>;
    realSemanticConflicts: unknown[];
  }>;
};

describe("generated fact Batch-3 diff review", () => {
  it("is deterministic against the committed report", () => {
    const first = runDiffReviewJson();
    const second = runDiffReviewJson();
    expect(first).toEqual(second);
    expect(first).toEqual(readReport());
  });

  it("classifies all Batch-3 diff groups without semantic conflicts", () => {
    const report = readReport();
    expect(report.taskId).toBe("Aufgabe 013");
    expect(report.cards).toHaveLength(5);
    expect(report.shapeDifferenceCount).toBe(6);
    expect(report.remoteRoleShapeDifferenceCount).toBe(4);
    expect(report.futureRunShapeDifferenceCount).toBe(3);
    expect(report.boardContextRequiredCount).toBe(15);
    expect(report.runpathContextRequiredCount).toBe(10);
    expect(report.descriptorContextRequiredCount).toBe(9);
    expect(report.realSemanticConflictCount).toBe(0);
    expect(report.classificationCountsByWarningKind).toEqual({
      board_context_required: 15,
      descriptor_context_required: 9,
      future_run_shape_difference: 3,
      remote_role_shape_difference: 4,
      runpath_context_required: 10,
      shape_difference: 6,
    });
  });

  it("preserves RemoteRole guardrails for Crystal Palace and Red Herrings", () => {
    const report = readReport();
    expect(
      card(report, "Crystal Palace Station Grid").classifications.some(
        (item) => item.classification === "remote_role_equivalent_run_tax",
      ),
    ).toBe(true);
    expect(
      card(report, "Red Herrings").classifications.some(
        (item) =>
          item.classification === "remote_role_equivalent_agenda_steal_tax",
      ),
    ).toBe(true);
    expect(
      JSON.stringify(card(report, "Crystal Palace Station Grid")),
    ).not.toContain("agenda_steal_tax_regression");
  });

  it("keeps Future-run ICE in a separate descriptor-review path", () => {
    const report = readReport();
    for (const title of ["Tutor", "Virizz", "Viral 15"]) {
      const item = card(report, title);
      expect(item.recommendedSubBatch).toBe("future_run_ice");
      expect(
        item.classifications.some(
          (classification) =>
            classification.classification ===
              "future_run_descriptor_followup" ||
            classification.classification.startsWith("future_run_requires_") ||
            classification.classification === "remaining_ice_context_required",
        ),
      ).toBe(true);
      expect(item.realSemanticConflicts).toEqual([]);
    }
  });

  it("recommends splitting Remote Upgrades from Future-run ICE follow-up work", () => {
    const report = readReport();
    expect(report.splitRecommendation).toEqual(
      expect.objectContaining({
        decision: "remote_upgrades_ready_future_ice_needs_followup",
        followupShape: "split_after_diff_review",
        remoteUpgrades: ["Crystal Palace Station Grid", "Red Herrings"],
        futureRunIce: ["Tutor", "Virizz", "Viral 15"],
      }),
    );
  });

  it("does not emit hidden-info fields", () => {
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

function card(report: BatchThreeDiffReviewReport, title: string) {
  const found = report.cards.find((item) => item.title === title);
  if (!found) throw new Error(`Missing card ${title}`);
  return found;
}

function runDiffReviewJson(): BatchThreeDiffReviewReport {
  return JSON.parse(
    execFileSync(
      "node",
      ["scripts/check-ai-generated-fact-batch3-diff-review.mjs", "--json"],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    ),
  ) as BatchThreeDiffReviewReport;
}

function readReport(): BatchThreeDiffReviewReport {
  return JSON.parse(
    fs.readFileSync(reportPath, "utf8"),
  ) as BatchThreeDiffReviewReport;
}
