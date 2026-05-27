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
  "docs/reviews/ai/aufgabe-019-corp-economy-advance-burst-closeout-report-2026-05-25.json",
);

type BatchEightCloseoutReport = {
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
    scoreContextInfos: Array<{ kind: string; rule: string }>;
    legalActionContextInfos: Array<{ kind: string; rule: string }>;
    hiddenZoneContextInfos: Array<{ kind: string; rule: string }>;
    variableAmountContextInfos: Array<{ kind: string; rule: string }>;
    boardContextInfos: Array<{ kind: string; rule: string }>;
    scoreConversionOverlayInfos: Array<{ kind: string; rule: string }>;
    descriptorFollowups: string[];
    remainingIssues: string[];
    readiness: string;
  }>;
  excludedCards: Array<{ title: string; excludedReason: string }>;
  nextBatchRecommendation: {
    recommendedTaskId: string;
    batchName: string;
    candidateCards: string[];
  };
};

describe("generated fact Batch-8 Corp economy closeout", () => {
  it("is deterministic against the committed report", () => {
    const first = runCloseoutJson();
    const second = runCloseoutJson();
    expect(first).toEqual(second);
    expect(first).toEqual(readReport());
  });

  it("selects the full Corp economy and score-conversion batch", () => {
    const report = readReport();
    expect(report.taskId).toBe("Aufgabe 019");
    expect(report.candidateCardCount).toBe(30);
    expect(report.includedCardCount).toBe(30);
    expect(report.excludedCardCount).toBe(0);
    expect(report.includedCards.map((item) => item.title)).toEqual(
      expect.arrayContaining([
        "Project Consultants",
        "Corporate Downsizing",
        "Security Purge",
        "AI Chief Financial Officer",
        "Political Coup",
      ]),
    );
  });

  it("keeps included cards ready read-only with no conflicts or gaps", () => {
    const report = readReport();
    expect(report.confirmedGeneratedFactCount).toBe(101);
    expect(report.previewAddedFactCount).toBe(84);
    expect(report.hardErrorCount).toBe(0);
    expect(report.realSemanticConflictCount).toBe(0);
    expect(report.normalizedDifferenceCount).toBe(199);
    expect(report.remainingDifferenceCount).toBe(0);
    expect(report.descriptorFollowupCount).toBe(0);
    expect(report.readiness).toBe("ready_read_only_split_subbatches");
    expect(report.includedCards.every((item) => item.activeHintFound)).toBe(
      true,
    );
    expect(
      report.includedCards.every(
        (item) => item.aiSupportStatus === "ai_supported",
      ),
    ).toBe(true);
    expect(
      report.includedCards.every(
        (item) =>
          item.readiness === "ready_read_only_with_score_legalaction_context",
      ),
    ).toBe(true);
  });

  it("keeps operation economy and advance burst legal-action gated", () => {
    const report = readReport();
    expect(card(report, "Night Shift").generatedFactsConfirmed).toContain(
      "effect:economy",
    );
    expect(
      card(report, "Overtime Incentives").generatedFactsConfirmed,
    ).toContain("effect:extra_action");
    expect(card(report, "Project Consultants").generatedFactsConfirmed).toEqual(
      expect.arrayContaining([
        "effect:advance_burst",
        "effect:score_acceleration",
        "condition:requires_score_window",
      ]),
    );
    expect(
      card(report, "Project Consultants").legalActionContextInfos.length,
    ).toBeGreaterThan(0);
  });

  it("keeps when-scored, variable amount and hidden-zone effects contextual", () => {
    const report = readReport();
    expect(
      card(report, "Corporate Downsizing").generatedFactsConfirmed,
    ).toEqual(
      expect.arrayContaining([
        "effect:agenda_reveal_economy",
        "effect:zone_shuffle",
        "condition:requires_agenda_in_hq",
        "condition:requires_agenda_reveal",
      ]),
    );
    expect(
      card(report, "Corporate Downsizing").hiddenZoneContextInfos.length,
    ).toBeGreaterThan(0);
    expect(
      card(report, "Corporate War").variableAmountContextInfos.length,
    ).toBeGreaterThan(0);
    expect(card(report, "Security Purge").generatedFactsConfirmed).toContain(
      "effect:topdeck_info",
    );
    expect(card(report, "Security Purge").hiddenZoneContextInfos.length).toBe(
      1,
    );
  });

  it("keeps rez/install/global modifiers board-context only", () => {
    const report = readReport();
    expect(
      card(report, "Priority Requisition").generatedFactsConfirmed,
    ).toEqual(expect.arrayContaining(["effect:rez", "effect:rez_discount"]));
    expect(
      card(report, "Data Fort Reclamation").generatedFactsConfirmed,
    ).toEqual(
      expect.arrayContaining([
        "effect:remote_build",
        "effect:install",
        "effect:rez",
      ]),
    );
    expect(card(report, "Ice Transmutation").generatedFactsConfirmed).toContain(
      "effect:global_modifier",
    );
    expect(card(report, "Ice Transmutation").boardContextInfos.length).toBe(1);
    expect(
      card(report, "AI Chief Financial Officer").generatedFactsConfirmed,
    ).toEqual(
      expect.arrayContaining(["effect:shuffle_draw", "effect:zone_shuffle"]),
    );
  });

  it("does not emit hidden-info/runtime fields and recommends Corp assets next", () => {
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
      "score_now",
    ]) {
      expect(serialized).not.toContain(`"${blockedField}"`);
    }
    expect(report.nextBatchRecommendation).toEqual(
      expect.objectContaining({
        recommendedTaskId: "Aufgabe 020",
        batchName: "corp_nodes_assets_ambush_economy_remotes",
      }),
    );
    expect(report.nextBatchRecommendation.candidateCards).toContain(
      "City Surveillance",
    );
  });
});

function card(report: BatchEightCloseoutReport, title: string) {
  const found = report.includedCards.find((item) => item.title === title);
  if (!found) throw new Error(`Missing card ${title}`);
  return found;
}

function runCloseoutJson(): BatchEightCloseoutReport {
  return JSON.parse(
    execFileSync(
      "node",
      [
        "scripts/check-ai-generated-fact-batch8-corp-economy-closeout.mjs",
        "--json",
      ],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    ),
  ) as BatchEightCloseoutReport;
}

function readReport(): BatchEightCloseoutReport {
  return JSON.parse(
    fs.readFileSync(reportPath, "utf8"),
  ) as BatchEightCloseoutReport;
}
