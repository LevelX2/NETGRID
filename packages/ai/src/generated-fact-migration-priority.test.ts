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
  "docs/reviews/ai/ai-generated-fact-migration-priority-report-2026-05-25.json",
);

type MigrationPriorityReport = {
  taskId: string;
  candidateCount: number;
  priorityCounts: Record<string, number>;
  riskCounts: Record<string, number>;
  fieldCategoryCounts: Record<string, number>;
  batchPlan: Array<{ batch: number; cardIds: string[] }>;
  cards: Array<{
    cardId: string;
    migrationPriority: string;
    migrationRisk: string;
    fieldCategories: string[];
    generatedFields: string[];
    generatedMechanicalFacts: string[];
    monolithFields: string[];
    recommendedMigrationBatch: number;
    rationale: string;
    doNotMigrateFields: string[];
  }>;
};

describe("generated fact migration priority report", () => {
  it("is deterministic against the committed report", () => {
    const first = runPriorityJson();
    const second = runPriorityJson();
    expect(first).toEqual(second);
    expect(first).toEqual(readReport());
  });

  it("prioritizes all 193 compiled generated-fact candidates", () => {
    const report = readReport();
    expect(report.taskId).toBe("Aufgabe 002");
    expect(report.candidateCount).toBe(193);
    expect(report.priorityCounts).toEqual({
      P0: 13,
      P1: 176,
      P2: 4,
      P3: 0,
    });
    expect(report.riskCounts).toEqual({
      low: 29,
      medium: 164,
      high: 0,
    });
  });

  it("keeps strategic and compatibility fields out of generated migration", () => {
    const report = readReport();
    expect(report.fieldCategoryCounts.overlay_only).toBe(6);
    expect(report.fieldCategoryCounts.legacy_keep_for_compat).toBe(193);
    for (const card of report.cards) {
      expect(card.doNotMigrateFields).toContain("aiSupportStatus");
      expect(card.doNotMigrateFields).toContain("roles");
      expect(card.doNotMigrateFields).toContain("planRoles");
    }
  });

  it("keeps Self-Modifying Code and Mystery Box install cost semantics separated", () => {
    const report = readReport();
    const smc = cardById(report, "onr_v1_059_self-modifying-code");
    const mysteryBox = cardById(report, "onr_v1_043_mystery-box");
    expect(smc.generatedMechanicalFacts).toContain("targetProfiles");
    expect(smc.rationale).toContain("installCost=normal");
    expect(mysteryBox.generatedMechanicalFacts).toContain(
      "effect:install_discount",
    );
    expect(mysteryBox.rationale).toContain("free install");
  });

  it("orders the later migration batches without changing runtime sources", () => {
    const report = readReport();
    expect(report.batchPlan.map((batch) => batch.cardIds.length)).toEqual([
      11, 6, 2, 3, 26, 13, 24, 30, 45, 15, 2, 16,
    ]);
    expect(
      report.cards
        .filter((card) => card.recommendedMigrationBatch <= 5)
        .every((card) => card.monolithFields.length > 0),
    ).toBe(true);
    expect(
      report.cards
        .filter((card) => card.recommendedMigrationBatch === 6)
        .every((card) => card.monolithFields.length > 0),
    ).toBe(true);
    expect(
      report.cards
        .filter((card) => card.recommendedMigrationBatch === 7)
        .every((card) => card.rationale.includes("derivable")),
    ).toBe(true);
    expect(
      report.cards
        .filter((card) => card.recommendedMigrationBatch === 8)
        .every((card) => card.rationale.length > 20),
    ).toBe(true);
    expect(
      report.cards
        .filter((card) => card.recommendedMigrationBatch === 9)
        .every((card) => card.rationale.length > 20),
    ).toBe(true);
    expect(
      report.cards
        .filter((card) => card.recommendedMigrationBatch === 10)
        .every((card) =>
          card.generatedMechanicalFacts.some((fact) =>
            [
              "effect:damage_prevention",
              "effect:flatline_prevention",
              "effect:program_trash_prevention",
              "effect:trace_defense",
              "effect:tag_prevention",
              "effect:hand_size_modifier",
              "effect:draw",
              "effect:survival_payoff",
            ].includes(fact),
          ),
        ),
    ).toBe(true);
    expect(
      report.cards
        .filter((card) => card.recommendedMigrationBatch === 11)
        .map((card) => card.cardId),
    ).toEqual([
      "onr_v1_213_private-cybernet-police",
      "onr_v1_301_punitive-counterstrike",
    ]);
    expect(
      report.cards
        .filter((card) => card.recommendedMigrationBatch === 11)
        .every((card) =>
          card.generatedMechanicalFacts.some((fact) =>
            [
              "effect:tag_source",
              "effect:trace",
              "effect:tag_punish_payoff",
              "effect:damage",
            ].includes(fact),
          ),
        ),
    ).toBe(true);
    expect(
      report.cards
        .filter((card) => card.recommendedMigrationBatch === 12)
        .map((card) => card.cardId),
    ).toEqual(
      expect.arrayContaining([
        "onr_v1_045_newsgroup-filter",
        "onr_v1_168_loan-from-chiba",
        "onr_v1_178_short-term-contract",
      ]),
    );
    expect(report.cards.every((card) => card.generatedFields.length > 0)).toBe(
      true,
    );
  });
});

function runPriorityJson(): MigrationPriorityReport {
  return JSON.parse(
    execFileSync(
      "node",
      ["scripts/check-ai-generated-fact-migration-priority.mjs", "--json"],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    ),
  ) as MigrationPriorityReport;
}

function readReport(): MigrationPriorityReport {
  return JSON.parse(
    fs.readFileSync(reportPath, "utf8"),
  ) as MigrationPriorityReport;
}

function cardById(report: MigrationPriorityReport, cardId: string) {
  const card = report.cards.find((candidate) => candidate.cardId === cardId);
  expect(card).toBeDefined();
  return card!;
}
