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
  "docs/reviews/ai/aufgabe-007-batch1-generated-facts-rollup-report-2026-05-25.json",
);

type BatchOneRollupReport = {
  taskId: string;
  batchCardCount: number;
  confirmedGeneratedFactCount: number;
  hardErrorCount: number;
  conflictCount: number;
  realSemanticConflictCount: number;
  remainingShapeDifferenceCount: number;
  monolithOnlyMechanicalFactCount: number;
  deriverFollowupCandidateCount: number;
  descriptorGapRemainingCount: number;
  humanReviewCandidateCount: number;
  futureMigrationReadyCardCount: number;
  batchOneStatus: string;
  readinessCounts: Record<string, number>;
  boardContextRules: unknown[];
  cards: Array<{
    cardId: string;
    futureMigrationReady: boolean;
    readiness: string;
    remainingIssues: string[];
  }>;
  nextBatchRecommendation: {
    recommendedTaskId: string;
    batchName: string;
    candidateCards: string[];
  };
};

describe("generated fact Batch-1 rollup", () => {
  it("is deterministic against the committed report", () => {
    const first = runRollupJson();
    const second = runRollupJson();
    expect(first).toEqual(second);
    expect(first).toEqual(readReport());
  });

  it("marks Batch 1 conflict-free and gap-free after normalization and derivation", () => {
    const report = readReport();
    expect(report.taskId).toBe("Aufgabe 007");
    expect(report.batchCardCount).toBe(11);
    expect(report.confirmedGeneratedFactCount).toBe(40);
    expect(report.hardErrorCount).toBe(0);
    expect(report.conflictCount).toBe(0);
    expect(report.realSemanticConflictCount).toBe(0);
    expect(report.remainingShapeDifferenceCount).toBe(0);
    expect(report.monolithOnlyMechanicalFactCount).toBe(0);
    expect(report.deriverFollowupCandidateCount).toBe(0);
    expect(report.descriptorGapRemainingCount).toBe(0);
    expect(report.humanReviewCandidateCount).toBe(0);
    expect(report.batchOneStatus).toBe("future_migration_ready_read_only");
  });

  it("keeps all Batch-1 cards future-ready with board context called out", () => {
    const report = readReport();
    expect(report.futureMigrationReadyCardCount).toBe(11);
    expect(report.readinessCounts).toEqual({
      ready_but_board_context_required: 11,
    });
    expect(report.cards.every((card) => card.futureMigrationReady)).toBe(true);
    expect(
      report.cards.every((card) => card.remainingIssues.length === 0),
    ).toBe(true);
    expect(
      report.cards.every(
        (card) => card.readiness === "ready_but_board_context_required",
      ),
    ).toBe(true);
    expect(report.boardContextRules.length).toBe(4);
  });

  it("recommends the breaker target and trash-credit batch next", () => {
    const report = readReport();
    expect(report.nextBatchRecommendation).toEqual(
      expect.objectContaining({
        recommendedTaskId: "Aufgabe 008",
        batchName: "batch_2_breaker_target_trash_credit",
      }),
    );
    expect(report.nextBatchRecommendation.candidateCards).toEqual([
      "onr_v1_037_japanese-water-torture",
      "onr_v1_039_krash",
      "onr_v1_043_mystery-box",
      "onr_v1_048_poltergeist",
      "onr_v1_057_scatter-shot",
      "onr_v1_059_self-modifying-code",
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

function runRollupJson(): BatchOneRollupReport {
  return JSON.parse(
    execFileSync(
      "node",
      ["scripts/check-ai-generated-fact-batch1-rollup.mjs", "--json"],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    ),
  ) as BatchOneRollupReport;
}

function readReport(): BatchOneRollupReport {
  return JSON.parse(
    fs.readFileSync(reportPath, "utf8"),
  ) as BatchOneRollupReport;
}
