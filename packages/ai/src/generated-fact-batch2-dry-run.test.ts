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
  "docs/reviews/ai/aufgabe-008-generated-fact-batch2-dry-run-report-2026-05-25.json",
);

type BatchTwoDryRunReport = {
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
    title: string;
    activeHintFound: boolean;
    derivedFactsFound: boolean;
    migrationPriorityFound: boolean;
    compiledAfterMigrationPreview: Record<string, unknown>;
    generatedFactsInScope: Array<Record<string, unknown>>;
    confirmedByGeneratedFacts: unknown[];
    wouldAddToPreview: Array<Record<string, unknown>>;
    conflicts: unknown[];
    expectedTrashCreditTarget?: string;
  }>;
};

describe("generated fact Batch-2 migration dry-run", () => {
  it("is deterministic against the committed report", () => {
    const first = runDryRunJson();
    const second = runDryRunJson();
    expect(first).toEqual(second);
    expect(first).toEqual(readReport());
  });

  it("covers exactly the six Batch-2 cards without hard errors or conflicts", () => {
    const report = readReport();
    expect(report.taskId).toBe("Aufgabe 008");
    expect(report.batch).toBe("batch_2_breaker_target_trash_credit");
    expect(report.batchCardCount).toBe(6);
    expect(report.hardErrorCount).toBe(0);
    expect(report.conflictCount).toBe(0);
    expect(report.cards.map((card) => card.cardId).sort()).toEqual([
      "onr_v1_037_japanese-water-torture",
      "onr_v1_039_krash",
      "onr_v1_043_mystery-box",
      "onr_v1_048_poltergeist",
      "onr_v1_057_scatter-shot",
      "onr_v1_059_self-modifying-code",
    ]);
    expect(report.cards.every((card) => card.activeHintFound)).toBe(true);
    expect(report.cards.every((card) => card.derivedFactsFound)).toBe(true);
    expect(report.cards.every((card) => card.migrationPriorityFound)).toBe(
      true,
    );
  });

  it("keeps SMC normal-cost install distinct from Mystery Box free install", () => {
    const report = readReport();
    const smc = card(report, "onr_v1_059_self-modifying-code");
    const mysteryBox = card(report, "onr_v1_043_mystery-box");

    expect(
      smc.generatedFactsInScope.some(
        (fact) => fact.type === "effect" && fact.kind === "install_discount",
      ),
    ).toBe(false);
    expect(
      smc.generatedFactsInScope.some(
        (fact) =>
          fact.type === "targetProfile" && fact.installCost === "normal",
      ),
    ).toBe(true);
    expect(
      mysteryBox.generatedFactsInScope.some(
        (fact) => fact.type === "effect" && fact.kind === "install_discount",
      ),
    ).toBe(true);
    expect(
      mysteryBox.generatedFactsInScope.some(
        (fact) => fact.type === "targetProfile" && fact.installCost === "free",
      ),
    ).toBe(true);
  });

  it("keeps Poltergeist and Scatter Shot trash-credit targets distinct", () => {
    const report = readReport();
    expect(
      card(report, "onr_v1_048_poltergeist").expectedTrashCreditTarget,
    ).toBe("node");
    expect(
      card(report, "onr_v1_057_scatter-shot").expectedTrashCreditTarget,
    ).toBe("upgrade");
    expect(
      report.warningCountsByKind.trash_credit_target_shape_difference ?? 0,
    ).toBe(0);
  });

  it("keeps the dry-run preview read-only and free of runtime/manual fields", () => {
    const serialized = JSON.stringify(
      readReport().cards.map((item) => item.compiledAfterMigrationPreview),
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
});

function card(report: BatchTwoDryRunReport, cardId: string) {
  const found = report.cards.find((item) => item.cardId === cardId);
  if (!found) throw new Error(`Missing card ${cardId}`);
  return found;
}

function runDryRunJson(): BatchTwoDryRunReport {
  return JSON.parse(
    execFileSync(
      "node",
      ["scripts/check-ai-generated-fact-batch2-dry-run.mjs", "--json"],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    ),
  ) as BatchTwoDryRunReport;
}

function readReport(): BatchTwoDryRunReport {
  return JSON.parse(
    fs.readFileSync(reportPath, "utf8"),
  ) as BatchTwoDryRunReport;
}
