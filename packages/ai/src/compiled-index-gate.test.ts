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
  warningClassificationCounts: Record<string, number>;
  infoCounts: Record<string, number>;
  migrationCandidates: Array<{ cardId: string }>;
  overlayCandidates: Array<{ cardId: string }>;
  generatedFactCandidates: Array<{ cardId: string }>;
  reviewCandidates: Array<{ cardId: string }>;
  warningClassificationByCard: Array<{
    cardId: string;
    warningClassificationCounts: Record<string, number>;
    info: string[];
  }>;
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
    needsManualReview: boolean;
    compiledPreview: Record<string, unknown>;
    mechanicalFactsFromGenerated: string[];
    strategyFieldsFromOverlay: string[];
    conflicts: unknown[];
    recommendedNextAction: string;
    migrationReadiness: string;
    warnings: Array<{
      kind: string;
      classification: string;
      blocking: boolean;
      field?: string;
    }>;
  }>;
};

describe("compiled hint index pilot report", () => {
  it("is deterministic against the committed report", () => {
    const first = runGateJson();
    const second = runGateJson();
    expect(first).toEqual(second);
    expect(first).toEqual(readReport());
  });

  it("compiles the full 193-card derived facts pilot without hard errors", () => {
    const report = readReport();
    expect(report.compiledCardCount).toBe(193);
    expect(report.overlayCardCount).toBe(6);
    expect(report.cardsWithoutOverlay).toBe(187);
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
      187,
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
      128,
    );
    expect(report.infoCounts.info_no_overlay_needed).toBe(61);
    expect(
      report.cards
        .filter((card) => !card.manualOverlayFound)
        .every((card) => !card.expectedManualOverlayNeeded),
    ).toBe(true);
    expect(
      report.cards.every((card) =>
        [
          "keep_current_no_action",
          "manual_overlay_candidate",
          "manual_review_candidate",
          "ready_for_generated_mechanical_fields",
          "ready_for_overlay_only_strategy_fields",
          "schema_descriptor_candidate",
        ].includes(card.recommendedNextAction),
      ),
    ).toBe(true);
  });

  it("classifies compiled-index warnings into non-blocking comparison groups", () => {
    const report = readReport();
    expect(report.warningCount).toBe(740);
    expect(report.warningClassificationCounts).toEqual({
      generated_fact_absent_from_monolith: 320,
      manual_review_candidate: 128,
      monolith_mechanical_duplication_candidate: 284,
      overlay_strategy_field_not_in_monolith: 8,
    });
    expect(
      report.cards.every((card) =>
        card.warnings.every((warning) => warning.blocking === false),
      ),
    ).toBe(true);
    expect(
      report.cards.every((card) =>
        card.warnings.every(
          (warning) => typeof warning.classification === "string",
        ),
      ),
    ).toBe(true);
  });

  it("classifies overlay-only strategy fields and generated mechanical candidates", () => {
    const report = readReport();
    const crystalPalace = report.cards.find(
      (card) => card.cardId === "onr_v1_355_crystal-palace-station-grid",
    );
    expect(crystalPalace?.warnings).toContainEqual(
      expect.objectContaining({
        kind: "manual_overlay_strategy_field_missing_from_active",
        classification: "overlay_strategy_field_not_in_monolith",
        field: "strategicNotes",
      }),
    );
    expect(report.migrationCandidates.length).toBe(193);
    expect(report.generatedFactCandidates.length).toBe(193);
    expect(report.overlayCandidates.length).toBe(126);
    expect(
      report.overlayCandidates.map((candidate) => candidate.cardId),
    ).toEqual(
      expect.arrayContaining([
        "onr_v1_008_boardwalk",
        "onr_v1_188_ai-chief-financial-officer",
        "onr_v1_194_corporate-downsizing",
        "onr_v1_197_data-fort-reclamation",
        "onr_v1_198_detroit-police-contract",
        "onr_v1_212_priority-requisition",
        "onr_v1_216_security-purge",
        "onr_v1_221_asp",
        "onr_v1_268_shock-r",
        "onr_v1_300_project-consultants",
      ]),
    );
  });

  it("keeps Self-Modifying Code in semantic review after AI019 program-search expansion", () => {
    const report = readReport();
    expect(
      report.reviewCandidates.some(
        (candidate) => candidate.cardId === "onr_v1_059_self-modifying-code",
      ),
    ).toBe(true);
    const selfModifyingCode = report.cards.find(
      (card) => card.cardId === "onr_v1_059_self-modifying-code",
    );
    expect(selfModifyingCode?.recommendedNextAction).toBe(
      "manual_review_candidate",
    );
    expect(selfModifyingCode?.migrationReadiness).toBe("needs_review");
    expect(selfModifyingCode?.needsManualReview).toBe(true);
    expect(report.hardErrorCount).toBe(0);
  });

  it("keeps Crystal Palace denylist protected in the compiled pilot", () => {
    const crystalPalace = readReport().cards.find(
      (card) => card.cardId === "onr_v1_355_crystal-palace-station-grid",
    );
    expect(crystalPalace).toBeDefined();
    expect(crystalPalace?.conflicts).toEqual([]);
  });

  it("keeps the compiled-index check separate from the runtime compiled artifact", () => {
    const aiHintsSource = fs.readFileSync(
      path.join(repoRoot, "packages/ai/src/ai-hints.ts"),
      "utf8",
    );
    expect(aiHintsSource).toContain("ai-card-hints-compiled.json");
    expect(aiHintsSource).not.toContain("check-ai-hint-compiled-index");
    expect(aiHintsSource).not.toContain("ai-hint-compiled-index-pilot-report");
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
        maxBuffer: 8 * 1024 * 1024,
      },
    ),
  ) as CompiledIndexReport;
}

function readReport(): CompiledIndexReport {
  return JSON.parse(fs.readFileSync(reportPath, "utf8")) as CompiledIndexReport;
}
