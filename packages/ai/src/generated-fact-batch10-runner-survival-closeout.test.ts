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
  "docs/reviews/ai/aufgabe-021-runner-prevention-survival-closeout-report-2026-05-25.json",
);

type BatchTenCloseoutReport = {
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
    cardId: string;
    title: string;
    subBatch: string;
    activeHintFound: boolean;
    aiSupportStatus: string;
    generatedFactsConfirmed: string[];
    preventionWindowContextInfos: Array<{ kind: string; rule: string }>;
    damageWindowContextInfos: Array<{ kind: string; rule: string }>;
    flatlineReplacementContextInfos: Array<{ kind: string; rule: string }>;
    trashPreventionContextInfos: Array<{ kind: string; rule: string }>;
    traceContextInfos: Array<{ kind: string; rule: string }>;
    tagContextInfos: Array<{ kind: string; rule: string }>;
    perTurnLimitContextInfos: Array<{ kind: string; rule: string }>;
    survivalPenaltyContextInfos: Array<{ kind: string; rule: string }>;
    breakerSurvivalOverlapInfos: Array<{ kind: string; rule: string }>;
    survivalStrategyOverlayInfos: Array<{ kind: string; rule: string }>;
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

describe("generated fact Batch-10 Runner prevention/survival closeout", () => {
  it("is deterministic against the committed report", () => {
    const first = runCloseoutJson();
    const second = runCloseoutJson();
    expect(first).toEqual(second);
    expect(first).toEqual(readReport());
  });

  it("selects the Runner survival batch with justified excludes", () => {
    const report = readReport();
    expect(report.taskId).toBe("Aufgabe 021");
    expect(report.candidateCardCount).toBe(31);
    expect(report.includedCardCount).toBe(15);
    expect(report.excludedCardCount).toBe(16);
    expect(report.includedCards.map((item) => item.title)).toEqual(
      expect.arrayContaining([
        "Joan of Arc",
        "Shield",
        "Force Shield",
        "Emergency Self-Construct",
        "Evil Twin",
        "Bakdoor™",
        "Total Genetic Retrofit",
      ]),
    );
    expect(report.excludedCards.map((item) => item.title)).toEqual(
      expect.arrayContaining([
        "Baedeker’s Net Map",
        "Cloak",
        "Invisibility",
        "Enterprise, Inc., Shields",
        "Organ Donor",
      ]),
    );
    expect(
      report.excludedCards.find((item) => item.title === "Baedeker’s Net Map")
        ?.excludedReason,
    ).toContain("Trace/base-link support");
  });

  it("keeps included cards ready read-only with no conflicts or gaps", () => {
    const report = readReport();
    expect(report.confirmedGeneratedFactCount).toBe(62);
    expect(report.previewAddedFactCount).toBe(44);
    expect(report.hardErrorCount).toBe(0);
    expect(report.realSemanticConflictCount).toBe(0);
    expect(report.normalizedDifferenceCount).toBe(111);
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
          item.readiness === "ready_read_only_with_prevention_window_context",
      ),
    ).toBe(true);
  });

  it("keeps damage prevention windowed and per-turn limited", () => {
    const report = readReport();
    expect(card(report, "Shield").generatedFactsConfirmed).toEqual(
      expect.arrayContaining([
        "effect:damage_prevention",
        "effect:net_damage_prevention",
        "condition:requires_damage",
        "condition:requires_net_damage",
        "condition:requires_prevention_window",
        "condition:requires_turn_limit_available",
      ]),
    );
    expect(card(report, "Shield").damageWindowContextInfos.length).toBe(1);
    expect(card(report, "Shield").perTurnLimitContextInfos.length).toBe(1);
    expect(card(report, "Force Shield").generatedFactsConfirmed).toEqual(
      expect.arrayContaining([
        "effect:net_damage_prevention",
        "effect:brain_damage_prevention",
        "condition:requires_turn_limit_available",
      ]),
    );
  });

  it("keeps flatline replacement and persistent penalties explicit", () => {
    const report = readReport();
    expect(
      card(report, "Emergency Self-Construct").generatedFactsConfirmed,
    ).toEqual(
      expect.arrayContaining([
        "effect:flatline_prevention",
        "effect:prevention_replacement",
        "effect:remove_brain_damage",
        "effect:meat_damage_prevention",
        "effect:action_penalty",
        "effect:hand_size_modifier",
        "effect:persistent_survival_modifier",
        "condition:requires_flatline",
        "condition:requires_prevention_window",
      ]),
    );
    expect(
      card(report, "Emergency Self-Construct").flatlineReplacementContextInfos
        .length,
    ).toBe(1);
    expect(
      card(report, "Emergency Self-Construct").survivalPenaltyContextInfos
        .length,
    ).toBe(1);
  });

  it("keeps program-trash prevention and trace/link defense scoped", () => {
    const report = readReport();
    expect(card(report, "Joan of Arc").generatedFactsConfirmed).toEqual(
      expect.arrayContaining([
        "effect:program_trash_prevention",
        "condition:requires_installed_program",
        "condition:requires_program_trash",
        "condition:requires_prevention_window",
      ]),
    );
    expect(card(report, "Joan of Arc").trashPreventionContextInfos.length).toBe(
      1,
    );
    expect(card(report, "Bakdoor™").generatedFactsConfirmed).toEqual(
      expect.arrayContaining([
        "effect:base_link",
        "effect:link",
        "effect:trace_defense",
        "condition:requires_trace_attempt",
      ]),
    );
    expect(card(report, "Bakdoor™").traceContextInfos.length).toBe(1);
    expect(card(report, "Signpost").generatedFactsConfirmed).toContain(
      "effect:link",
    );
    expect(card(report, "Rabbit").generatedFactsConfirmed).toContain(
      "effect:trace_defense",
    );
  });

  it("keeps breaker overlap and tag-survival from becoming current legality", () => {
    const report = readReport();
    expect(card(report, "Evil Twin").generatedFactsConfirmed).toEqual(
      expect.arrayContaining([
        "effect:breaker",
        "breakerCoverage:sentry",
        "effect:damage_prevention",
        "effect:net_damage_prevention",
        "effect:brain_damage_prevention",
      ]),
    );
    expect(card(report, "Evil Twin").breakerSurvivalOverlapInfos.length).toBe(
      1,
    );
    expect(
      card(report, "Total Genetic Retrofit").generatedFactsConfirmed,
    ).toEqual(
      expect.arrayContaining([
        "effect:tag_prevention",
        "condition:requires_runner_tagged",
        "condition:requires_prevention_window",
      ]),
    );
    expect(card(report, "Nasuko Cycle").tagContextInfos.length).toBe(1);
    expect(card(report, "Fall Guy").tagContextInfos.length).toBe(1);
  });

  it("does not emit hidden-info/runtime fields and recommends Tag/Punish next", () => {
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
      "runner_is_safe",
      "runner_not_tagged",
      "install_now",
    ]) {
      expect(serialized).not.toContain(`"${blockedField}"`);
    }
    expect(report.nextBatchRecommendation).toEqual(
      expect.objectContaining({
        recommendedTaskId: "Aufgabe 022",
        batchName: "corp_tag_punish_assets_operations_expansion",
      }),
    );
    expect(report.nextBatchRecommendation.candidateCards).toContain(
      "Punitive Counterstrike",
    );
  });
});

function card(report: BatchTenCloseoutReport, title: string) {
  const found = report.includedCards.find((item) => item.title === title);
  if (!found) throw new Error(`Missing card ${title}`);
  return found;
}

function runCloseoutJson(): BatchTenCloseoutReport {
  return JSON.parse(
    execFileSync(
      "node",
      [
        "scripts/check-ai-generated-fact-batch10-runner-survival-closeout.mjs",
        "--json",
      ],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    ),
  ) as BatchTenCloseoutReport;
}

function readReport(): BatchTenCloseoutReport {
  return JSON.parse(
    fs.readFileSync(reportPath, "utf8"),
  ) as BatchTenCloseoutReport;
}
