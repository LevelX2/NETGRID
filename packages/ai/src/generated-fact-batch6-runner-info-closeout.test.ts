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
  "docs/reviews/ai/aufgabe-017-runner-info-central-pressure-closeout-report-2026-05-25.json",
);

type BatchSixCloseoutReport = {
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
    successfulRunContextInfos: Array<{ kind: string; rule: string }>;
    accessContextInfos: Array<{ kind: string; rule: string }>;
    hiddenZoneContextInfos: Array<{ kind: string; rule: string }>;
    centralPressureInfos: Array<{ kind: string; rule: string }>;
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

describe("generated fact Batch-6 runner info closeout", () => {
  it("is deterministic against the committed report", () => {
    const first = runCloseoutJson();
    const second = runCloseoutJson();
    expect(first).toEqual(second);
    expect(first).toEqual(readReport());
  });

  it("selects the runner info batch with explicit excludes", () => {
    const report = readReport();
    expect(report.taskId).toBe("Aufgabe 017");
    expect(report.candidateCardCount).toBe(17);
    expect(report.includedCardCount).toBe(13);
    expect(report.excludedCardCount).toBe(4);
    expect(report.excludedCards.map((card) => card.title).sort()).toEqual([
      "Cockroach",
      "False Echo",
      "Speed Trap",
      "Startup Immolator",
    ]);
    expect(
      report.excludedCards.every((card) => card.excludedReason.length > 20),
    ).toBe(true);
  });

  it("keeps included cards ready read-only with no conflicts or gaps", () => {
    const report = readReport();
    expect(report.confirmedGeneratedFactCount).toBe(27);
    expect(report.previewAddedFactCount).toBe(12);
    expect(report.hardErrorCount).toBe(0);
    expect(report.realSemanticConflictCount).toBe(0);
    expect(report.normalizedDifferenceCount).toBe(29);
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
        (card) => card.readiness === "ready_read_only_with_access_context",
      ),
    ).toBe(true);
  });

  it("keeps access replacement, multiaccess and hidden-zone info separated", () => {
    const report = readReport();
    expect(card(report, "R&D-Protocol Files").generatedFactsConfirmed).toEqual(
      expect.arrayContaining([
        "effect:access_replacement",
        "effect:topdeck_info",
        "condition:requires_successful_run",
      ]),
    );
    expect(
      card(report, "Microtech AI Interface").generatedFactsConfirmed,
    ).toEqual(
      expect.arrayContaining([
        "effect:topdeck_info",
        "effect:zone_shuffle",
        "condition:requires_accessed_card",
      ]),
    );
    expect(
      card(report, "Executive Wiretaps").generatedFactsConfirmed,
    ).toContain("effect:multiaccess");
    expect(
      card(report, "Custodial Position").generatedFactsConfirmed,
    ).toContain("effect:multiaccess");
    expect(
      card(report, "Edited Shipping Manifests").generatedFactsConfirmed,
    ).toEqual(
      expect.arrayContaining([
        "effect:access_replacement",
        "effect:economy",
        "effect:tag",
      ]),
    );
  });

  it("keeps HQ and expose information context-gated", () => {
    const report = readReport();
    expect(
      card(report, "Expert Schedule Analyzer").generatedFactsConfirmed,
    ).toContain("effect:hq_info");
    expect(card(report, "Boardwalk").generatedFactsConfirmed).toContain(
      "effect:hq_info",
    );
    expect(card(report, "I Spy").generatedFactsConfirmed).toContain(
      "effect:expose_info",
    );
    expect(card(report, "Mouse").generatedFactsConfirmed).toContain(
      "effect:expose_info",
    );
    expect(card(report, "SeeYa").generatedFactsConfirmed).toContain(
      "effect:expose_info",
    );
    expect(card(report, "Smarteye").generatedFactsConfirmed).toEqual(
      expect.arrayContaining([
        "effect:expose_info",
        "condition:requires_during_run",
      ]),
    );
  });

  it("does not emit hidden-info/runtime fields and recommends Corp ICE next", () => {
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
        recommendedTaskId: "Aufgabe 018",
        batchName: "corp_ice_longtail_future_trace_damage",
      }),
    );
    expect(report.nextBatchRecommendation.candidateCards).toContain(
      "Data Raven",
    );
  });
});

function card(report: BatchSixCloseoutReport, title: string) {
  const found = report.includedCards.find((item) => item.title === title);
  if (!found) throw new Error(`Missing card ${title}`);
  return found;
}

function runCloseoutJson(): BatchSixCloseoutReport {
  return JSON.parse(
    execFileSync(
      "node",
      [
        "scripts/check-ai-generated-fact-batch6-runner-info-closeout.mjs",
        "--json",
      ],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    ),
  ) as BatchSixCloseoutReport;
}

function readReport(): BatchSixCloseoutReport {
  return JSON.parse(
    fs.readFileSync(reportPath, "utf8"),
  ) as BatchSixCloseoutReport;
}
