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
      targetProfiles?: Array<{
        zone?: string;
        lookCount?: number;
        targetCardType?: string;
        installsTarget?: boolean;
        shuffleAfter?: boolean;
        showToOpponent?: boolean;
      }>;
    };
    overlap: {
      matches: string[];
    };
    descriptorGaps: string[];
    missingManualOverlay: string[];
  }>;
};

describe("derived basic facts gate report", () => {
  it("is deterministic against the committed report", () => {
    const first = runGateJson();
    const second = runGateJson();
    expect(first).toEqual(second);
    expect(first).toEqual(readReport());
  });

  it("keeps the 50-card pilot complete", () => {
    const report = readReport();
    expect(report.pilotCardCount).toBe(50);
    expect(report.implementationFoundCount).toBe(50);
    expect(report.cardsWithDerivedFacts).toBe(50);
    expect(report.cardsWithManualOntologyOverlap).toBe(50);
    expect(report.cardsNeedingManualOverlay).toBe(3);
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

  it("captures the triaged mechanical gap improvements", () => {
    const report = readReport();
    const selfModifyingCode = cardById(
      report,
      "onr_v1_059_self-modifying-code",
    );
    expect(selfModifyingCode.derivedFacts.targetProfiles).toContainEqual(
      expect.objectContaining({
        zone: "stack",
        targetCardType: "program",
        installsTarget: true,
        shuffleAfter: true,
      }),
    );
    expect(selfModifyingCode.missingManualOverlay).toEqual([]);
    expect(selfModifyingCode.descriptorGaps).toEqual([]);

    const mysteryBox = cardById(report, "onr_v1_043_mystery-box");
    expect(mysteryBox.derivedFacts.targetProfiles).toContainEqual(
      expect.objectContaining({
        zone: "stack_top",
        lookCount: 5,
        targetCardType: "program",
        installsTarget: true,
        shuffleAfter: true,
        showToOpponent: true,
        oncePerRun: true,
      }),
    );

    const japaneseWaterTorture = cardById(
      report,
      "onr_v1_037_japanese-water-torture",
    );
    expect(japaneseWaterTorture.derivedFacts.breakerProfile).toEqual(
      expect.objectContaining({
        coverage: ["wall"],
        sideEffects: ["forgo_actions"],
      }),
    );
    expect(japaneseWaterTorture.descriptorGaps).toEqual([]);
    expect(mysteryBox.descriptorGaps).toEqual([]);

    const viral15 = cardById(report, "onr_v1_276_viral-15");
    expect(viral15.derivedFacts.effects).toContainEqual(
      expect.objectContaining({
        kind: "run_tax",
        amount: 1,
        source: "implementation.printedSubroutines.run_duration_jack_out_cost",
      }),
    );

    const redHerrings = cardById(report, "onr_v1_366_red-herrings");
    expect(redHerrings.derivedFacts.conditions).toContainEqual(
      expect.objectContaining({ kind: "requires_accessed_card" }),
    );

    const employeeEmpowerment = cardById(
      report,
      "onr_v1_199_employee-empowerment",
    );
    expect(employeeEmpowerment.derivedFacts.effects).toContainEqual(
      expect.objectContaining({
        kind: "draw",
        timing: "start_of_turn",
        scope: "corp",
        resource: "cards",
        amount: 1,
        source: "implementation.card_text.start_of_turn.draw",
      }),
    );
    expect(employeeEmpowerment.derivedFacts.effects).toContainEqual(
      expect.objectContaining({
        kind: "draw",
        timing: "scored_activated",
        scope: "corp",
        resource: "cards",
        amount: 2,
        source: "implementation.effect.draw_cards",
      }),
    );
    expect(employeeEmpowerment.derivedFacts.conditions).toContainEqual(
      expect.objectContaining({ kind: "requires_scored_agenda" }),
    );

    const tesseract = cardById(
      report,
      "onr_v1_370_tesseract-fort-construction",
    );
    expect(tesseract.derivedFacts.effects).toContainEqual(
      expect.objectContaining({ kind: "future_encounter_effect" }),
    );
    expect(tesseract.derivedFacts.remoteRole).toEqual(
      expect.objectContaining({ kind: "scoring_protection" }),
    );

    const namatoki = cardById(report, "onr_v1_361_namatoki-plaza");
    expect(namatoki.derivedFacts.remoteRole).toEqual(
      expect.objectContaining({ kind: "remote_capacity" }),
    );

    const chicagoBranch = cardById(report, "onr_v1_312_chicago-branch");
    expect(chicagoBranch.derivedFacts.effects).toContainEqual(
      expect.objectContaining({ kind: "score_acceleration" }),
    );

    const pileDriver = cardById(report, "onr_v1_047_pile-driver");
    expect(pileDriver.derivedFacts.breakerProfile).toEqual(
      expect.objectContaining({
        coverage: ["wall"],
        sideEffects: ["stealth_loss"],
      }),
    );

    const blink = cardById(report, "onr_v1_007_blink");
    expect(blink.derivedFacts.breakerProfile).toEqual(
      expect.objectContaining({
        coverage: ["universal"],
        sideEffects: ["once_per_subroutine", "random_failure"],
      }),
    );

    const dropp = cardById(report, "onr_v1_019_dropp");
    expect(dropp.derivedFacts.breakerProfile).toEqual(
      expect.objectContaining({
        coverage: ["universal"],
        sideEffects: ["ends_run_after_use"],
      }),
    );

    const bartmoss = cardById(
      report,
      "onr_v1_005_bartmoss-memorial-icebreaker",
    );
    expect(bartmoss.derivedFacts.breakerProfile).toEqual(
      expect.objectContaining({
        coverage: ["universal"],
        sideEffects: ["program_trash_risk", "random_failure"],
      }),
    );

    const replicator = cardById(report, "onr_v1_056_replicator");
    expect(replicator.derivedFacts.breakerProfile).toEqual(
      expect.objectContaining({ coverage: ["trace"] }),
    );

    const reflector = cardById(report, "onr_v1_055_reflector");
    expect(reflector.derivedFacts.breakerProfile).toEqual(
      expect.objectContaining({ coverage: ["ap"] }),
    );
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

function cardById(report: DerivedFactsReport, cardId: string) {
  const card = report.cards.find((candidate) => candidate.cardId === cardId);
  expect(card).toBeDefined();
  return card!;
}
