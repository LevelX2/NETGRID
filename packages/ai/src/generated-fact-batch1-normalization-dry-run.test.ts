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
  "docs/reviews/ai/aufgabe-005-batch1-normalization-dry-run-report-2026-05-25.json",
);

type BatchOneNormalizationDryRunReport = {
  taskId: string;
  normalizationRuleCounts: Record<string, number>;
  normalizedShapeDifferenceCount: number;
  remainingShapeDifferenceCount: number;
  realSemanticConflictCount: number;
  remainingUnnormalizedDifferences: unknown[];
  deriverFollowupCandidates: Array<{
    cardId: string;
    fact: string;
    classification: string;
  }>;
  cards: Array<{
    cardId: string;
    normalizedEquivalences: Array<{
      fact: string;
      rule: string;
      newClassification: string;
      normalizedForm: Record<string, unknown>;
      conflict: boolean;
    }>;
    remainingDifferences: unknown[];
    deriverFollowups: unknown[];
  }>;
};

describe("generated fact Batch-1 normalization dry run", () => {
  it("is deterministic against the committed report", () => {
    const first = runNormalizationDryRunJson();
    const second = runNormalizationDryRunJson();
    expect(first).toEqual(second);
    expect(first).toEqual(readReport());
  });

  it("normalizes all seven known shape differences without conflicts", () => {
    const report = readReport();
    expect(report.taskId).toBe("Aufgabe 005");
    expect(report.normalizedShapeDifferenceCount).toBe(7);
    expect(report.remainingShapeDifferenceCount).toBe(0);
    expect(report.realSemanticConflictCount).toBe(0);
    expect(report.remainingUnnormalizedDifferences).toEqual([]);
    expect(report.normalizationRuleCounts).toEqual({
      trace_actor_target_scope: 3,
      tag_source_trace_success: 1,
      tag_punish_payoff_amount_from_pair: 3,
    });
  });

  it("applies the trace and trace-success tag-source rules only to trace cards", () => {
    const report = readReport();
    const netwatch = findCard(report, "onr_v1_207_netwatch-operations-office");
    expect(netwatch.normalizedEquivalences).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fact: "effect:trace",
          rule: "trace_actor_target_scope",
          newClassification: "normalized_equivalent",
          normalizedForm: expect.objectContaining({
            actor: "corp",
            target: "runner",
            boardContextRequired: true,
          }),
          conflict: false,
        }),
        expect.objectContaining({
          fact: "effect:tag_source",
          rule: "tag_source_trace_success",
          newClassification: "normalized_equivalent",
          normalizedForm: expect.objectContaining({
            trigger: "trace_success",
            resource: "tags",
            boardContextRequired: true,
          }),
          conflict: false,
        }),
      ]),
    );

    for (const cardId of [
      "onr_v1_283_audit-of-call-records",
      "onr_v1_284_chance-observation",
    ]) {
      expect(findCard(report, cardId).normalizedEquivalences).toContainEqual(
        expect.objectContaining({
          fact: "effect:trace",
          rule: "trace_actor_target_scope",
        }),
      );
    }
  });

  it("normalizes tag-punish payoff amounts from paired payload facts", () => {
    const report = readReport();
    for (const cardId of [
      "onr_v1_208_on-call-solo-team",
      "onr_v1_217_strike-force-kali",
      "onr_v1_302_scorched-earth",
    ]) {
      expect(findCard(report, cardId).normalizedEquivalences).toContainEqual(
        expect.objectContaining({
          fact: "effect:tag_punish_payoff",
          rule: "tag_punish_payoff_amount_from_pair",
          normalizedForm: expect.objectContaining({
            requires: ["requires_runner_tagged"],
            boardContextRequired: true,
          }),
          conflict: false,
        }),
      );
    }
  });

  it("keeps the Employee Empowerment deriver gap visible", () => {
    const report = readReport();
    expect(report.deriverFollowupCandidates).toContainEqual(
      expect.objectContaining({
        cardId: "onr_v1_199_employee-empowerment",
        fact: "effect:draw",
        classification: "generated_deriver_gap",
      }),
    );
    const employee = findCard(report, "onr_v1_199_employee-empowerment");
    expect(employee.normalizedEquivalences).toEqual([]);
    expect(employee.remainingDifferences).toEqual([]);
    expect(employee.deriverFollowups).toContainEqual(
      expect.objectContaining({
        fact: "effect:draw",
        classification: "generated_deriver_gap",
      }),
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

function runNormalizationDryRunJson(): BatchOneNormalizationDryRunReport {
  return JSON.parse(
    execFileSync(
      "node",
      [
        "scripts/check-ai-generated-fact-batch1-normalization-dry-run.mjs",
        "--json",
      ],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    ),
  ) as BatchOneNormalizationDryRunReport;
}

function readReport(): BatchOneNormalizationDryRunReport {
  return JSON.parse(
    fs.readFileSync(reportPath, "utf8"),
  ) as BatchOneNormalizationDryRunReport;
}

function findCard(
  report: BatchOneNormalizationDryRunReport,
  cardId: string,
): BatchOneNormalizationDryRunReport["cards"][number] {
  const card = report.cards.find((candidate) => candidate.cardId === cardId);
  expect(card).toBeDefined();
  return card as BatchOneNormalizationDryRunReport["cards"][number];
}
