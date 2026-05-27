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
  "docs/reviews/ai/aufgabe-018-corp-ice-longtail-closeout-report-2026-05-25.json",
);

type BatchSevenCloseoutReport = {
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
    previewAdds: string[];
    normalizedDifferences: Array<{ classification: string; rule: string }>;
    encounterContextInfos: Array<{ kind: string; rule: string }>;
    traceSuccessContextInfos: Array<{ kind: string; rule: string }>;
    runpathContextInfos: Array<{ kind: string; rule: string }>;
    preventionContextInfos: Array<{ kind: string; rule: string }>;
    targetSelectionContextInfos: Array<{ kind: string; rule: string }>;
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

describe("generated fact Batch-7 Corp ICE closeout", () => {
  it("is deterministic against the committed report", () => {
    const first = runCloseoutJson();
    const second = runCloseoutJson();
    expect(first).toEqual(second);
    expect(first).toEqual(readReport());
  });

  it("selects a large Corp ICE batch with explicit optional excludes", () => {
    const report = readReport();
    expect(report.taskId).toBe("Aufgabe 018");
    expect(report.candidateCardCount).toBe(44);
    expect(report.includedCardCount).toBe(24);
    expect(report.excludedCardCount).toBe(20);
    expect(
      report.excludedCards.every((card) => card.excludedReason.length > 30),
    ).toBe(true);
    expect(report.excludedCards.map((card) => card.title)).toContain(
      "Wall of Ice",
    );
  });

  it("keeps included cards ready read-only with no conflicts or gaps", () => {
    const report = readReport();
    expect(report.confirmedGeneratedFactCount).toBe(154);
    expect(report.previewAddedFactCount).toBe(119);
    expect(report.hardErrorCount).toBe(0);
    expect(report.realSemanticConflictCount).toBe(0);
    expect(report.normalizedDifferenceCount).toBe(248);
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
        (card) =>
          card.readiness ===
          "ready_read_only_with_encounter_trace_runpath_context",
      ),
    ).toBe(true);
  });

  it("keeps trace payoffs trace-success gated", () => {
    const report = readReport();
    for (const title of [
      "Fetch 4.0.1",
      "Hunter",
      "Data Raven",
      "Cinderella",
      "Homewrecker™",
      "Pocket Virtual Reality",
    ]) {
      expect(card(report, title).generatedFactsConfirmed).toContain(
        "condition:requires_trace_success",
      );
      expect(
        card(report, title).traceSuccessContextInfos.length,
      ).toBeGreaterThan(0);
    }
  });

  it("keeps damage, trash and future encounter effects context-gated", () => {
    const report = readReport();
    expect(card(report, "Bolter Cluster").generatedFactsConfirmed).toEqual(
      expect.arrayContaining([
        "effect:damage",
        "effect:future_encounter_effect",
        "condition:requires_later_encounter",
        "condition:requires_remaining_ice",
      ]),
    );
    expect(card(report, "Fatal Attractor").runpathContextInfos.length).toBe(1);
    expect(card(report, "Banpei").generatedFactsConfirmed).toContain(
      "effect:program_trash",
    );
    expect(card(report, "Cinderella").generatedFactsConfirmed).toContain(
      "effect:hardware_trash",
    );
    expect(card(report, "Mastiff").preventionContextInfos.length).toBe(1);
  });

  it("keeps ETR, run locks and persistent counters non-runtime", () => {
    const report = readReport();
    expect(card(report, "Asp").generatedFactsConfirmed).toEqual(
      expect.arrayContaining(["effect:etr", "effect:run_lock"]),
    );
    expect(card(report, "Jack Attack").generatedFactsConfirmed).toContain(
      "effect:no_jack_out",
    );
    expect(card(report, "Data Raven").generatedFactsConfirmed).toContain(
      "effect:persistent_counter_effect",
    );
    expect(card(report, "Cerberus").generatedFactsConfirmed).toContain(
      "effect:persistent_counter_effect",
    );
    expect(card(report, "Mastiff").generatedFactsConfirmed).toContain(
      "effect:persistent_counter_effect",
    );
    expect(
      report.includedCards.some(
        (item) => item.effectiveRunQuoteContextInfos.length > 0,
      ),
    ).toBe(true);
  });

  it("does not emit hidden-info/runtime fields and recommends Corp economy next", () => {
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
      "current_counter_state",
    ]) {
      expect(serialized).not.toContain(`"${blockedField}"`);
    }
    expect(report.nextBatchRecommendation).toEqual(
      expect.objectContaining({
        recommendedTaskId: "Aufgabe 019",
        batchName: "corp_economy_operation_advance_burst_longtail",
      }),
    );
    expect(report.nextBatchRecommendation.candidateCards).toContain(
      "Project Consultants",
    );
  });
});

function card(report: BatchSevenCloseoutReport, title: string) {
  const found = report.includedCards.find((item) => item.title === title);
  if (!found) throw new Error(`Missing card ${title}`);
  return found;
}

function runCloseoutJson(): BatchSevenCloseoutReport {
  return JSON.parse(
    execFileSync(
      "node",
      [
        "scripts/check-ai-generated-fact-batch7-corp-ice-closeout.mjs",
        "--json",
      ],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    ),
  ) as BatchSevenCloseoutReport;
}

function readReport(): BatchSevenCloseoutReport {
  return JSON.parse(
    fs.readFileSync(reportPath, "utf8"),
  ) as BatchSevenCloseoutReport;
}
