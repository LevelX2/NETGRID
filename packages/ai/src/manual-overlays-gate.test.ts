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
  "docs/reviews/ai/ai-manual-overlay-pilot-report-2026-05-25.json",
);

const hiddenInfoFieldNames = [
  "opponentDeckList",
  "actualRndOrder",
  "privatePayload",
  "fullGameState",
];

const mechanicalFieldNames = [
  "effects",
  "conditions",
  "breakerProfile",
  "remoteRole",
  "targetProfiles",
  "aiSupportStatus",
];

type ManualOverlayReport = {
  overlayFileCount: number;
  overlayCardCount: number;
  hardErrorCount: number;
  warningCount: number;
  segmentScopes: Array<{
    overlayPath: string;
    set: string;
    side: string;
    cardType: string;
    cardCount: number;
  }>;
  cards: Array<{
    cardId: string;
    activeHintFound: boolean;
    sideMatches: boolean;
    cardTypeMatches: boolean;
    generatedFactsOverlap: unknown[];
    mechanicalDuplicationWarnings: unknown[];
    strategicOverlayFields: string[];
    hiddenInfoErrors: unknown[];
    conflicts: unknown[];
  }>;
};

describe("manual overlay pilot gate report", () => {
  it("is deterministic against the committed report", () => {
    const first = runGateJson();
    const second = runGateJson();
    expect(first).toEqual(second);
    expect(first).toEqual(readReport());
  });

  it("keeps the two read-only pilot segments scoped and complete", () => {
    const report = readReport();
    expect(report.overlayFileCount).toBe(2);
    expect(report.overlayCardCount).toBe(6);
    expect(report.segmentScopes).toEqual([
      {
        overlayPath: "data/ai/hints/overlays/onr-v1/corp/upgrades.json",
        set: "onr-v1",
        side: "corp",
        cardType: "upgrade",
        cardCount: 2,
      },
      {
        overlayPath: "data/ai/hints/overlays/onr-v1/runner/programs.json",
        set: "onr-v1",
        side: "runner",
        cardType: "program",
        cardCount: 4,
      },
    ]);
    expect(report.cards.every((card) => card.activeHintFound)).toBe(true);
    expect(report.cards.every((card) => card.sideMatches)).toBe(true);
    expect(report.cards.every((card) => card.cardTypeMatches)).toBe(true);
  });

  it("keeps overlays free of runtime, hidden-info, and duplicated mechanical facts", () => {
    const report = readReport();
    expect(report.hardErrorCount).toBe(0);
    expect(report.warningCount).toBe(21);
    expect(
      report.cards.every((card) => card.hiddenInfoErrors.length === 0),
    ).toBe(true);
    expect(
      report.cards.every(
        (card) => card.mechanicalDuplicationWarnings.length === 0,
      ),
    ).toBe(true);
    expect(
      report.cards.every((card) => card.generatedFactsOverlap.length === 0),
    ).toBe(true);
    expect(
      report.cards.every((card) => card.strategicOverlayFields.length > 0),
    ).toBe(true);
  });

  it("keeps Crystal Palace denylist protected in the overlay pilot", () => {
    const report = readReport();
    const crystalPalace = report.cards.find(
      (card) => card.cardId === "onr_v1_355_crystal-palace-station-grid",
    );
    expect(crystalPalace).toBeDefined();
    expect(crystalPalace?.conflicts).toEqual([]);
  });

  it("does not put blocked fields into pilot overlay files", () => {
    const overlayRoot = path.join(repoRoot, "data/ai/hints/overlays/onr-v1");
    const serialized = JSON.stringify(readJsonFiles(overlayRoot));
    for (const fieldName of hiddenInfoFieldNames.concat(mechanicalFieldNames)) {
      expect(serialized).not.toContain(`"${fieldName}"`);
    }
  });
});

function runGateJson(): ManualOverlayReport {
  return JSON.parse(
    execFileSync("node", ["scripts/check-ai-manual-overlays.mjs", "--json"], {
      cwd: repoRoot,
      encoding: "utf8",
    }),
  ) as ManualOverlayReport;
}

function readReport(): ManualOverlayReport {
  return JSON.parse(fs.readFileSync(reportPath, "utf8")) as ManualOverlayReport;
}

function readJsonFiles(dir: string): unknown[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return readJsonFiles(entryPath);
    if (!entry.name.endsWith(".json")) return [];
    return [JSON.parse(fs.readFileSync(entryPath, "utf8"))];
  });
}
