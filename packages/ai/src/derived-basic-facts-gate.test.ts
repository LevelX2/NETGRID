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

  it("keeps the 193-card pilot complete", () => {
    const report = readReport();
    expect(report.pilotCardCount).toBe(193);
    expect(report.implementationFoundCount).toBe(193);
    expect(report.cardsWithDerivedFacts).toBe(193);
    expect(report.cardsWithManualOntologyOverlap).toBe(149);
    expect(report.cardsNeedingManualOverlay).toBe(132);
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
    expect(
      report.cards.filter((card) => card.overlap.matches.length > 0).length,
    ).toBe(report.cardsWithManualOntologyOverlap);
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
    expect(selfModifyingCode.missingManualOverlay).toEqual(["effect:install"]);
    expect(selfModifyingCode.descriptorGaps).toEqual([
      "Manual ontology contains fields not currently derivable.",
    ]);

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
    expect(mysteryBox.descriptorGaps).toEqual([
      "Manual ontology contains fields not currently derivable.",
    ]);

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

    const microtech = cardById(report, "onr_v1_041_microtech-ai-interface");
    expect(microtech.derivedFacts.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "topdeck_info", scope: "rnd" }),
        expect.objectContaining({ kind: "zone_shuffle", scope: "rnd" }),
      ]),
    );
    expect(microtech.derivedFacts.conditions).toContainEqual(
      expect.objectContaining({ kind: "requires_accessed_card" }),
    );

    const executiveWiretaps = cardById(report, "onr_v1_085_executive-wiretaps");
    expect(executiveWiretaps.derivedFacts.effects).toContainEqual(
      expect.objectContaining({
        kind: "multiaccess",
        scope: "hq",
        amount: 3,
      }),
    );

    const editedShipping = cardById(
      report,
      "onr_v1_084_edited-shipping-manifests",
    );
    expect(editedShipping.derivedFacts.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "access_replacement", scope: "hq" }),
        expect.objectContaining({ kind: "economy", amount: 10 }),
        expect.objectContaining({ kind: "tag", amount: 1 }),
      ]),
    );

    const expertSchedule = cardById(
      report,
      "onr_v1_024_expert-schedule-analyzer",
    );
    expect(expertSchedule.derivedFacts.effects).toContainEqual(
      expect.objectContaining({ kind: "hq_info", scope: "hq" }),
    );

    const smarteye = cardById(report, "onr_v1_065_smarteye");
    expect(smarteye.derivedFacts.effects).toContainEqual(
      expect.objectContaining({ kind: "expose_info", scope: "ice" }),
    );

    const fetch = cardById(report, "onr_v1_243_fetch-4-0-1");
    expect(fetch.derivedFacts.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "trace", timing: "encounter" }),
        expect.objectContaining({
          kind: "tag_source",
          timing: "trace_success",
        }),
      ]),
    );
    expect(fetch.derivedFacts.conditions).toContainEqual(
      expect.objectContaining({ kind: "requires_trace_success" }),
    );

    const cinderella = cardById(report, "onr_v1_228_cinderella");
    expect(cinderella.derivedFacts.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "hardware_trash" }),
        expect.objectContaining({ kind: "damage", timing: "trace_success" }),
        expect.objectContaining({ kind: "etr" }),
      ]),
    );

    const shockR = cardById(report, "onr_v1_268_shock-r");
    expect(shockR.derivedFacts.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "future_encounter_effect" }),
        expect.objectContaining({ kind: "no_jack_out" }),
      ]),
    );
    expect(shockR.derivedFacts.conditions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "requires_later_encounter" }),
        expect.objectContaining({ kind: "requires_remaining_ice" }),
      ]),
    );

    const dataRaven = cardById(report, "onr_v1_236_data-raven");
    expect(dataRaven.derivedFacts.effects).toContainEqual(
      expect.objectContaining({ kind: "persistent_counter_effect" }),
    );

    const projectConsultants = cardById(
      report,
      "onr_v1_300_project-consultants",
    );
    expect(projectConsultants.derivedFacts.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "advance_burst", amount: 4 }),
        expect.objectContaining({ kind: "score_acceleration", amount: 4 }),
      ]),
    );
    expect(projectConsultants.derivedFacts.conditions).toContainEqual(
      expect.objectContaining({ kind: "requires_score_window" }),
    );

    const corporateDownsizing = cardById(
      report,
      "onr_v1_194_corporate-downsizing",
    );
    expect(corporateDownsizing.derivedFacts.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "agenda_reveal_economy" }),
        expect.objectContaining({ kind: "zone_shuffle", scope: "rnd" }),
      ]),
    );
    expect(corporateDownsizing.derivedFacts.conditions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "requires_agenda_in_hq" }),
        expect.objectContaining({ kind: "requires_agenda_reveal" }),
      ]),
    );

    const priorityRequisition = cardById(
      report,
      "onr_v1_212_priority-requisition",
    );
    expect(priorityRequisition.derivedFacts.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "rez_discount" }),
        expect.objectContaining({ kind: "rez" }),
      ]),
    );

    const aiCfo = cardById(report, "onr_v1_188_ai-chief-financial-officer");
    expect(aiCfo.derivedFacts.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "shuffle_draw" }),
        expect.objectContaining({ kind: "zone_shuffle", scope: "rnd" }),
      ]),
    );

    const detroitPolice = cardById(
      report,
      "onr_v1_198_detroit-police-contract",
    );
    expect(detroitPolice.derivedFacts.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "finite_economy_pool", amount: 12 }),
        expect.objectContaining({
          kind: "counter_economy",
          timing: "start_of_turn",
        }),
      ]),
    );
    expect(detroitPolice.derivedFacts.effects).not.toContainEqual(
      expect.objectContaining({
        kind: "counter_economy",
        timing: "scored_activated",
      }),
    );

    const emergencySelfConstruct = cardById(
      report,
      "onr_v1_022_emergency-self-construct",
    );
    expect(emergencySelfConstruct.derivedFacts.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "flatline_prevention" }),
        expect.objectContaining({ kind: "prevention_replacement" }),
        expect.objectContaining({ kind: "remove_brain_damage" }),
        expect.objectContaining({ kind: "meat_damage_prevention" }),
        expect.objectContaining({ kind: "action_penalty" }),
        expect.objectContaining({ kind: "hand_size_modifier" }),
      ]),
    );

    const joanOfArc = cardById(report, "onr_v1_038_joan-of-arc");
    expect(joanOfArc.derivedFacts.effects).toContainEqual(
      expect.objectContaining({ kind: "program_trash_prevention" }),
    );
    expect(joanOfArc.derivedFacts.conditions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "requires_program_trash" }),
        expect.objectContaining({ kind: "requires_installed_program" }),
      ]),
    );

    const shield = cardById(report, "onr_v1_061_shield");
    expect(shield.derivedFacts.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "damage_prevention" }),
        expect.objectContaining({ kind: "net_damage_prevention" }),
      ]),
    );
    expect(shield.derivedFacts.conditions).toContainEqual(
      expect.objectContaining({ kind: "requires_turn_limit_available" }),
    );

    const bakdoor = cardById(report, "onr_v1_004_bakdoor");
    expect(bakdoor.derivedFacts.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "base_link" }),
        expect.objectContaining({ kind: "trace_defense" }),
      ]),
    );

    const privateCybernetPolice = cardById(
      report,
      "onr_v1_213_private-cybernet-police",
    );
    expect(privateCybernetPolice.derivedFacts.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "scored_agenda_action" }),
        expect.objectContaining({ kind: "trace" }),
        expect.objectContaining({ kind: "tag_source" }),
      ]),
    );
    expect(privateCybernetPolice.derivedFacts.conditions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "requires_scored_agenda" }),
        expect.objectContaining({ kind: "requires_trace_success" }),
      ]),
    );

    const punitiveCounterstrike = cardById(
      report,
      "onr_v1_301_punitive-counterstrike",
    );
    expect(punitiveCounterstrike.derivedFacts.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "damage", amount: 2 }),
        expect.objectContaining({ kind: "tag_punish_payoff" }),
      ]),
    );
    expect(punitiveCounterstrike.derivedFacts.conditions).toContainEqual(
      expect.objectContaining({ kind: "requires_runner_tagged" }),
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
