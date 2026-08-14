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
  it("keeps Batch 3 target profiles attached only to real, side-safe choices", () => {
    expect(
      hint("onr_proteus_053_underworld-mole").targetProfiles,
    ).toContainEqual({
      schemaVersion: "target-profile-v1",
      kind: "use_target",
      timing: "on_play",
      targetType: "resource",
      purpose: "trash_recently_installed_runner_resource",
      preferences: [
        "best_cards_for_current_plan",
        "best_cards_for_current_state",
      ],
      avoid: ["unknown_low_information_target"],
      hiddenInfoPolicy: "legal_targets_only",
    });
    expect(hint("onr_v1_065_smarteye").targetProfiles).toBeUndefined();
    expect(
      hint("onr_v1_092_ice-and-datas-guide-to-the-net").targetProfiles,
    ).toBeUndefined();

    const specialReport = hint("onr_proteus_111_ice-and-data-special-report");
    expect(specialReport.targetProfiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          purpose: "server_recon",
          timing: "on_play",
          targetType: "server",
          hiddenInfoPolicy: "legal_targets_only",
        }),
        expect.objectContaining({
          purpose: "server_recon_card_selection",
          timing: "on_play",
          targetType: "card",
          hiddenInfoPolicy: "legal_targets_only",
        }),
      ]),
    );

    expect(
      hint("onr_v1_093_if-you-want-it-done-right").targetProfiles,
    ).toContainEqual({
      schemaVersion: "target-profile-v1",
      kind: "use_target",
      timing: "on_play",
      targetType: "card",
      purpose: "top_five_choice_and_reorder",
      preferences: [
        "best_cards_for_current_plan",
        "best_cards_for_current_state",
      ],
      hiddenInfoPolicy: "public_or_controller_known_only",
    });
  });

  it("calibrates Batch 3 roles, anchors, remote roles, and risks", () => {
    expect(hint("onr_proteus_053_underworld-mole").planRoles).not.toContain(
      "build_scoring_remote",
    );
    expect(
      hint("onr_proteus_053_underworld-mole").strategyAnchors ?? [],
    ).not.toContain("corp.tag_trace_punish");
    expect(hint("onr_v1_065_smarteye").strategyAnchors ?? []).not.toContain(
      "runner.run_event_tempo",
    );
    expect(hint("onr_v1_368_roving-submarine").remoteRole).toEqual({
      kind: "scoring_protection",
      threatLevel: "medium",
      serverScope: "remote",
    });
    expect(
      hint("onr_proteus_072_research-bunker").tacticSignals ?? [],
    ).not.toContain("corp.remote_protection");
    expect(hint("onr_proteus_007_project-venice").strategyAnchors).toContain(
      "corp.overadvance_value",
    );
    expect(
      hint("onr_proteus_017_credit-blocks").strategyAnchors ?? [],
    ).not.toContain("corp.ice_tax_glacier");
    expect(hint("onr_proteus_116_pirate-broadcast").riskTags).toContain(
      "future_action_debt_on_failed_run_sequence",
    );
    expect(
      hint("onr_proteus_116_pirate-broadcast").strategyAnchors ?? [],
    ).not.toContain("runner.run_event_tempo");
    expect(hint("onr_v1_037_japanese-water-torture").riskTags).toContain(
      "variable_future_action_debt",
    );
  });

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

    expect(
      hint("onr_proteus_060_herman-revista").targetProfiles,
    ).toContainEqual(
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

  it("keeps Batch 4 roles and anchors aligned with the actual card effects", () => {
    expect(
      hint("onr_classic_006_bolter-swarm").strategyAnchors ?? [],
    ).not.toContain("corp.economy_rez_reserve");
    expect(hint("onr_classic_015_vortex").strategyAnchors).toEqual([
      "corp.ice_tax_glacier",
    ]);
    expect(
      hint("onr_v1_050_r-and-d-protocol-files").strategyAnchors ?? [],
    ).not.toContain("runner.rnd_pressure");
    expect(hint("onr_proteus_048_data-sifters").planRoles ?? []).not.toContain(
      "build_scoring_remote",
    );
    expect(
      hint("onr_proteus_048_data-sifters").strategyAnchors ?? [],
    ).not.toContain("corp.tag_trace_punish");
    expect(
      hint("onr_proteus_068_pattel-antibody").planRoles ?? [],
    ).not.toContain("build_scoring_remote");
    expect(hint("onr_v1_138_pk-6089a").planRoles).toEqual(
      expect.arrayContaining(["build_rig", "trace_bid_support"]),
    );
    expect(hint("onr_v1_138_pk-6089a").tacticSignals ?? []).not.toContain(
      "economy.card",
    );
    expect(hint("onr_proteus_110_hijack").planRoles).toContain("build_rig");
    expect(hint("onr_proteus_110_hijack").planRoles).not.toContain(
      "recover_economy",
    );
  });

  it("binds Batch 4 choices to controller-known mechanical owners", () => {
    expect(hint("onr_v1_046_pattels-virus").targetProfiles).toContainEqual(
      expect.objectContaining({
        purpose: "place_strength_reduction_counter_on_fully_broken_ice",
        targetType: "installed_ice",
        hiddenInfoPolicy: "visible_or_known_only",
      }),
    );
    expect(hint("onr_v1_089_gideons-pawnshop").targetProfiles).toContainEqual(
      expect.objectContaining({
        purpose: "generic_heap_recovery",
        targetType: "card",
        hiddenInfoPolicy: "public_or_controller_known_only",
      }),
    );
    expect(hint("onr_v1_103_organ-donor").targetProfiles).toContainEqual(
      expect.objectContaining({
        purpose: "convert_expendable_grip_cards_to_credits",
        targetType: "card",
        hiddenInfoPolicy: "public_or_controller_known_only",
      }),
    );
    expect(hint("onr_v1_316_cowboy-sysop").targetProfiles).toContainEqual(
      expect.objectContaining({
        purpose: "protect_or_reuse_installed_corp_card",
        targetType: "card",
        hiddenInfoPolicy: "public_or_controller_known_only",
      }),
    );
    expect(
      hint("onr_proteus_106_disgruntled-ice-technician").targetProfiles ?? [],
    ).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ purpose: "derez_fully_broken_ice" }),
      ]),
    );
    expect(hint("onr_proteus_110_hijack").targetProfiles).toContainEqual(
      expect.objectContaining({
        purpose: "install_best_legal_target",
        hiddenInfoPolicy: "public_or_controller_known_only",
      }),
    );
  });

  it("models Batch 4 run payoff and closeout semantics without unconditional priority", () => {
    expect(
      hint("onr_proteus_113_live-news-feed").targetProfiles,
    ).toContainEqual(
      expect.objectContaining({
        purpose: "maximize_live_news_feed_aftermath",
        targetType: "server",
      }),
    );
    expect(hint("onr_proteus_113_live-news-feed").riskTags).toContain(
      "self_tag",
    );
    expect(
      hint("onr_proteus_125_subliminal-corruption").targetProfiles,
    ).toContainEqual(
      expect.objectContaining({
        purpose: "maximize_advertisement_trash_during_run",
        targetType: "server",
      }),
    );
    for (const cardId of [
      "onr_v1_083_desperate-competitor",
      "onr_v1_090_hot-tip-for-wns",
    ]) {
      expect(hint(cardId).planRoles).toContain("score_now");
      expect(hint(cardId).lineSupport).toContain("score_closeout");
      expect(hint(cardId).strategyAnchors).toBeUndefined();
    }
  });
});
