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
  "docs/reviews/ai/ai-hint-compiled-index-pilot-report-2026-05-25.json",
);

type CompiledIndexReport = {
  compiledCardCount: number;
  overlayCardCount: number;
  cardsWithoutOverlay: number;
  hardErrorCount: number;
  warningCount: number;
  warningCountsByKind: Record<string, number>;
  source: {
    activeHintsPath: string;
    pilotCardsPath: string;
    derivedFactsReportPath: string;
    overlayPaths: string[];
  };
  cards: Array<{
    cardId: string;
    activeHintFound: boolean;
    derivedFactsFound: boolean;
    manualOverlayFound: boolean;
    expectedManualOverlayNeeded: boolean;
    compiledPreview: Record<string, unknown>;
    mechanicalFactsFromGenerated: string[];
    strategyFieldsFromOverlay: string[];
    conflicts: unknown[];
    recommendedNextAction: string;
  }>;
};

describe("compiled hint index pilot report", () => {
  it("is deterministic against the committed report", () => {
    const first = runGateJson();
    const second = runGateJson();
    expect(first).toEqual(second);
    expect(first).toEqual(readReport());
  });

  it("compiles the full 24-card derived facts pilot without hard errors", () => {
    const report = readReport();
    expect(report.compiledCardCount).toBe(24);
    expect(report.overlayCardCount).toBe(6);
    expect(report.cardsWithoutOverlay).toBe(18);
    expect(report.hardErrorCount).toBe(0);
    expect(report.source.activeHintsPath).toBe(
      "data/ai/ai-card-hints-active.json",
    );
    expect(report.source.pilotCardsPath).toBe(
      "data/ai/ai-derived-basic-facts-pilot-cards-2026-05-25.json",
    );
    expect(report.source.derivedFactsReportPath).toBe(
      "docs/reviews/ai/ai-derived-basic-facts-gate-2026-05-25.json",
    );
    expect(report.source.overlayPaths).toEqual([
      "data/ai/hints/overlays/onr-v1/corp/upgrades.json",
      "data/ai/hints/overlays/onr-v1/runner/programs.json",
    ]);
    expect(report.cards.every((card) => card.activeHintFound)).toBe(true);
    expect(report.cards.every((card) => card.derivedFactsFound)).toBe(true);
    expect(report.cards.filter((card) => card.manualOverlayFound).length).toBe(
      6,
    );
    expect(report.cards.filter((card) => !card.manualOverlayFound).length).toBe(
      18,
    );
  });

  it("keeps compiled previews free of blocked runtime and hidden fields", () => {
    const serialized = JSON.stringify(
      readReport().cards.map((card) => card.compiledPreview),
    );
    for (const blockedField of [
      "opponentDeckList",
      "actualRndOrder",
      "privatePayload",
      "fullGameState",
      "legalActions",
      "playerActions",
      "stateVersion",
      "stateHash",
      "actionId",
    ]) {
      expect(serialized).not.toContain(`"${blockedField}"`);
    }
  });

  it("keeps mechanical and strategic sources separated", () => {
    const report = readReport();
    expect(
      report.cards.every(
        (card) => card.mechanicalFactsFromGenerated.length > 0,
      ),
    ).toBe(true);
    expect(
      report.cards
        .filter((card) => card.manualOverlayFound)
        .every((card) => card.strategyFieldsFromOverlay.length > 0),
    ).toBe(true);
    for (const card of report.cards) {
      expect(card.strategyFieldsFromOverlay).not.toContain("effects");
      expect(card.strategyFieldsFromOverlay).not.toContain("conditions");
      expect(card.strategyFieldsFromOverlay).not.toContain("breakerProfile");
      expect(card.strategyFieldsFromOverlay).not.toContain("remoteRole");
      expect(card.strategyFieldsFromOverlay).not.toContain("targetProfiles");
    }
  });

  it("keeps missing overlays non-fatal when the pilot card does not need one", () => {
    const report = readReport();
    expect(report.warningCountsByKind.overlay_missing_for_manual_gap ?? 0).toBe(
      0,
    );
    expect(
      report.cards
        .filter((card) => !card.manualOverlayFound)
        .every((card) => !card.expectedManualOverlayNeeded),
    ).toBe(true);
    expect(
      report.cards.every((card) =>
        [
          "generated_fact_candidate",
          "manual_review_needed",
          "monolith_mechanical_duplication",
          "overlay_needed",
          "overlay_not_needed",
          "schema_gap",
        ].includes(card.recommendedNextAction),
      ),
    ).toBe(true);
  });

  it("keeps Crystal Palace denylist protected in the compiled pilot", () => {
    const crystalPalace = readReport().cards.find(
      (card) => card.cardId === "onr_v1_355_crystal-palace-station-grid",
    );
    expect(crystalPalace).toBeDefined();
    expect(crystalPalace?.conflicts).toEqual([]);
  });

  it("does not wire the compiled index into AI runtime modules", () => {
    for (const relativePath of [
      "packages/ai/src/ai-hints.ts",
      "packages/ai/src/deck-doctrine.ts",
      "packages/ai/src/corp-plans.ts",
      "packages/ai/src/runner-plans.ts",
    ]) {
      const source = fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
      expect(source).not.toContain("check-ai-hint-compiled-index");
      expect(source).not.toContain("ai-hint-compiled-index-pilot-report");
    }
  });
});

function runGateJson(): CompiledIndexReport {
  return JSON.parse(
    execFileSync(
      "node",
      ["scripts/check-ai-hint-compiled-index.mjs", "--json", "--pilot-only"],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    ),
  ) as CompiledIndexReport;
}

function readReport(): CompiledIndexReport {
  return JSON.parse(fs.readFileSync(reportPath, "utf8")) as CompiledIndexReport;
}
