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
  "docs/reviews/ai/aufgabe-014-batch3-closeout-report-2026-05-25.json",
);

type BatchThreeCloseoutReport = {
  taskId: string;
  batchCardCount: number;
  confirmedGeneratedFactCount: number;
  previewAddedFactCount: number;
  hardErrorCount: number;
  conflictCount: number;
  realSemanticConflictCount: number;
  normalizedDifferenceCount: number;
  remainingDifferenceCount: number;
  boardContextInfoCount: number;
  runpathContextInfoCount: number;
  descriptorContextInfoCount: number;
  batchThreeStatus: string;
  readinessCounts: Record<string, number>;
  splitDecision: {
    decision: string;
    remoteUpgradesStatus: string;
    futureRunIceStatus: string;
    remoteUpgrades: string[];
    futureRunIce: string[];
  };
  cards: Array<{
    title: string;
    subBatch: string;
    readiness: string;
    normalizedDifferences: Array<{ classification: string; fact: string }>;
    boardContextInfos: unknown[];
    runpathContextInfos: unknown[];
    descriptorContextInfos: unknown[];
    remainingIssues: unknown[];
  }>;
  nextBatchRecommendation: {
    recommendedTaskId: string;
    batchName: string;
    candidateCards: string[];
  };
};

describe("generated fact Batch-3 closeout", () => {
  it("is deterministic against the committed report", () => {
    const first = runCloseoutJson();
    const second = runCloseoutJson();
    expect(first).toEqual(second);
    expect(first).toEqual(readReport());
  });

  it("closes Batch 3 as split ready read-only subbatches", () => {
    const report = readReport();
    expect(report.taskId).toBe("Aufgabe 014");
    expect(report.batchCardCount).toBe(5);
    expect(report.confirmedGeneratedFactCount).toBe(15);
    expect(report.previewAddedFactCount).toBe(0);
    expect(report.hardErrorCount).toBe(0);
    expect(report.conflictCount).toBe(0);
    expect(report.realSemanticConflictCount).toBe(0);
    expect(report.normalizedDifferenceCount).toBe(13);
    expect(report.remainingDifferenceCount).toBe(0);
    expect(report.batchThreeStatus).toBe("split_ready_subbatches_read_only");
    expect(report.readinessCounts).toEqual({
      ready_read_only: 2,
      ready_read_only_with_runpath_context: 3,
    });
  });

  it("keeps Remote Upgrades ready without changing their semantics", () => {
    const report = readReport();
    expect(report.splitDecision).toEqual(
      expect.objectContaining({
        decision: "split_ready_subbatches",
        remoteUpgradesStatus: "ready_read_only",
        remoteUpgrades: ["Crystal Palace Station Grid", "Red Herrings"],
      }),
    );
    expect(
      card(report, "Crystal Palace Station Grid").normalizedDifferences.some(
        (difference) =>
          difference.classification === "remote_role_equivalent_run_tax",
      ),
    ).toBe(true);
    expect(
      card(report, "Red Herrings").normalizedDifferences.some(
        (difference) =>
          difference.classification ===
          "remote_role_equivalent_agenda_steal_tax",
      ),
    ).toBe(true);
  });

  it("keeps Future-run ICE ready only with runpath context", () => {
    const report = readReport();
    expect(report.splitDecision).toEqual(
      expect.objectContaining({
        futureRunIceStatus: "ready_read_only_with_runpath_context",
        futureRunIce: ["Tutor", "Virizz", "Viral 15"],
      }),
    );
    for (const title of ["Tutor", "Virizz", "Viral 15"]) {
      const item = card(report, title);
      expect(item.subBatch).toBe("future_run_ice");
      expect(item.readiness).toBe("ready_read_only_with_runpath_context");
      expect(item.runpathContextInfos.length).toBeGreaterThan(0);
    }
    expect(report.runpathContextInfoCount).toBe(10);
    expect(report.descriptorContextInfoCount).toBe(9);
  });

  it("recommends the Corp remote upgrades and regions longtail next", () => {
    const report = readReport();
    expect(report.nextBatchRecommendation).toEqual(
      expect.objectContaining({
        recommendedTaskId: "Aufgabe 015",
        batchName: "corp_remote_upgrades_regions_longtail",
      }),
    );
    expect(report.nextBatchRecommendation.candidateCards).toContain(
      "Rio de Janeiro City Grid",
    );
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

function card(report: BatchThreeCloseoutReport, title: string) {
  const found = report.cards.find((item) => item.title === title);
  if (!found) throw new Error(`Missing card ${title}`);
  return found;
}

function runCloseoutJson(): BatchThreeCloseoutReport {
  return JSON.parse(
    execFileSync(
      "node",
      ["scripts/check-ai-generated-fact-batch3-closeout.mjs", "--json"],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    ),
  ) as BatchThreeCloseoutReport;
}

function readReport(): BatchThreeCloseoutReport {
  return JSON.parse(
    fs.readFileSync(reportPath, "utf8"),
  ) as BatchThreeCloseoutReport;
}
