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
  "docs/reviews/ai/aufgabe-016-breaker-icebreaker-longtail-closeout-report-2026-05-25.json",
);

type BatchFiveCloseoutReport = {
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
  descriptorFollowupCount: number;
  readiness: string;
  includedCards: Array<{
    title: string;
    subBatch: string;
    activeHintFound: boolean;
    aiSupportStatus: string;
    generatedFactsConfirmed: string[];
    normalizedDifferences: Array<{ classification: string; rule: string }>;
    encounterContextInfos: Array<{ kind: string; rule: string }>;
    paymentContextInfos: Array<{ kind: string; rule: string }>;
    effectiveRunQuoteContextInfos: Array<{ kind: string; rule: string }>;
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

describe("generated fact Batch-5 breaker closeout", () => {
  it("is deterministic against the committed report", () => {
    const first = runCloseoutJson();
    const second = runCloseoutJson();
    expect(first).toEqual(second);
    expect(first).toEqual(readReport());
  });

  it("selects a large breaker longtail batch with explicit optional excludes", () => {
    const report = readReport();
    expect(report.taskId).toBe("Aufgabe 016");
    expect(report.candidateCardCount).toBe(26);
    expect(report.includedCardCount).toBe(18);
    expect(report.excludedCardCount).toBe(8);
    expect(report.excludedCards.map((card) => card.title).sort()).toEqual([
      "Dogcatcher",
      "Dwarf",
      "Flak",
      "Grubb",
      "Hammer",
      "Jackhammer",
      "Ramming Piston",
      "Snowball",
    ]);
    expect(
      report.excludedCards.every((card) => card.excludedReason.length > 20),
    ).toBe(true);
  });

  it("keeps included breakers ready read-only with no conflicts or gaps", () => {
    const report = readReport();
    expect(report.confirmedGeneratedFactCount).toBe(61);
    expect(report.previewAddedFactCount).toBe(0);
    expect(report.hardErrorCount).toBe(0);
    expect(report.realSemanticConflictCount).toBe(0);
    expect(report.normalizedDifferenceCount).toBe(17);
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
    expect(
      report.includedCards.every(
        (card) => card.readiness === "ready_read_only_with_encounter_context",
      ),
    ).toBe(true);
  });

  it("preserves breaker coverage, special coverage and side-effect guardrails", () => {
    const report = readReport();
    expect(
      card(report, "Bartmoss Memorial Icebreaker").generatedFactsConfirmed,
    ).toContain("breakerCoverage:universal");
    expect(card(report, "Blink").generatedFactsConfirmed).toContain(
      "breakerCoverage:universal",
    );
    expect(card(report, "Replicator").generatedFactsConfirmed).toContain(
      "breakerCoverage:trace",
    );
    expect(card(report, "Reflector").generatedFactsConfirmed).toContain(
      "breakerCoverage:ap",
    );
    expect(card(report, "Pile Driver").generatedFactsConfirmed).toContain(
      "breakerSideEffect:stealth_loss",
    );
    expect(card(report, "Dropp").generatedFactsConfirmed).toContain(
      "breakerSideEffect:ends_run_after_use",
    );
    expect(card(report, "AI Boon").generatedFactsConfirmed).toContain(
      "breakerSideEffect:random_failure",
    );
  });

  it("normalizes only comparator differences and keeps run quote context visible", () => {
    const report = readReport();
    const normalizedRules = report.includedCards.flatMap((card) =>
      card.normalizedDifferences.map((difference) => difference.rule),
    );
    expect(normalizedRules).toEqual(
      expect.arrayContaining([
        "breaker_coverage_normalization",
        "noisy_stealth_loss_normalization",
        "random_breaker_context_normalization",
        "run_ends_after_use_normalization",
        "special_subtype_breaker_normalization",
      ]),
    );
    for (const included of report.includedCards) {
      expect(
        included.encounterContextInfos.length,
        included.title,
      ).toBeGreaterThan(0);
      expect(
        included.effectiveRunQuoteContextInfos.length,
        included.title,
      ).toBeGreaterThan(0);
    }
  });

  it("keeps runtime fields out and recommends central pressure next", () => {
    const report = readReport();
    const serialized = JSON.stringify(report);
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
    expect(report.nextBatchRecommendation).toEqual(
      expect.objectContaining({
        recommendedTaskId: "Aufgabe 017",
        batchName: "runner_info_central_pressure_access_replacement",
      }),
    );
    expect(report.nextBatchRecommendation.candidateCards).toContain(
      "R&D-Protocol Files",
    );
  });
});

function card(report: BatchFiveCloseoutReport, title: string) {
  const found = report.includedCards.find((item) => item.title === title);
  if (!found) throw new Error(`Missing card ${title}`);
  return found;
}

function runCloseoutJson(): BatchFiveCloseoutReport {
  return JSON.parse(
    execFileSync(
      "node",
      ["scripts/check-ai-generated-fact-batch5-breaker-closeout.mjs", "--json"],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    ),
  ) as BatchFiveCloseoutReport;
}

function readReport(): BatchFiveCloseoutReport {
  return JSON.parse(
    fs.readFileSync(reportPath, "utf8"),
  ) as BatchFiveCloseoutReport;
}
