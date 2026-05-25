import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  validateAiHintOntologyFields,
  type AiHintOntologyExtension,
} from "./hint-ontology";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

const reportPath = path.join(
  repoRoot,
  "docs/reviews/ai/ai-derived-basic-facts-gate-2026-05-25.json",
);

const hiddenInfoFieldNames = [
  "opponentDeckList",
  "actualRndOrder",
  "privatePayload",
  "fullGameState",
];

type DerivedFactsReport = {
  pilotCardCount: number;
  implementationFoundCount: number;
  cardsWithDerivedFacts: number;
  cardsWithManualOntologyOverlap: number;
  cardsNeedingManualOverlay: number;
  hardErrorCount: number;
  hardConflicts: unknown[];
  cards: Array<{
    cardId: string;
    implementationFound: boolean;
    derivedFacts: AiHintOntologyExtension & {
      effects?: unknown[];
      conditions?: unknown[];
      breakerProfile?: unknown;
      remoteRole?: unknown;
    };
    overlap: {
      matches: string[];
    };
  }>;
};

describe("derived basic facts gate report", () => {
  it("is deterministic against the committed report", () => {
    const first = runGateJson();
    const second = runGateJson();
    expect(first).toEqual(second);
    expect(first).toEqual(readReport());
  });

  it("keeps the 24-card pilot complete", () => {
    const report = readReport();
    expect(report.pilotCardCount).toBe(24);
    expect(report.implementationFoundCount).toBe(24);
    expect(report.cardsWithDerivedFacts).toBe(24);
    expect(report.cardsWithManualOntologyOverlap).toBe(24);
    expect(report.cardsNeedingManualOverlay).toBe(9);
    expect(report.cards.every((card) => card.implementationFound)).toBe(true);
    expect(
      report.cards.every(
        (card) =>
          (card.derivedFacts.effects?.length ?? 0) > 0 ||
          (card.derivedFacts.conditions?.length ?? 0) > 0 ||
          card.derivedFacts.breakerProfile !== undefined ||
          card.derivedFacts.remoteRole !== undefined,
      ),
    ).toBe(true);
    expect(report.cards.every((card) => card.overlap.matches.length > 0)).toBe(
      true,
    );
  });

  it("validates generated facts against known ontology values", () => {
    for (const card of readReport().cards) {
      const result = validateAiHintOntologyFields(card.derivedFacts);
      expect(result.errors, card.cardId).toEqual([]);
    }
  });

  it("keeps the Crystal Palace hard conflict gate clean", () => {
    const report = readReport();
    expect(report.hardErrorCount).toBe(0);
    expect(report.hardConflicts).toEqual([]);
  });

  it("does not emit hidden-info fields in generated facts", () => {
    const serialized = JSON.stringify(
      readReport().cards.map((card) => card.derivedFacts),
    );
    for (const fieldName of hiddenInfoFieldNames) {
      expect(serialized).not.toContain(fieldName);
    }
  });
});

function runGateJson(): DerivedFactsReport {
  return JSON.parse(
    execFileSync(
      "node",
      ["scripts/check-ai-derived-facts.mjs", "--json", "--pilot-only"],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    ),
  ) as DerivedFactsReport;
}

function readReport(): DerivedFactsReport {
  return JSON.parse(fs.readFileSync(reportPath, "utf8")) as DerivedFactsReport;
}
