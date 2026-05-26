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
  "docs/reviews/ai/aufgabe-011-batch2-generated-facts-rollup-report-2026-05-25.json",
);

type BatchTwoRollupReport = {
  taskId: string;
  batchCardCount: number;
  confirmedGeneratedFactCount: number;
  previewAddedFactCount: number;
  hardErrorCount: number;
  conflictCount: number;
  realSemanticConflictCount: number;
  remainingShapeDifferenceCount: number;
  remainingTargetProfileDifferenceCount: number;
  remainingTrashCreditTargetDifferenceCount: number;
  remainingCostProfileDifferenceCount: number;
  deriverFollowupCandidateCount: number;
  descriptorGapRemainingCount: number;
  humanReviewCandidateCount: number;
  futureMigrationReadyCardCount: number;
  boardContextInfoCount: number;
  batchTwoStatus: string;
  readinessCounts: Record<string, number>;
  boardContextRules: unknown[];
  cards: Array<{
    cardId: string;
    title: string;
    futureMigrationReady: boolean;
    readiness: string;
    remainingIssues: unknown[];
    previewAddedFacts: string[];
    boardContextRequired: string[];
    guardrails: string[];
  }>;
  nextBatchRecommendation: {
    recommendedTaskId: string;
    batchName: string;
    candidateCards: string[];
  };
};

describe("generated fact Batch-2 rollup", () => {
  it("is deterministic against the committed report", () => {
    const first = runRollupJson();
    const second = runRollupJson();
    expect(first).toEqual(second);
    expect(first).toEqual(readReport());
  });

  it("marks Batch 2 conflict-free and gap-free after normalization", () => {
    const report = readReport();
    expect(report.taskId).toBe("Aufgabe 011");
    expect(report.batchCardCount).toBe(6);
    expect(report.confirmedGeneratedFactCount).toBe(11);
    expect(report.previewAddedFactCount).toBe(3);
    expect(report.hardErrorCount).toBe(0);
    expect(report.conflictCount).toBe(0);
    expect(report.realSemanticConflictCount).toBe(0);
    expect(report.remainingShapeDifferenceCount).toBe(0);
    expect(report.remainingTargetProfileDifferenceCount).toBe(0);
    expect(report.remainingTrashCreditTargetDifferenceCount).toBe(0);
    expect(report.remainingCostProfileDifferenceCount).toBe(0);
    expect(report.deriverFollowupCandidateCount).toBe(0);
    expect(report.descriptorGapRemainingCount).toBe(0);
    expect(report.humanReviewCandidateCount).toBe(0);
    expect(report.batchTwoStatus).toBe("future_migration_ready_read_only");
  });

  it("keeps all Batch-2 cards future-ready with board context called out where needed", () => {
    const report = readReport();
    expect(report.futureMigrationReadyCardCount).toBe(6);
    expect(report.readinessCounts).toEqual({
      ready_but_board_context_required: 2,
      ready_for_future_generated_migration: 4,
    });
    expect(report.cards.every((card) => card.futureMigrationReady)).toBe(true);
    expect(
      report.cards.every((card) => card.remainingIssues.length === 0),
    ).toBe(true);
    expect(report.boardContextInfoCount).toBe(7);
    expect(report.boardContextRules.length).toBe(5);
  });

  it("preserves Batch-2 guardrails for search, install cost and trash-credit targets", () => {
    const report = readReport();
    expect(cardByTitle(report, "Self-Modifying Code").guardrails).toContain(
      "install_discount_not_generated",
    );
    expect(
      cardByTitle(report, "Self-Modifying Code").previewAddedFacts,
    ).toEqual(["targetProfile"]);
    expect(cardByTitle(report, "Mystery Box").guardrails).toContain(
      "free_install_cost_retained",
    );
    expect(cardByTitle(report, "Mystery Box").previewAddedFacts).toEqual([
      "effect:topdeck_info",
      "targetProfile",
    ]);
    expect(cardByTitle(report, "Poltergeist").guardrails).toContain(
      "node_trash_credit_target_retained",
    );
    expect(cardByTitle(report, "Scatter Shot").guardrails).toContain(
      "upgrade_trash_credit_target_retained",
    );
  });

  it("recommends RemoteRole and future-run ICE as the next read-only batch", () => {
    const report = readReport();
    expect(report.nextBatchRecommendation).toEqual(
      expect.objectContaining({
        recommendedTaskId: "Aufgabe 012",
        batchName: "batch_3_remote_role_future_run_ice",
      }),
    );
    expect(report.nextBatchRecommendation.candidateCards).toEqual([
      "onr_v1_274_tutor",
      "onr_v1_277_virizz",
      "onr_v1_276_viral-15",
      "onr_v1_355_crystal-palace-station-grid",
      "onr_v1_366_red-herrings",
    ]);
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

function runRollupJson(): BatchTwoRollupReport {
  return JSON.parse(
    execFileSync(
      "node",
      ["scripts/check-ai-generated-fact-batch2-rollup.mjs", "--json"],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    ),
  ) as BatchTwoRollupReport;
}

function readReport(): BatchTwoRollupReport {
  return JSON.parse(
    fs.readFileSync(reportPath, "utf8"),
  ) as BatchTwoRollupReport;
}

function cardByTitle(report: BatchTwoRollupReport, title: string) {
  const card = report.cards.find((candidate) => candidate.title === title);
  if (!card) throw new Error(`Missing card in report: ${title}`);
  return card;
}
