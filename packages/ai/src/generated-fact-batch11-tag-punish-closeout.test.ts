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
  "docs/reviews/ai/aufgabe-022-corp-tag-punish-funnel-closeout-report-2026-05-25.json",
);

type BatchElevenCloseoutReport = {
  taskId: string;
  candidateCardCount: number;
  includedCardCount: number;
  excludedCardCount: number;
  crossBatchCardCount: number;
  confirmedGeneratedFactCount: number;
  previewAddedFactCount: number;
  hardErrorCount: number;
  realSemanticConflictCount: number;
  normalizedDifferenceCount: number;
  remainingDifferenceCount: number;
  tagSourceCount: number;
  punishPayoffCount: number;
  sourcePayoffPairingCount: number;
  traceTagSourceCount: number;
  directTagSourceCount: number;
  runnerTurnTagSourceCount: number;
  corpTurnTagSourceCount: number;
  persistentTagPressureCount: number;
  visibleTagPayoffCount: number;
  ambushPunishCount: number;
  runnerSurvivalCounterContextCount: number;
  readiness: string;
  funnelConsumerReadiness: string;
  includedCards: Array<{
    cardId: string;
    title: string;
    sourceBatch: string;
    activeHintFound: boolean;
    aiSupportStatus: string;
    generatedFactsConfirmed: string[];
    effectGroups: string[];
    conditions: string[];
    timingWindows: string[];
    payoffCategories: string[];
    terminalWindowContextInfos: Array<{ kind: string; rule: string }>;
    traceContextInfos: Array<{ kind: string; rule: string }>;
    runnerTaggedContextInfos: Array<{ kind: string; rule: string }>;
    accessContextInfos: Array<{ kind: string; rule: string }>;
    persistentCounterContextInfos: Array<{ kind: string; rule: string }>;
    readiness: string;
  }>;
  excludedCards: unknown[];
  sourcePayoffPairings: Array<{
    sourceTitle: string;
    payoffTitle: string;
    actionDecisionGenerated: boolean;
    windowCaveat: string;
  }>;
  runnerSurvivalCounterContext: Array<{
    title: string;
    generatedSafeState: boolean;
  }>;
  nextBatchRecommendation: {
    recommendedTaskId: string;
    batchName: string;
    candidateMetrics: string[];
  };
};

describe("generated fact Batch-11 Corp Tag/Punish funnel closeout", () => {
  it("is deterministic against the committed report", () => {
    const first = runCloseoutJson();
    const second = runCloseoutJson();
    expect(first).toEqual(second);
    expect(first).toEqual(readReport());
  });

  it("selects the cross-batch Tag/Punish funnel without duplicate excludes", () => {
    const report = readReport();
    expect(report.taskId).toBe("Aufgabe 022");
    expect(report.candidateCardCount).toBe(38);
    expect(report.includedCardCount).toBe(38);
    expect(report.excludedCardCount).toBe(0);
    expect(report.crossBatchCardCount).toBe(38);
    expect(report.includedCards.map((item) => item.title)).toEqual(
      expect.arrayContaining([
        "Netwatch Operations Office",
        "Hunter",
        "Data Raven",
        "City Surveillance",
        "Power Grid Overload",
        "Punitive Counterstrike",
        "Private Cybernet Police",
      ]),
    );
    expect(report.includedCards.every((item) => item.activeHintFound)).toBe(
      true,
    );
    expect(
      report.includedCards.every(
        (item) => item.aiSupportStatus === "ai_supported",
      ),
    ).toBe(true);
  });

  it("rolls up the funnel as ready for diagnostic consumer review", () => {
    const report = readReport();
    expect(report.confirmedGeneratedFactCount).toBe(190);
    expect(report.previewAddedFactCount).toBe(100);
    expect(report.normalizedDifferenceCount).toBe(313);
    expect(report.remainingDifferenceCount).toBe(0);
    expect(report.hardErrorCount).toBe(0);
    expect(report.realSemanticConflictCount).toBe(0);
    expect(report.tagSourceCount).toBe(15);
    expect(report.punishPayoffCount).toBe(23);
    expect(report.sourcePayoffPairingCount).toBe(165);
    expect(report.traceTagSourceCount).toBe(10);
    expect(report.directTagSourceCount).toBe(5);
    expect(report.runnerTurnTagSourceCount).toBe(2);
    expect(report.corpTurnTagSourceCount).toBe(8);
    expect(report.persistentTagPressureCount).toBe(3);
    expect(report.visibleTagPayoffCount).toBe(11);
    expect(report.ambushPunishCount).toBe(3);
    expect(report.runnerSurvivalCounterContextCount).toBe(11);
    expect(report.readiness).toBe(
      "ready_read_only_with_terminal_window_context",
    );
    expect(report.funnelConsumerReadiness).toBe(
      "ready_for_diagnostic_consumer_review",
    );
  });

  it("keeps trace tags and visible-tag payoffs conditional", () => {
    const report = readReport();
    for (const title of ["Hunter", "Blood Cat", "Private Cybernet Police"]) {
      const item = card(report, title);
      expect(item.generatedFactsConfirmed).toContain("effect:trace");
      expect(item.generatedFactsConfirmed).toContain("effect:tag_source");
      expect(item.generatedFactsConfirmed).toContain(
        "condition:requires_trace_success",
      );
      expect(item.traceContextInfos.length).toBeGreaterThan(0);
    }
    for (const title of [
      "Punitive Counterstrike",
      "Scorched Earth",
      "Closed Accounts",
      "Urban Renewal",
    ]) {
      const item = card(report, title);
      expect(item.generatedFactsConfirmed).toContain(
        "effect:tag_punish_payoff",
      );
      expect(item.generatedFactsConfirmed).toContain(
        "condition:requires_runner_tagged",
      );
      expect(item.runnerTaggedContextInfos.length).toBeGreaterThan(0);
    }
  });

  it("does not convert runner-turn, persistent or ambush facts into guaranteed state", () => {
    const report = readReport();
    expect(card(report, "City Surveillance").timingWindows).toContain(
      "runner_turn",
    );
    expect(card(report, "City Surveillance").generatedFactsConfirmed).toContain(
      "condition:requires_runner_pay_or_take_tag",
    );
    expect(
      card(report, "Data Raven").persistentCounterContextInfos.length,
    ).toBe(1);
    expect(card(report, "Setup!").accessContextInfos.length).toBe(1);
    const serialized = JSON.stringify(report);
    for (const blocked of [
      "guaranteed_corp_turn_tag",
      "current_runner_tagged",
      "guaranteed_hit",
      "current_counter_state",
      "runner_is_safe",
    ]) {
      expect(serialized).not.toContain(blocked);
    }
  });

  it("keeps funnel pairings and runner countercontext diagnostic-only", () => {
    const report = readReport();
    expect(
      report.sourcePayoffPairings.some(
        (pairing) =>
          pairing.sourceTitle === "City Surveillance" &&
          pairing.payoffTitle === "Scorched Earth",
      ),
    ).toBe(true);
    expect(
      report.sourcePayoffPairings.every(
        (pairing) => pairing.actionDecisionGenerated === false,
      ),
    ).toBe(true);
    expect(
      report.sourcePayoffPairings.every((pairing) =>
        pairing.windowCaveat.includes("Diagnostic pairing only"),
      ),
    ).toBe(true);
    expect(
      report.runnerSurvivalCounterContext.every(
        (context) => context.generatedSafeState === false,
      ),
    ).toBe(true);
  });

  it("does not emit hidden-info/runtime fields and recommends diagnostics next", () => {
    const report = readReport();
    const serialized = JSON.stringify(report);
    for (const blockedField of [
      "runnerGripCards",
      "runnerStackOrder",
      "actualStackOrder",
      "privatePayload",
      "fullGameState",
      "legalActions",
      "stateVersion",
      "stateHash",
      "actionId",
      "run_punish_now",
      "score_action",
    ]) {
      expect(serialized).not.toContain(`"${blockedField}"`);
    }
    expect(report.nextBatchRecommendation).toEqual(
      expect.objectContaining({
        recommendedTaskId: "Aufgabe 023",
        batchName: "tag_punish_terminal_consumer_diagnostic_slice",
      }),
    );
    expect(report.nextBatchRecommendation.candidateMetrics).toContain(
      "legal_punish_action_available",
    );
  });
});

function card(report: BatchElevenCloseoutReport, title: string) {
  const found = report.includedCards.find((item) => item.title === title);
  if (!found) throw new Error(`Missing card ${title}`);
  return found;
}

function runCloseoutJson(): BatchElevenCloseoutReport {
  return JSON.parse(
    execFileSync(
      "node",
      [
        "scripts/check-ai-generated-fact-batch11-tag-punish-closeout.mjs",
        "--json",
      ],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    ),
  ) as BatchElevenCloseoutReport;
}

function readReport(): BatchElevenCloseoutReport {
  return JSON.parse(
    fs.readFileSync(reportPath, "utf8"),
  ) as BatchElevenCloseoutReport;
}
