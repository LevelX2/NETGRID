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
  "docs/reviews/ai/aufgabe-020-corp-nodes-assets-ambush-closeout-report-2026-05-25.json",
);

type BatchNineCloseoutReport = {
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
    remoteContextInfos: Array<{ kind: string; rule: string }>;
    accessContextInfos: Array<{ kind: string; rule: string }>;
    traceContextInfos: Array<{ kind: string; rule: string }>;
    tagContextInfos: Array<{ kind: string; rule: string }>;
    variableAmountContextInfos: Array<{ kind: string; rule: string }>;
    hiddenZoneContextInfos: Array<{ kind: string; rule: string }>;
    remoteStrategyOverlayInfos: Array<{ kind: string; rule: string }>;
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

describe("generated fact Batch-9 Corp nodes/assets/ambush closeout", () => {
  it("is deterministic against the committed report", () => {
    const first = runCloseoutJson();
    const second = runCloseoutJson();
    expect(first).toEqual(second);
    expect(first).toEqual(readReport());
  });

  it("selects the broad Corp node/asset/ambush batch with justified excludes", () => {
    const report = readReport();
    expect(report.taskId).toBe("Aufgabe 020");
    expect(report.candidateCardCount).toBe(48);
    expect(report.includedCardCount).toBe(45);
    expect(report.excludedCardCount).toBe(3);
    expect(report.includedCards.map((item) => item.title)).toEqual(
      expect.arrayContaining([
        "BBS Whispering Campaign",
        "City Surveillance",
        "Corprunner's Shattered Remains",
        "Experimental AI",
        "Spinn® Public Relations",
        "Dr. Dreff",
      ]),
    );
    expect(report.excludedCards.map((item) => item.title)).toEqual(
      expect.arrayContaining([
        "Rex Campaign",
        "Marcel DeSoleil",
        "Zetatech Software Installer",
      ]),
    );
  });

  it("keeps included cards ready read-only with no conflicts or gaps", () => {
    const report = readReport();
    expect(report.confirmedGeneratedFactCount).toBe(131);
    expect(report.previewAddedFactCount).toBe(78);
    expect(report.hardErrorCount).toBe(0);
    expect(report.realSemanticConflictCount).toBe(0);
    expect(report.normalizedDifferenceCount).toBe(326);
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
          item.readiness === "ready_read_only_with_remote_access_context",
      ),
    ).toBe(true);
  });

  it("keeps remote economy and pools board-context only", () => {
    const report = readReport();
    expect(
      card(report, "BBS Whispering Campaign").generatedFactsConfirmed,
    ).toEqual(
      expect.arrayContaining([
        "effect:finite_economy_pool",
        "effect:counter_economy",
        "effect:action_economy",
      ]),
    );
    expect(
      card(report, "BBS Whispering Campaign").variableAmountContextInfos.length,
    ).toBeGreaterThan(0);
    expect(card(report, "City Surveillance").generatedFactsConfirmed).toEqual(
      expect.arrayContaining([
        "effect:tag_source",
        "effect:remote_tax",
        "condition:requires_runner_draw",
        "condition:requires_runner_pay_or_take_tag",
      ]),
    );
    expect(card(report, "City Surveillance").tagContextInfos.length).toBe(1);
  });

  it("keeps ambush, tag-punish and trace context explicit", () => {
    const report = readReport();
    expect(card(report, "Experimental AI").generatedFactsConfirmed).toEqual(
      expect.arrayContaining([
        "effect:ambush",
        "effect:access_punish",
        "effect:program_trash",
        "condition:requires_accessed_card",
        "condition:requires_advancement_counter",
      ]),
    );
    expect(card(report, "Experimental AI").accessContextInfos.length).toBe(1);
    expect(card(report, "Blood Cat").generatedFactsConfirmed).toEqual(
      expect.arrayContaining([
        "effect:trace",
        "effect:tag_source",
        "condition:requires_trace_success",
      ]),
    );
    expect(card(report, "Blood Cat").traceContextInfos.length).toBe(1);
    expect(card(report, "I Got a Rock").generatedFactsConfirmed).toContain(
      "condition:requires_runner_tagged",
    );
  });

  it("keeps hidden-zone and remote-strategy facts out of runtime meaning", () => {
    const report = readReport();
    expect(card(report, "New Blood").generatedFactsConfirmed).toContain(
      "effect:zone_shuffle",
    );
    expect(card(report, "New Blood").hiddenZoneContextInfos.length).toBe(1);
    expect(card(report, "Dr. Dreff").generatedFactsConfirmed).toEqual(
      expect.arrayContaining([
        "effect:future_encounter_effect",
        "effect:zone_shuffle",
        "condition:requires_successful_run",
      ]),
    );
    expect(card(report, "Dr. Dreff").hiddenZoneContextInfos.length).toBe(1);
    expect(
      report.includedCards.some(
        (item) => item.remoteStrategyOverlayInfos.length > 0,
      ),
    ).toBe(true);
  });

  it("does not emit hidden-info/runtime fields and recommends Runner survival next", () => {
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
      "install_now",
      "remote_is_safe",
    ]) {
      expect(serialized).not.toContain(`"${blockedField}"`);
    }
    expect(report.nextBatchRecommendation).toEqual(
      expect.objectContaining({
        recommendedTaskId: "Aufgabe 021",
        batchName: "runner_prevention_damage_survival_tools",
      }),
    );
    expect(report.nextBatchRecommendation.candidateCards).toContain(
      "Joan of Arc",
    );
  });
});

function card(report: BatchNineCloseoutReport, title: string) {
  const found = report.includedCards.find((item) => item.title === title);
  if (!found) throw new Error(`Missing card ${title}`);
  return found;
}

function runCloseoutJson(): BatchNineCloseoutReport {
  return JSON.parse(
    execFileSync(
      "node",
      [
        "scripts/check-ai-generated-fact-batch9-corp-nodes-closeout.mjs",
        "--json",
      ],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    ),
  ) as BatchNineCloseoutReport;
}

function readReport(): BatchNineCloseoutReport {
  return JSON.parse(
    fs.readFileSync(reportPath, "utf8"),
  ) as BatchNineCloseoutReport;
}
