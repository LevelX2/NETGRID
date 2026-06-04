import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const inspectorIndexPath = path.join(repoRoot, "data/ai/ai-hint-inspector-index.json");
const compiledHintsPath = path.join(repoRoot, "data/ai/ai-card-hints-compiled.json");

type AiHintInspectorIndex = {
  schemaVersion: string;
  source: {
    compiledHintsPath: string;
    functionSignalDerivationPath: string;
    tacticSignalCatalogPath?: string;
  };
  summary: {
    cardCount: number;
    cardsWithMechanicalFacts: number;
    cardsWithFunctionSignals: number;
    cardsWithStrategyAnchors: number;
  };
  cards: Array<{
    cardId: string;
    supportStatus: {
      compiledHintFound: boolean;
      mechanicalFactsFound: boolean;
      generatedFactsFound: boolean;
    };
    derivedFunctionSignals: string[];
    derivedStrategyAnchors: string[];
    cardLevelStrategyAnchors: string[];
    derivedPossibleStrategyAnchors: string[];
    reviewedStrategySupportPairs: Array<{
      strategyId: string;
      sourceField: string;
      sourceValue: string;
      triageCategory: string;
      rationale: string;
    }>;
    supportingEvidenceOnly: string[];
    lineSupportClassification: Array<{
      value: string;
      triageCategory: string;
      mapsTo: string[];
    }>;
    rolesClassification: Array<{ value: string; triageCategory: string }>;
    planRolesClassification: Array<{ value: string; triageCategory: string }>;
    warningCategories: string[];
    strategicRoleStatus: { values: string[] };
  }>;
};

describe("AI005 hint inspector index", () => {
  it("is deterministic against the committed artifact", () => {
    execFileSync("node", ["scripts/build-ai-hint-inspector-index.mjs", "--check"], {
      cwd: repoRoot,
      encoding: "utf8",
    });
  });

  it("exposes compiled, mechanical, function-signal and warning classifications without runtime fields", () => {
    const index = readIndex();
    expect(index.schemaVersion).toBe("ai-hint-inspector-index-v1");
    expect(index.source.compiledHintsPath).toBe("data/ai/ai-card-hints-compiled.json");
    expect(index.source.functionSignalDerivationPath).toBe(
      "data/ai/function-signal-derivation-v1.json",
    );
    expect(index.source.tacticSignalCatalogPath).toBe(
      "data/ai/tactic-signals-v1.json",
    );
    expect(index.summary.cardCount).toBeGreaterThan(400);
    expect(index.summary.cardsWithMechanicalFacts).toBeGreaterThan(300);
    expect(index.summary.cardsWithFunctionSignals).toBeGreaterThan(300);
    expect(index.summary.cardsWithStrategyAnchors).toBeGreaterThan(100);

    const aiBoon = card(index, "onr_v1_002_ai-boon");
    expect(aiBoon.supportStatus).toMatchObject({
      compiledHintFound: true,
      mechanicalFactsFound: true,
    });
    expect(aiBoon.derivedFunctionSignals).toContain("breaker.sentry");
    expect(aiBoon.lineSupportClassification).toEqual([]);
    expect(aiBoon.warningCategories).not.toContain("legacy_lineSupport");
    expect(aiBoon.warningCategories).toContain("deferred_requires_human_review");

    const clown = card(index, "onr_v1_012_clown");
    expect(clown.supportStatus.generatedFactsFound).toBe(true);
    expect(clown.rolesClassification).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          value: "ice_modifier",
          triageCategory: "function_signal_only",
        }),
      ]),
    );

    expect(JSON.stringify(index)).not.toMatch(
      /"cardInstances"|"privatePayload"|"fullState"|"stateHash"|"actionId"/,
    );
  });

  it("exposes AI016 tactic-signal derivation fixes without broad legacy anchors", () => {
    const index = readIndex();
    const blackIceQualityAssurance = card(
      index,
      "onr_v1_191_black-ice-quality-assurance",
    );
    const iceTransmutation = card(index, "onr_v1_204_ice-transmutation");
    const doppelganger = card(
      index,
      "onr_proteus_057_doppelganger-antibody",
    );
    const closedAccounts = card(index, "onr_v1_285_closed-accounts");
    const onCallSoloTeam = card(index, "onr_v1_208_on-call-solo-team");
    const aiBoardMember = card(index, "onr_proteus_001_ai-board-member");
    const networkedCenter = card(index, "onr_proteus_065_networked-center");
    const canisMinor = card(index, "onr_v1_226_canis-minor");

    expect(blackIceQualityAssurance.derivedFunctionSignals).toContain(
      "ice.strength_modifier",
    );
    expect(blackIceQualityAssurance.derivedStrategyAnchors).toContain(
      "corp.ice_tax_glacier",
    );
    expect(blackIceQualityAssurance.derivedStrategyAnchors).not.toContain(
      "corp.remote_scoring",
    );

    expect(iceTransmutation.derivedFunctionSignals).toContain(
      "ice.strength_modifier",
    );
    expect(iceTransmutation.derivedFunctionSignals).toContain(
      "ice.subroutine_modifier",
    );
    expect(iceTransmutation.derivedStrategyAnchors).toContain(
      "corp.ice_tax_glacier",
    );
    expect(iceTransmutation.derivedStrategyAnchors).not.toContain(
      "corp.remote_scoring",
    );

    expect(doppelganger.derivedFunctionSignals).toEqual(
      expect.arrayContaining([
        "access.punish",
        "economy.counter",
        "tax.runner_credit",
        "tax.runner_persistent",
      ]),
    );
    expect(doppelganger.derivedStrategyAnchors).toContain(
      "corp.ambush_bluff",
    );
    expect(doppelganger.derivedStrategyAnchors).not.toContain(
      "corp.asset_economy",
    );

    expect(closedAccounts.derivedFunctionSignals).toEqual(
      expect.arrayContaining(["tag.payoff", "tax.runner_credit"]),
    );
    expect(closedAccounts.derivedStrategyAnchors).toContain(
      "corp.tag_trace_punish",
    );
    expect(closedAccounts.derivedStrategyAnchors).not.toContain(
      "corp.damage_kill",
    );

    expect(onCallSoloTeam.derivedFunctionSignals).toEqual(
      expect.arrayContaining([
        "damage.payoff",
        "score.agenda_action",
        "tag.payoff",
      ]),
    );
    expect(onCallSoloTeam.supportingEvidenceOnly).toContain("damage.payoff");
    expect(onCallSoloTeam.derivedStrategyAnchors).not.toContain(
      "corp.damage_kill",
    );
    expect(onCallSoloTeam.cardLevelStrategyAnchors).toContain(
      "corp.damage_kill",
    );
    expect(onCallSoloTeam.derivedStrategyAnchors).toContain(
      "corp.tag_trace_punish",
    );
    expect(onCallSoloTeam.derivedStrategyAnchors).not.toContain(
      "corp.fast_advance",
    );

    expect(aiBoardMember.derivedStrategyAnchors).not.toContain(
      "corp.fast_advance",
    );
    expect(networkedCenter.derivedFunctionSignals).toContain(
      "score.agenda_difficulty_discount",
    );
    expect(networkedCenter.derivedStrategyAnchors).not.toContain(
      "corp.fast_advance",
    );
    expect(networkedCenter.cardLevelStrategyAnchors).toContain(
      "corp.remote_scoring",
    );
    expect(canisMinor.derivedFunctionSignals).toContain("tax.ice");
    expect(canisMinor.derivedStrategyAnchors).toContain(
      "corp.ice_tax_glacier",
    );
  });

  it("exposes AI018 icebreaker sweep signals without planner-facing anchors", () => {
    const index = readIndex();
    const blackWidow = card(index, "onr_proteus_080_black-widow");
    const bartmoss = card(index, "onr_v1_005_bartmoss-memorial-icebreaker");
    const morphingTool = card(index, "onr_proteus_092_morphing-tool");
    const fubar = card(index, "onr_proteus_088_fubar");
    const dogcatcher = card(index, "onr_v1_018_dogcatcher");
    const dropp = card(index, "onr_v1_019_dropp");
    const flak = card(index, "onr_v1_027_flak");
    const japaneseWaterTorture = card(index, "onr_v1_037_japanese-water-torture");
    const bigFrackinGun = card(index, "onr_proteus_079_big-frackin-gun");
    const clown = card(index, "onr_v1_012_clown");
    const reflector = card(index, "onr_v1_055_reflector");
    const airportLocker = card(index, "onr_proteus_128_airport-locker");
    const cloak = card(index, "onr_v1_011_cloak");
    const lockjaw = card(index, "onr_proteus_091_lockjaw");
    const personalTouch = card(index, "onr_proteus_115_personal-touch-the");
    const dealWithMilitech = card(index, "onr_v1_082_deal-with-militech");
    const pattelsVirus = card(index, "onr_v1_046_pattels-virus");
    const afreet = card(index, "onr_v1_001_afreet");
    const microtechBackupDrive = card(index, "onr_v1_131_microtech-backup-drive");
    const gideonsPawnshop = card(index, "onr_v1_089_gideons-pawnshop");
    const ifYouWantItDoneRight = card(
      index,
      "onr_v1_093_if-you-want-it-done-right",
    );
    const mantis = card(index, "onr_v1_099_mantis-fixer-at-large");
    const compiledBlackWidow = compiledCard("onr_proteus_080_black-widow");
    const compiledMorphingTool = compiledCard("onr_proteus_092_morphing-tool");

    expect(blackWidow.derivedFunctionSignals).toEqual(
      expect.arrayContaining([
        "breaker.sentry",
        "breaker.targeted_ice_bonus",
        "breaker.strength_bonus_vs_chosen_ice",
      ]),
    );
    expect(blackWidow.derivedStrategyAnchors).toEqual([]);

    expect(bartmoss.derivedFunctionSignals).toEqual(
      expect.arrayContaining([
        "breaker.risky",
        "breaker.self_trash_risk",
        "breaker.universal",
      ]),
    );
    expect(bartmoss.derivedStrategyAnchors).toEqual([]);
    expect(bartmoss.strategicRoleStatus.values).toContain("emergency_tool");

    expect(morphingTool.derivedFunctionSignals).toEqual(
      expect.arrayContaining([
        "breaker.configurable_coverage",
        "breaker.reconfigurable_type",
      ]),
    );
    expect(morphingTool.derivedFunctionSignals).not.toContain(
      "breaker.universal",
    );
    expect(morphingTool.derivedFunctionSignals).not.toContain(
      "breaker.unknown_special",
    );
    expect(morphingTool.derivedStrategyAnchors).toEqual([]);

    expect(fubar.derivedFunctionSignals).toEqual(
      expect.arrayContaining([
        "breaker.configurable_coverage",
        "breaker.one_time_mode_choice",
        "breaker.stealth_payment_loss",
      ]),
    );
    expect(fubar.derivedFunctionSignals).not.toContain("breaker.unknown_special");
    expect(fubar.derivedStrategyAnchors).toEqual([]);

    expect(dogcatcher.derivedFunctionSignals).toEqual(
      expect.arrayContaining([
        "breaker.sentry_subtype_limited",
        "breaker.subtype.bloodhound",
        "breaker.subtype.hellhound",
        "breaker.subtype.pit_bull",
        "breaker.subtype.watchdog",
      ]),
    );
    expect(dogcatcher.derivedFunctionSignals).not.toContain(
      "breaker.watchdog",
    );
    expect(dogcatcher.derivedFunctionSignals).not.toContain("breaker.sentry");
    expect(dogcatcher.derivedStrategyAnchors).toEqual([]);

    expect(dropp.derivedFunctionSignals).toEqual(
      expect.arrayContaining([
        "breaker.break_any_subroutine",
        "breaker.ends_run_after_use",
        "defense.encounter_threat_mitigation",
        "encounter.emergency_subroutine_prevention",
      ]),
    );
    expect(dropp.derivedFunctionSignals).not.toContain("breaker.universal");
    expect(dropp.derivedStrategyAnchors).toEqual([]);
    expect(dropp.supportingEvidenceOnly).toEqual(
      expect.arrayContaining([
        "breaker.break_any_subroutine",
        "breaker.ends_run_after_use",
        "defense.encounter_threat_mitigation",
        "encounter.emergency_subroutine_prevention",
      ]),
    );

    expect(flak.derivedFunctionSignals).toContain("breaker.ap");
    expect(flak.derivedFunctionSignals).not.toContain(
      "breaker.ap_subtype_limited",
    );
    expect(flak.derivedFunctionSignals).not.toContain("breaker.subtype.stun");
    expect(flak.derivedStrategyAnchors).toEqual([]);

    expect(japaneseWaterTorture.derivedFunctionSignals).toEqual(
      expect.arrayContaining(["breaker.delayed_action_cost", "breaker.wall"]),
    );
    expect(japaneseWaterTorture.derivedStrategyAnchors).toEqual([]);
    expect(bigFrackinGun.derivedFunctionSignals).toEqual(
      expect.arrayContaining([
        "breaker.multi_subroutine_break",
        "breaker.sentry",
      ]),
    );
    expect(bigFrackinGun.derivedStrategyAnchors).toEqual([]);

    expect(clown.derivedFunctionSignals).toEqual(
      expect.arrayContaining([
        "breaker.support",
        "ice.strength_reduction",
        "run.break_cost_support",
      ]),
    );
    expect(clown.derivedStrategyAnchors).toEqual([]);
    expect(clown.strategicRoleStatus.values).not.toContain("support_tool");

    expect(reflector.derivedFunctionSignals).toEqual(
      expect.arrayContaining([
        "breaker.ap_subtype_limited",
        "breaker.subtype.hellbolt",
        "breaker.subtype.knockout",
        "breaker.subtype.stun",
      ]),
    );
    expect(reflector.derivedFunctionSignals).not.toContain("breaker.ap");
    expect(reflector.derivedFunctionSignals).not.toContain("breaker.sentry");
    expect(reflector.derivedStrategyAnchors).toEqual([]);

    expect(cloak.derivedFunctionSignals).toEqual(
      expect.arrayContaining([
        "economy.recurring",
        "economy.recurring_breaker_credit",
      ]),
    );
    expect(cloak.derivedFunctionSignals).not.toContain("economy.trash_credit");
    expect(cloak.derivedStrategyAnchors).toEqual([]);
    expect(cloak.strategicRoleStatus.values).not.toContain("support_tool");

    for (const supportCard of [lockjaw, personalTouch, dealWithMilitech]) {
      expect(supportCard.derivedFunctionSignals).toEqual(
        expect.arrayContaining([
          "breaker.support",
          "run.break_cost_support",
        ]),
      );
      expect(supportCard.derivedFunctionSignals).not.toContain(
        "ice.strength_reduction",
      );
      expect(supportCard.derivedStrategyAnchors).toEqual([]);
    }
    expect(lockjaw.strategicRoleStatus.values).not.toContain("support_tool");
    for (const supportCard of [personalTouch, dealWithMilitech]) {
      expect(supportCard.strategicRoleStatus.values).toContain("support_tool");
    }

    expect(pattelsVirus.derivedFunctionSignals).toEqual(
      expect.arrayContaining([
        "breaker.support",
        "ice.strength_reduction",
        "run.break_cost_support",
      ]),
    );
    expect(pattelsVirus.derivedStrategyAnchors).toEqual([]);

    expect(afreet.derivedFunctionSignals).toEqual(
      expect.arrayContaining([
        "breaker.hosted_strength_penalty",
        "setup.program_host",
      ]),
    );
    expect(afreet.derivedStrategyAnchors).toEqual([]);

    expect(airportLocker.derivedFunctionSignals).toEqual(
      expect.arrayContaining([
        "breaker.emergency_search",
        "breaker.search_during_encounter",
        "setup.install_support",
        "setup.search",
      ]),
    );
    expect(airportLocker.derivedStrategyAnchors).toEqual([
      "runner.search.breaker",
    ]);
    for (const genericSearchOrRecovery of [
      microtechBackupDrive,
      gideonsPawnshop,
      ifYouWantItDoneRight,
      mantis,
    ]) {
      expect(genericSearchOrRecovery.derivedStrategyAnchors).toEqual([]);
    }
    expect(compiledBlackWidow.targetProfiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          schemaVersion: "target-profile-v1",
          kind: "install_target",
          targetType: "installed_ice",
        }),
      ]),
    );
    expect(compiledMorphingTool.targetProfiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          schemaVersion: "target-profile-v1",
          kind: "mode_choice",
          targetType: "ice_type",
        }),
      ]),
    );
    expect(JSON.stringify(airportLocker)).not.toMatch(
      /actualStackOrder|hiddenCards|privatePayload|cardInstances/,
    );
  });

  it("exposes AI020 runner hardware semantics without broad support anchors", () => {
    const index = readIndex();
    const hqInterface = card(index, "onr_v1_129_hq-interface");
    const rdInterface = card(index, "onr_v1_139_r-and-d-interface");
    const fullBodyConversion = card(index, "onr_v1_127_full-body-conversion");
    const microtechBackupDrive = card(index, "onr_v1_131_microtech-backup-drive");
    const microtechTrodeSet = card(index, "onr_v1_132_microtech-trode-set");
    const ravenOwl = card(index, "onr_v1_141_raven-microcyb-owl");
    const nasukoCycle = card(index, "onr_v1_135_nasuko-cycle");
    const corticalStimulators = card(index, "onr_proteus_135_cortical-stimulators");
    const recordReconstructor = card(index, "onr_v1_142_record-reconstructor");
    const lucidrine = card(index, "onr_proteus_144_lucidrinetm-drip-feed");
    const bodyweight = card(index, "onr_v1_123_bodyweight-data-creche");

    expect(hqInterface.derivedFunctionSignals).toContain("access.hq_multiaccess");
    expect(hqInterface.derivedStrategyAnchors).toEqual([
      "runner.hq_pressure",
      "runner.interface_closeout",
    ]);
    expect(rdInterface.derivedFunctionSignals).toContain("access.rnd_multiaccess");
    expect(rdInterface.derivedStrategyAnchors).toEqual([
      "runner.interface_closeout",
      "runner.rnd_pressure",
    ]);

    expect(fullBodyConversion.derivedFunctionSignals).toEqual(
      expect.arrayContaining([
        "defense.damage_prevention",
        "defense.pay_through_prevention",
      ]),
    );
    expect(fullBodyConversion.derivedFunctionSignals).not.toEqual(
      expect.arrayContaining([
        "setup.cybernetics",
        "setup.memory_chip",
        "setup.vehicle",
      ]),
    );
    expect(fullBodyConversion.derivedStrategyAnchors).toEqual([]);

    expect(microtechBackupDrive.derivedFunctionSignals).toEqual(
      expect.arrayContaining([
        "setup.program_backup",
        "setup.program_recovery",
        "setup.program_trash_replacement",
        "setup.stored_program_reclaim",
      ]),
    );
    expect(microtechBackupDrive.derivedStrategyAnchors).toEqual([]);
    expect(microtechTrodeSet.derivedFunctionSignals).toEqual(
      expect.arrayContaining([
        "defense.ap_subroutine_mitigation",
        "run.break_cost_penalty",
      ]),
    );
    expect(microtechTrodeSet.derivedFunctionSignals).not.toContain("breaker.ap");
    expect(ravenOwl.derivedFunctionSignals).toContain(
      "economy.recurring_non_noisy_breaker_credit",
    );
    expect(nasukoCycle.derivedFunctionSignals).toContain("defense.tag_prevention");
    expect(nasukoCycle.derivedStrategyAnchors).toEqual([]);
    expect(corticalStimulators.derivedStrategyAnchors).toEqual([]);
    expect(recordReconstructor.derivedFunctionSignals).toEqual(
      expect.arrayContaining([
        "access.rnd_topdeck_setup",
        "run.archives_replacement_access",
      ]),
    );
    expect(recordReconstructor.derivedStrategyAnchors).toEqual([]);
    expect(lucidrine.derivedFunctionSignals).toEqual(
      expect.arrayContaining([
        "action.recurring_extra_action",
        "risk.brain_damage_self_inflicted",
      ]),
    );
    expect(lucidrine.derivedStrategyAnchors).toEqual([]);
    expect(bodyweight.derivedFunctionSignals).toContain("run.extra_run_after_success");
    expect(bodyweight.derivedStrategyAnchors).toEqual([]);
  });
});

function readIndex(): AiHintInspectorIndex {
  return JSON.parse(fs.readFileSync(inspectorIndexPath, "utf8")) as AiHintInspectorIndex;
}

function card(index: AiHintInspectorIndex, cardId: string) {
  const found = index.cards.find((entry) => entry.cardId === cardId);
  if (!found) throw new Error(`Missing inspector card ${cardId}`);
  return found;
}

function compiledCard(cardId: string): { targetProfiles?: unknown[] } {
  const compiled = JSON.parse(fs.readFileSync(compiledHintsPath, "utf8")) as {
    cards: Array<{ cardId: string; targetProfiles?: unknown[] }>;
  };
  const found = compiled.cards.find((entry) => entry.cardId === cardId);
  if (!found) throw new Error(`Missing compiled card ${cardId}`);
  return found;
}
