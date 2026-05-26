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
  "docs/reviews/ai/aufgabe-003-generated-fact-batch1-dry-run-report-2026-05-25.json",
);

type BatchOneDryRunReport = {
  taskId: string;
  batch: string;
  hardErrorCount: number;
  warningCount: number;
  batchCardCount: number;
  previewChangedCardCount: number;
  confirmedFactCount: number;
  previewAddedFactCount: number;
  conflictCount: number;
  warningCountsByKind: Record<string, number>;
  cards: Array<{
    cardId: string;
    activeHintFound: boolean;
    derivedFactsFound: boolean;
    migrationPriorityFound: boolean;
    compiledAfterMigrationPreview: Record<string, unknown>;
    generatedFactsInScope: unknown[];
    confirmedByGeneratedFacts: unknown[];
    wouldAddToPreview: unknown[];
    conflicts: unknown[];
  }>;
};

describe("generated fact Batch-1 migration dry-run", () => {
  it("is deterministic against the committed report", () => {
    const first = runDryRunJson();
    const second = runDryRunJson();
    expect(first).toEqual(second);
    expect(first).toEqual(readReport());
  });

  it("covers the 11 Batch-1 cards without hard errors or conflicts", () => {
    const report = readReport();
    expect(report.taskId).toBe("Aufgabe 003");
    expect(report.batch).toBe("batch_1_scored_agenda_tag_punish");
    expect(report.batchCardCount).toBe(11);
    expect(report.hardErrorCount).toBe(0);
    expect(report.conflictCount).toBe(0);
    expect(report.cards.every((card) => card.activeHintFound)).toBe(true);
    expect(report.cards.every((card) => card.derivedFactsFound)).toBe(true);
    expect(report.cards.every((card) => card.migrationPriorityFound)).toBe(
      true,
    );
  });

  it("keeps the dry-run preview read-only and free of legacy/manual fields", () => {
    const serialized = JSON.stringify(
      readReport().cards.map((card) => card.compiledAfterMigrationPreview),
    );
    for (const blockedField of [
      "aiSupportStatus",
      "roles",
      "planRoles",
      "lineSupport",
      "quality",
      "manualNotes",
      "strategicNotes",
      "opponentDeckList",
      "actualRndOrder",
      "privatePayload",
      "fullGameState",
    ]) {
      expect(serialized).not.toContain(`"${blockedField}"`);
    }
  });

  it("confirms Batch-1 generated facts without changing the active monolith", () => {
    const report = readReport();
    expect(report.confirmedFactCount).toBe(40);
    expect(report.previewAddedFactCount).toBe(0);
    expect(report.previewChangedCardCount).toBe(0);
    expect(
      report.cards.every((card) => card.generatedFactsInScope.length > 0),
    ).toBe(true);
    expect(
      report.cards.every((card) => card.wouldAddToPreview.length === 0),
    ).toBe(true);
  });

  it("classifies shape and board-context warnings as dry-run signals", () => {
    const report = readReport();
    expect(report.warningCount).toBe(111);
    expect(report.warningCountsByKind).toEqual({
      board_context_required: 31,
      consumer_active_for_fact_type: 40,
      generated_fact_already_present: 33,
      shape_difference: 7,
    });
  });
});

function runDryRunJson(): BatchOneDryRunReport {
  return JSON.parse(
    execFileSync(
      "node",
      ["scripts/check-ai-generated-fact-migration-dry-run.mjs", "--json"],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    ),
  ) as BatchOneDryRunReport;
}

function readReport(): BatchOneDryRunReport {
  return JSON.parse(
    fs.readFileSync(reportPath, "utf8"),
  ) as BatchOneDryRunReport;
}
