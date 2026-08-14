import { cardSpecPlanningCards } from "@netgrid/cards/planning";
import { describe, expect, it } from "vitest";

import { deriveCardSpecAiHint } from "./card-spec-ai-hint-compiler";

function hint(cardId: string) {
  const entry = cardSpecPlanningCards().find(
    (candidate) => candidate.definition.id === cardId,
  );
  if (entry === undefined) throw new Error(`missing_test_card:${cardId}`);
  return deriveCardSpecAiHint(entry);
}

describe("random production-card sample semantic corrections", () => {
  it("classifies Aujourd'Oui as controller-known program search, not recovery", () => {
    const aujourdOui = hint("onr_v1_151_aujourdoui");

    expect(aujourdOui.planRoles).toEqual(
      expect.arrayContaining(["build_rig", "draw_for_answers"]),
    );
    expect(aujourdOui.planRoles).not.toContain("recover_rig");
    expect(aujourdOui.targetProfiles).toContainEqual({
      schemaVersion: "target-profile-v1",
      kind: "use_target",
      timing: "activated_ability",
      targetType: "program",
      purpose: "top_five_program_choice",
      preferences: ["program_repairs_missing_coverage"],
      hiddenInfoPolicy: "public_or_controller_known_only",
    });
  });

  it("classifies Time to Collect as resource protection with a positive choice preference", () => {
    const timeToCollect = hint("onr_proteus_153_time-to-collect");

    expect(timeToCollect.planRoles).toContain("protect_rig");
    expect(timeToCollect.planRoles).not.toContain("build_rig");
    expect(timeToCollect.planRoles).not.toContain("safe_probe_run");
    expect(timeToCollect.targetProfiles).toContainEqual({
      schemaVersion: "target-profile-v1",
      kind: "replacement_target",
      timing: "on_use",
      targetType: "card",
      purpose: "prevent_resource_trash_during_corp_turn",
      preferences: ["best_cards_for_current_plan"],
      hiddenInfoPolicy: "public_or_controller_known_only",
    });
  });

  it("keeps Namatoki as capacity support without protection or anchor semantics", () => {
    const namatoki = hint("onr_v1_361_namatoki-plaza");

    expect(namatoki.tacticSignals ?? []).not.toContain(
      "corp.remote_protection",
    );
    expect(namatoki.strategyAnchors ?? []).not.toContain("corp.remote_scoring");
    expect(namatoki.remoteRole).toEqual({
      kind: "remote_capacity",
      threatLevel: "medium",
      serverScope: "remote",
    });
    expect(namatoki.strategySupportPairs).toContainEqual(
      expect.objectContaining({
        strategyId: "corp.remote_scoring",
        roleDetail: "remote_capacity_expansion",
      }),
    );
  });

  it("projects Paris as fort-bound trace credit support without direct run tax", () => {
    const paris = hint("onr_v1_365_paris-city-grid");

    expect(paris.planRoles).not.toContain("remote_upgrade_tax");
    expect(paris.remoteRole).toBeUndefined();
    expect(paris.effects).toContainEqual({
      kind: "trace_credit",
      scope: "fort",
      timing: "during_run",
      resource: "credits",
      target: "trace.corp_credit_support",
      amount: 3,
      repeatable: true,
    });
    expect(paris.functionSignals).toContain("trace.corp_credit_support");
    expect(paris.functionSignals).not.toEqual(
      expect.arrayContaining([
        "condition.corp_installed_or_advanced_this_fort_last_turn",
        "run.corp_server_lock",
        "tax.remote",
      ]),
    );
    expect(paris.effects ?? []).not.toContainEqual(
      expect.objectContaining({ kind: "run_tax" }),
    );

    const actualServerLock = hint("onr_v1_368_roving-submarine");
    expect(actualServerLock.functionSignals).toEqual(
      expect.arrayContaining([
        "condition.corp_installed_or_advanced_this_fort_last_turn",
        "run.corp_server_lock",
        "tax.remote",
      ]),
    );
  });

  it("classifies Get Ready to Rumble as HQ pressure rather than rig or run setup", () => {
    const rumble = hint("onr_proteus_141_get-ready-to-rumble");

    expect(rumble.planRoles).toEqual(["pressure_hq"]);
    expect(rumble.functionSignals).toEqual(
      expect.arrayContaining([
        "corp.random_discard_pressure",
        "defense.damage_retaliation",
      ]),
    );
  });

  it("allows Crash Everett to evaluate controller-known drawn cards", () => {
    const crash = hint("onr_v1_157_crash-everett-inventive-fixer");

    expect(crash.targetProfiles).toContainEqual({
      schemaVersion: "target-profile-v1",
      kind: "replacement_target",
      timing: "replacement_window",
      targetType: "card",
      purpose: "filter_stack_for_current_setup_need",
      preferences: [
        "missing_current_coverage",
        "central_or_remote_plan_enabler",
      ],
      hiddenInfoPolicy: "public_or_controller_known_only",
    });
  });

  it("keeps information and ordinary ICE cards below strategy-anchor level", () => {
    const clerk = hint("onr_classic_046_executive-file-clerk");
    expect(clerk.strategyAnchors ?? []).not.toContain("runner.hq_pressure");
    expect(clerk.targetProfiles).toBeUndefined();

    for (const cardId of [
      "onr_proteus_035_roadblock",
      "onr_proteus_037_scaffolding",
      "onr_proteus_042_tumblers",
      "onr_v1_352_chester-mix",
    ]) {
      expect(hint(cardId).strategyAnchors ?? [], cardId).not.toContain(
        "corp.ice_tax_glacier",
      );
    }
    expect(hint("onr_proteus_035_roadblock").riskTags).toEqual(
      expect.arrayContaining([
        "deterministic_random",
        "self_derez",
        "automatic_pass_failure",
      ]),
    );
    expect(hint("onr_v1_352_chester-mix").strategySupportPairs).toContainEqual(
      expect.objectContaining({
        strategyId: "corp.ice_tax_glacier",
        roleDetail: "ice_install_discount_fort_builder",
      }),
    );
  });

  it("keeps run-history and HQ denial semantics aligned with their effects", () => {
    const manhunt = hint("onr_proteus_050_manhunt");
    expect(manhunt.planRoles ?? []).not.toContain("build_scoring_remote");
    expect(manhunt.strategySupportPairs).toContainEqual(
      expect.objectContaining({
        strategyId: "corp.tag_trace_punish",
        roleDetail: "scaling_trace_margin_tag_source",
      }),
    );

    const frameUp = hint("onr_proteus_109_frame-up");
    expect(frameUp.planRoles).toEqual(
      expect.arrayContaining(["pressure_hq", "pressure_rnd"]),
    );
    expect(frameUp.strategyAnchors ?? []).not.toContain(
      "runner.run_event_tempo",
    );

    const creditSubversion = hint("onr_proteus_136_credit-subversion");
    expect(creditSubversion.planRoles).toContain("pressure_hq");
    expect(creditSubversion.planRoles).not.toContain("safe_probe_run");
    expect(creditSubversion.tacticSignals ?? []).not.toContain("economy.card");
    expect(creditSubversion.strategyAnchors ?? []).not.toContain(
      "runner.hq_pressure",
    );
  });

  it("uses side-safe target semantics only for real ICE choices", () => {
    expect(hint("onr_v1_068_startup-immolator").targetProfiles).toBeUndefined();

    expect(
      hint("onr_v1_109_security-code-worm-chip").targetProfiles,
    ).toContainEqual(
      expect.objectContaining({
        purpose: "unrezzed_ice_trash",
        preferences: ["relevant_server_ice", "blocks_relevant_run_path"],
      }),
    );

    expect(hint("onr_proteus_060_herman-revista").targetProfiles).toContainEqual(
      expect.objectContaining({
        purpose: "rearrange_fort_ice",
        preferences: [
          "blocks_relevant_run_path",
          "adds_relevant_encounter_tax",
          "protects_agenda_remote",
        ],
        hiddenInfoPolicy: "public_or_controller_known_only",
      }),
    );

    const omni = hint("onr_v1_364_omni-kismet-ph-d");
    expect(omni.remoteRole).toEqual({
      kind: "ice_modifier",
      threatLevel: "medium",
      serverScope: "remote",
    });
    expect(omni.targetProfiles).toContainEqual(
      expect.objectContaining({
        purpose: "swap_unrezzed_fort_ice_with_hq_ice",
        preferences: [
          "relevant_server_ice",
          "blocks_relevant_run_path",
          "adds_relevant_encounter_tax",
          "protects_agenda_remote",
        ],
        hiddenInfoPolicy: "public_or_controller_known_only",
      }),
    );
  });
});
