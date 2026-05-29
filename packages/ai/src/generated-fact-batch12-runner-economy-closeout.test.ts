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
  "docs/reviews/ai/aufgabe-026-runner-economy-hardware-closeout-report-2026-05-25.json",
);

const activeHintsPath = path.join(
  repoRoot,
  "data/ai/ai-card-hints-active.json",
);

type BatchTwelveReport = {
  taskId: string;
  batch: string;
  candidateCardCount: number;
  includedCardCount: number;
  excludedCardCount: number;
  hardErrorCount: number;
  realSemanticConflictCount: number;
  readiness: string;
  previewAddedFactCount: number;
  normalizedDifferenceCount: number;
  remainingDifferenceCount: number;
  descriptorFollowupCount: number;
  includedCards: Array<{
    cardId: string;
    title: string;
    subBatch: string;
    activeHintFound: boolean;
    catalogCardFound: boolean;
    implementationFound: boolean;
    aiSupportStatus: string;
    generatedFactsConfirmed: string[];
    previewAdds: string[];
    paymentContextInfos: Array<{ kind: string; rule: string }>;
    actionContextInfos: Array<{ kind: string; rule: string }>;
    memoryContextInfos: Array<{ kind: string; rule: string }>;
    handSizeContextInfos: Array<{ kind: string; rule: string }>;
    hiddenZoneContextInfos: Array<{ kind: string; rule: string }>;
    delayedPenaltyContextInfos: Array<{ kind: string; rule: string }>;
    descriptorFollowups: string[];
    readiness: string;
  }>;
  excludedCards: Array<{ title: string; excludedReason: string }>;
  consumerReadiness: {
    runnerEconomyConsumerReady: boolean;
    runnerMemoryConsumerReady: boolean;
    runnerHandSizeConsumerReady: boolean;
    activeRuntimeConsumer: boolean;
    recommendedNextDiagnostic: string;
  };
  nextBatchRecommendation: {
    recommendedTaskId: string;
    batchName: string;
  };
};

describe("generated fact Batch-12 Runner economy/hardware closeout", () => {
  it("is deterministic against the committed report", () => {
    const first = runCloseoutJson();
    const second = runCloseoutJson();
    expect(first).toEqual(second);
    expect(first).toEqual(readReport());
  });

  it("selects the Runner economy/resource/hardware batch with justified excludes", () => {
    const report = readReport();
    expect(report.taskId).toBe("Aufgabe 026");
    expect(report.batch).toBe(
      "batch_12_runner_economy_resource_hardware_longtail",
    );
    expect(report.includedCardCount).toBe(18);
    expect(report.excludedCardCount).toBeGreaterThanOrEqual(14);
    expect(report.includedCards.map((item) => item.title)).toEqual(
      expect.arrayContaining([
        "Short-Term Contract",
        "Loan from Chiba",
        "MRAM Chip",
        "Militech MRAM Chip",
        "The Shell Traders",
        "Broker",
        "Microtech Backup Drive",
      ]),
    );
    expect(report.excludedCards.map((item) => item.title)).toEqual(
      expect.arrayContaining([
        "Bodyweight Synthetic Blood",
        "Nasuko Cycle",
        "Fall Guy",
        "Crash Everett, Inventive Fixer",
        "All-Hands",
      ]),
    );
    expect(
      report.excludedCards.find((item) => item.title === "All-Hands")
        ?.excludedReason,
    ).toContain("Proteus");
  });

  it("keeps the batch read-only with no conflicts or runtime mutation fields", () => {
    const report = readReport();
    expect(report.hardErrorCount).toBe(0);
    expect(report.realSemanticConflictCount).toBe(0);
    expect(report.remainingDifferenceCount).toBe(0);
    expect(report.readiness).toBe("ready_read_only_split_subbatches");
    expect(report.includedCards.every((item) => item.activeHintFound)).toBe(
      true,
    );
    expect(report.includedCards.every((item) => item.catalogCardFound)).toBe(
      true,
    );
    expect(report.includedCards.every((item) => item.implementationFound)).toBe(
      true,
    );
    expect(
      report.includedCards.every(
        (item) => item.aiSupportStatus === "ai_supported",
      ),
    ).toBe(true);
    for (const card of report.includedCards) {
      expect(card.generatedFactsConfirmed.join(" ")).not.toMatch(
        /aiSupportStatus|legalActions|stateVersion|actionId|runnerGripCards|runnerStackOrder/,
      );
    }
    expect(fs.readFileSync(activeHintsPath, "utf8")).not.toContain(
      "batch_12_runner_economy_resource_hardware_longtail",
    );
  });

  it("keeps focus-card semantics explicit", () => {
    const report = readReport();
    expect(card(report, "Short-Term Contract").generatedFactsConfirmed).toEqual(
      expect.arrayContaining([
        "effect:finite_economy_pool",
        "effect:action_economy",
        "condition:requires_installed_resource",
      ]),
    );
    expect(
      card(report, "Short-Term Contract").generatedFactsConfirmed,
    ).not.toContain("effect:recurring_economy");

    expect(card(report, "Loan from Chiba").generatedFactsConfirmed).toEqual(
      expect.arrayContaining([
        "effect:economy",
        "effect:delayed_penalty",
        "condition:requires_start_of_turn",
      ]),
    );
    expect(
      card(report, "Loan from Chiba").delayedPenaltyContextInfos.length,
    ).toBe(1);

    for (const title of ["MRAM Chip", "Militech MRAM Chip"]) {
      expect(card(report, title).generatedFactsConfirmed).toContain(
        "effect:hand_size_modifier",
      );
      expect(card(report, title).generatedFactsConfirmed).not.toContain(
        "effect:memory",
      );
      expect(card(report, title).handSizeContextInfos.length).toBe(1);
    }
  });

  it("keeps hidden-zone, finite-pool and install-discount context from becoming legality", () => {
    const report = readReport();
    expect(card(report, "Organ Donor").generatedFactsConfirmed).toEqual(
      expect.arrayContaining([
        "effect:economy",
        "condition:requires_grip_card",
      ]),
    );
    expect(card(report, "Organ Donor").hiddenZoneContextInfos.length).toBe(1);

    expect(
      card(report, "Forgotten Backup Chip").generatedFactsConfirmed,
    ).toEqual(
      expect.arrayContaining([
        "effect:card_recovery",
        "effect:search",
        "condition:requires_heap_card",
      ]),
    );
    expect(
      card(report, "Mantis, Fixer-at-Large").generatedFactsConfirmed,
    ).toEqual(
      expect.arrayContaining([
        "effect:search",
        "condition:requires_stack_search",
      ]),
    );
    expect(card(report, "The Shell Traders").generatedFactsConfirmed).toEqual(
      expect.arrayContaining([
        "effect:install_discount",
        "condition:requires_installed_resource",
        "condition:requires_grip_card",
      ]),
    );
    expect(
      card(report, "The Shell Traders").generatedFactsConfirmed,
    ).not.toContain("effect:install");
  });

  it("recommends the Runner Economy / Setup Consumer Diagnostic Slice", () => {
    const report = readReport();
    expect(report.consumerReadiness.runnerEconomyConsumerReady).toBe(true);
    expect(report.consumerReadiness.runnerMemoryConsumerReady).toBe(true);
    expect(report.consumerReadiness.runnerHandSizeConsumerReady).toBe(true);
    expect(report.consumerReadiness.activeRuntimeConsumer).toBe(false);
    expect(report.nextBatchRecommendation.recommendedTaskId).toBe(
      "Aufgabe 027",
    );
    expect(report.nextBatchRecommendation.batchName).toBe(
      "runner_economy_setup_consumer_diagnostic_slice",
    );
    expect(report.consumerReadiness.recommendedNextDiagnostic).toContain(
      "Runner Economy / Setup Consumer Diagnostic Slice",
    );
  });
});

function readReport(): BatchTwelveReport {
  return JSON.parse(fs.readFileSync(reportPath, "utf8"));
}

function runCloseoutJson(): BatchTwelveReport {
  return JSON.parse(
    execFileSync(
      process.execPath,
      [
        path.join(
          repoRoot,
          "scripts/check-ai-generated-fact-batch12-runner-economy-closeout.mjs",
        ),
        "--json",
      ],
      { cwd: repoRoot, encoding: "utf8" },
    ),
  );
}

function card(report: BatchTwelveReport, title: string) {
  const found = report.includedCards.find((item) => item.title === title);
  if (!found) throw new Error(`Missing included card: ${title}`);
  return found;
}
