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
  "docs/reviews/ai/aufgabe-012-generated-fact-batch3-dry-run-report-2026-05-25.json",
);

type BatchThreeDryRunReport = {
  taskId: string;
  batch: string;
  hardErrorCount: number;
  warningCount: number;
  batchCardCount: number;
  confirmedFactCount: number;
  previewAddedFactCount: number;
  conflictCount: number;
  runpathContextRequiredCount: number;
  remoteRoleDifferenceCount: number;
  futureRunDifferenceCount: number;
  batchThreeStatus: string;
  readinessCounts: Record<string, number>;
  warningCountsByKind: Record<string, number>;
  cards: Array<{
    cardId: string;
    title: string;
    activeHintFound: boolean;
    derivedFactsFound: boolean;
    migrationPriorityFound: boolean;
    generatedFactsInScope: Array<Record<string, unknown>>;
    compiledAfterMigrationPreview: Record<string, unknown>;
    readiness: string;
    expectedRemoteRoleKind?: string;
    warnings: Array<{ kind: string; fact?: string }>;
  }>;
};

describe("generated fact Batch-3 migration dry-run", () => {
  it("is deterministic against the committed report", () => {
    const first = runDryRunJson();
    const second = runDryRunJson();
    expect(first).toEqual(second);
    expect(first).toEqual(readReport());
  });

  it("covers exactly the five Batch-3 cards without hard errors or conflicts", () => {
    const report = readReport();
    expect(report.taskId).toBe("Aufgabe 012");
    expect(report.batch).toBe("batch_3_remote_role_future_run_ice");
    expect(report.batchCardCount).toBe(5);
    expect(report.hardErrorCount).toBe(0);
    expect(report.conflictCount).toBe(0);
    expect(report.cards.map((card) => card.cardId).sort()).toEqual([
      "onr_v1_274_tutor",
      "onr_v1_276_viral-15",
      "onr_v1_277_virizz",
      "onr_v1_355_crystal-palace-station-grid",
      "onr_v1_366_red-herrings",
    ]);
    expect(report.cards.every((card) => card.activeHintFound)).toBe(true);
    expect(report.cards.every((card) => card.derivedFactsFound)).toBe(true);
    expect(report.cards.every((card) => card.migrationPriorityFound)).toBe(
      true,
    );
  });

  it("keeps remote-role guardrails for Crystal Palace and Red Herrings", () => {
    const report = readReport();
    const crystal = card(report, "Crystal Palace Station Grid");
    const redHerrings = card(report, "Red Herrings");

    expect(crystal.expectedRemoteRoleKind).toBe("run_tax");
    expect(
      crystal.generatedFactsInScope.some(
        (fact) => fact.type === "remoteRole" && fact.kind === "run_tax",
      ),
    ).toBe(true);
    expect(
      crystal.generatedFactsInScope.some(
        (fact) =>
          fact.type === "effect" &&
          ["economy", "counter_economy", "power_counter"].includes(
            String(fact.kind),
          ),
      ),
    ).toBe(false);
    expect(redHerrings.expectedRemoteRoleKind).toBe("agenda_steal_tax");
    expect(
      redHerrings.generatedFactsInScope.some(
        (fact) =>
          fact.type === "remoteRole" && fact.kind === "agenda_steal_tax",
      ),
    ).toBe(true);
  });

  it("marks future-run ICE as runpath-context work rather than current legality", () => {
    const report = readReport();
    expect(report.batchThreeStatus).toBe("needs_diff_review");
    expect(report.readinessCounts).toEqual({
      needs_diff_review: 2,
      needs_future_run_descriptor_review: 3,
    });
    expect(report.runpathContextRequiredCount).toBeGreaterThan(0);
    expect(report.futureRunDifferenceCount).toBeGreaterThan(0);
    for (const title of ["Tutor", "Virizz", "Viral 15"]) {
      const item = card(report, title);
      expect(item.readiness).toBe("needs_future_run_descriptor_review");
      expect(
        item.warnings.some(
          (warning) => warning.kind === "runpath_context_required",
        ),
      ).toBe(true);
    }
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
      "legalActions",
      "stateVersion",
    ]) {
      expect(serialized).not.toContain(`"${blockedField}"`);
    }
  });
});

function card(report: BatchThreeDryRunReport, title: string) {
  const found = report.cards.find((item) => item.title === title);
  if (!found) throw new Error(`Missing card ${title}`);
  return found;
}

function runDryRunJson(): BatchThreeDryRunReport {
  return JSON.parse(
    execFileSync(
      "node",
      ["scripts/check-ai-generated-fact-batch3-dry-run.mjs", "--json"],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    ),
  ) as BatchThreeDryRunReport;
}

function readReport(): BatchThreeDryRunReport {
  return JSON.parse(
    fs.readFileSync(reportPath, "utf8"),
  ) as BatchThreeDryRunReport;
}
