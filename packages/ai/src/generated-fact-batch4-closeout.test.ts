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
  "docs/reviews/ai/aufgabe-015-corp-remote-upgrades-regions-closeout-report-2026-05-25.json",
);

type BatchFourCloseoutReport = {
  taskId: string;
  candidateCardCount: number;
  includedCardCount: number;
  excludedCardCount: number;
  confirmedGeneratedFactCount: number;
  previewAddedFactCount: number;
  hardErrorCount: number;
  realSemanticConflictCount: number;
  normalizedDifferenceCount: number;
  remainingDifferenceCount: number;
  boardContextInfoCount: number;
  descriptorFollowupCount: number;
  readiness: string;
  includedCards: Array<{
    title: string;
    subBatch: string;
    activeHintFound: boolean;
    aiSupportStatus: string;
    generatedFactsConfirmed: string[];
    normalizedDifferences: Array<{ classification: string; rule: string }>;
    boardContextInfos: Array<{ kind: string; rule: string }>;
    descriptorFollowups: string[];
    readiness: string;
  }>;
  excludedCards: Array<{ title: string; excludedReason: string }>;
  nextBatchRecommendation: {
    recommendedTaskId: string;
    batchName: string;
    candidateCards: string[];
  };
};

describe("generated fact Batch-4 Corp remote closeout", () => {
  it("is deterministic against the committed report", () => {
    const first = runCloseoutJson();
    const second = runCloseoutJson();
    expect(first).toEqual(second);
    expect(first).toEqual(readReport());
  });

  it("selects a larger Corp remote batch with explicit excludes", () => {
    const report = readReport();
    expect(report.taskId).toBe("Aufgabe 015");
    expect(report.candidateCardCount).toBe(10);
    expect(report.includedCardCount).toBe(8);
    expect(report.excludedCardCount).toBe(2);
    expect(report.excludedCards.map((card) => card.title).sort()).toEqual([
      "Black Ice Quality Assurance",
      "Restrictive Net Zoning",
    ]);
    expect(
      report.excludedCards.every((card) => card.excludedReason.length > 20),
    ).toBe(true);
  });

  it("keeps included cards ready read-only with no conflicts or gaps", () => {
    const report = readReport();
    expect(report.confirmedGeneratedFactCount).toBe(27);
    expect(report.previewAddedFactCount).toBe(0);
    expect(report.hardErrorCount).toBe(0);
    expect(report.realSemanticConflictCount).toBe(0);
    expect(report.normalizedDifferenceCount).toBe(5);
    expect(report.remainingDifferenceCount).toBe(0);
    expect(report.descriptorFollowupCount).toBe(0);
    expect(report.readiness).toBe("ready_read_only_split_subbatches");
    expect(report.includedCards.every((card) => card.activeHintFound)).toBe(
      true,
    );
    expect(
      report.includedCards.every(
        (card) => card.aiSupportStatus === "ai_supported",
      ),
    ).toBe(true);
  });

  it("keeps remote roles out of economy and preserves context guardrails", () => {
    const report = readReport();
    for (const card of report.includedCards) {
      expect(card.generatedFactsConfirmed).not.toContain("effect:economy");
      expect(card.boardContextInfos.length, card.title).toBeGreaterThan(0);
      expect(card.readiness).toBe("ready_read_only_with_board_context");
    }
    expect(card(report, "Namatoki Plaza").generatedFactsConfirmed).toContain(
      "remoteRole:remote_capacity",
    );
    expect(card(report, "Chicago Branch").generatedFactsConfirmed).toContain(
      "effect:score_acceleration",
    );
  });

  it("normalizes only comparator differences and recommends breaker longtail next", () => {
    const report = readReport();
    expect(
      report.includedCards.flatMap((card) =>
        card.normalizedDifferences.map((difference) => difference.rule),
      ),
    ).toEqual(
      expect.arrayContaining([
        "remote_scoring_protection_normalization",
        "ice_modifier_context_normalization",
        "score_acceleration_context_normalization",
        "cost_profile_split_normalization",
      ]),
    );
    expect(report.nextBatchRecommendation).toEqual(
      expect.objectContaining({
        recommendedTaskId: "Aufgabe 016",
        batchName: "breaker_icebreaker_longtail",
      }),
    );
    expect(report.nextBatchRecommendation.candidateCards).toContain("Worm");
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
      "actionId",
    ]) {
      expect(serialized).not.toContain(`"${blockedField}"`);
    }
  });
});

function card(report: BatchFourCloseoutReport, title: string) {
  const found = report.includedCards.find((item) => item.title === title);
  if (!found) throw new Error(`Missing card ${title}`);
  return found;
}

function runCloseoutJson(): BatchFourCloseoutReport {
  return JSON.parse(
    execFileSync(
      "node",
      ["scripts/check-ai-generated-fact-batch4-closeout.mjs", "--json"],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    ),
  ) as BatchFourCloseoutReport;
}

function readReport(): BatchFourCloseoutReport {
  return JSON.parse(
    fs.readFileSync(reportPath, "utf8"),
  ) as BatchFourCloseoutReport;
}
