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
      hint(111).targetProfiles,
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
    expect(hint(277).targetProfiles).toBeUndefined();
    expect(
      hint(304).targetProfiles,
    ).toBeUndefined();

    const specialReport = hint(169);
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
      hint(305).targetProfiles,
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
    expect(hint(111).planRoles).not.toContain(
      "build_scoring_remote",
    );
    expect(
      hint(111).strategyAnchors ?? [],
    ).not.toContain("corp.tag_trace_punish");
    expect(hint(277).strategyAnchors ?? []).not.toContain(
      "runner.run_event_tempo",
    );
    expect(hint(580).remoteRole).toEqual({
      kind: "scoring_protection",
      threatLevel: "medium",
      serverScope: "remote",
    });
    expect(
      hint(130).tacticSignals ?? [],
    ).not.toContain("corp.remote_protection");
    expect(hint(65).strategyAnchors).toContain(
      "corp.overadvance_value",
    );
    expect(
      hint(75).strategyAnchors ?? [],
    ).not.toContain("corp.ice_tax_glacier");
    expect(hint(174).riskTags).toContain(
      "future_action_debt_on_failed_run_sequence",
    );
    expect(
      hint(174).strategyAnchors ?? [],
    ).not.toContain("runner.run_event_tempo");
    expect(hint(249).riskTags).toContain(
      "variable_future_action_debt",
    );
  });

  it("classifies Aujourd'Oui as controller-known program search, not recovery", () => {
    const aujourdOui = hint(363);

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
    const timeToCollect = hint(211);

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
    const namatoki = hint(573);

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
    const paris = hint(577);

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

    const actualServerLock = hint(580);
    expect(actualServerLock.functionSignals).toEqual(
      expect.arrayContaining([
        "condition.corp_installed_or_advanced_this_fort_last_turn",
        "run.corp_server_lock",
        "tax.remote",
      ]),
    );
  });

  it("classifies Get Ready to Rumble as HQ pressure rather than rig or run setup", () => {
    const rumble = hint(199);

    expect(rumble.planRoles).toEqual(["pressure_hq"]);
    expect(rumble.functionSignals).toEqual(
      expect.arrayContaining([
        "corp.random_discard_pressure",
        "defense.damage_retaliation",
      ]),
    );
  });

  it("allows Crash Everett to evaluate controller-known drawn cards", () => {
    const crash = hint(369);

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
    const clerk = hint(50);
    expect(clerk.strategyAnchors ?? []).not.toContain("runner.hq_pressure");
    expect(clerk.targetProfiles).toBeUndefined();

    for (const cardId of [
      93,
      95,
      100,
      564,
    ]) {
      expect(hint(cardId).strategyAnchors ?? [], cardId).not.toContain(
        "corp.ice_tax_glacier",
      );
    }
    expect(hint(93).riskTags).toEqual(
      expect.arrayContaining([
        "deterministic_random",
        "self_derez",
        "automatic_pass_failure",
      ]),
    );
    expect(hint(564).strategySupportPairs).toContainEqual(
      expect.objectContaining({
        strategyId: "corp.ice_tax_glacier",
        roleDetail: "ice_install_discount_fort_builder",
      }),
    );
  });

  it("keeps run-history and HQ denial semantics aligned with their effects", () => {
    const manhunt = hint(108);
    expect(manhunt.planRoles ?? []).not.toContain("build_scoring_remote");
    expect(manhunt.strategySupportPairs).toContainEqual(
      expect.objectContaining({
        strategyId: "corp.tag_trace_punish",
        roleDetail: "scaling_trace_margin_tag_source",
      }),
    );

    const frameUp = hint(167);
    expect(frameUp.planRoles).toEqual(
      expect.arrayContaining(["pressure_hq", "pressure_rnd"]),
    );
    expect(frameUp.strategyAnchors ?? []).not.toContain(
      "runner.run_event_tempo",
    );

    const creditSubversion = hint(194);
    expect(creditSubversion.planRoles).toContain("pressure_hq");
    expect(creditSubversion.planRoles).not.toContain("safe_probe_run");
    expect(creditSubversion.tacticSignals ?? []).not.toContain("economy.card");
    expect(creditSubversion.strategyAnchors ?? []).not.toContain(
      "runner.hq_pressure",
    );
  });

  it("uses side-safe target semantics only for real ICE choices", () => {
    expect(hint(280).targetProfiles).toBeUndefined();

    expect(
      hint(321).targetProfiles,
    ).toContainEqual(
      expect.objectContaining({
        purpose: "unrezzed_ice_trash",
        preferences: ["relevant_server_ice", "blocks_relevant_run_path"],
      }),
    );

    expect(
      hint(118).targetProfiles,
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

    const omni = hint(576);
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
      hint(10).strategyAnchors ?? [],
    ).not.toContain("corp.economy_rez_reserve");
    expect(hint(19).strategyAnchors).toEqual([
      "corp.ice_tax_glacier",
    ]);
    expect(
      hint(262).strategyAnchors ?? [],
    ).not.toContain("runner.rnd_pressure");
    expect(hint(106).planRoles ?? []).not.toContain(
      "build_scoring_remote",
    );
    expect(
      hint(106).strategyAnchors ?? [],
    ).not.toContain("corp.tag_trace_punish");
    expect(
      hint(126).planRoles ?? [],
    ).not.toContain("build_scoring_remote");
    expect(hint(350).planRoles).toEqual(
      expect.arrayContaining(["build_rig", "trace_bid_support"]),
    );
    expect(hint(350).tacticSignals ?? []).not.toContain(
      "economy.card",
    );
    expect(hint(168).planRoles).toContain("build_rig");
    expect(hint(168).planRoles).not.toContain(
      "recover_economy",
    );
  });

  it("binds Batch 4 choices to controller-known mechanical owners", () => {
    expect(hint(258).targetProfiles).toContainEqual(
      expect.objectContaining({
        purpose: "place_strength_reduction_counter_on_fully_broken_ice",
        targetType: "installed_ice",
        hiddenInfoPolicy: "visible_or_known_only",
      }),
    );
    expect(hint(301).targetProfiles).toContainEqual(
      expect.objectContaining({
        purpose: "generic_heap_recovery",
        targetType: "card",
        hiddenInfoPolicy: "public_or_controller_known_only",
      }),
    );
    expect(hint(315).targetProfiles).toContainEqual(
      expect.objectContaining({
        purpose: "convert_expendable_grip_cards_to_credits",
        targetType: "card",
        hiddenInfoPolicy: "public_or_controller_known_only",
      }),
    );
    expect(hint(528).targetProfiles).toContainEqual(
      expect.objectContaining({
        purpose: "protect_or_reuse_installed_corp_card",
        targetType: "card",
        hiddenInfoPolicy: "public_or_controller_known_only",
      }),
    );
    expect(
      hint(164).targetProfiles ?? [],
    ).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ purpose: "derez_fully_broken_ice" }),
      ]),
    );
    expect(hint(168).targetProfiles).toContainEqual(
      expect.objectContaining({
        purpose: "install_best_legal_target",
        hiddenInfoPolicy: "public_or_controller_known_only",
      }),
    );
  });

  it("models Batch 4 run payoff and closeout semantics without unconditional priority", () => {
    expect(
      hint(171).targetProfiles,
    ).toContainEqual(
      expect.objectContaining({
        purpose: "maximize_live_news_feed_aftermath",
        targetType: "server",
      }),
    );
    expect(hint(171).riskTags).toContain(
      "self_tag",
    );
    expect(
      hint(183).targetProfiles,
    ).toContainEqual(
      expect.objectContaining({
        purpose: "maximize_advertisement_trash_during_run",
        targetType: "server",
      }),
    );
    for (const cardId of [
      295,
      302,
    ]) {
      expect(hint(cardId).planRoles).toContain("score_now");
      expect(hint(cardId).lineSupport).toContain("score_closeout");
      expect(hint(cardId).strategyAnchors).toBeUndefined();
    }
  });

  it("keeps Batch 5 support cards from becoming strategy anchors", () => {
    expect(hint(11).strategyAnchors).toBeUndefined();
    expect(
      hint(133).strategyAnchors,
    ).toBeUndefined();
    expect(
      hint(133).planRoles ?? [],
    ).not.toContain("build_scoring_remote");
    expect(
      hint(101).strategyAnchors,
    ).toBeUndefined();
    expect(hint(101).lineSupport).toContain(
      "corp.ice_tax_glacier",
    );
    expect(hint(101).riskTags).toContain(
      "self_bounce_or_maintenance_cost",
    );
    expect(hint(575).strategyAnchors).toBeUndefined();

    expect(
      hint(61).strategyAnchors,
    ).toEqual(
      expect.arrayContaining(["corp.damage_kill", "corp.tag_trace_punish"]),
    );
  });

  it("binds Batch 5 target guidance only to real controller-known choices", () => {
    expect(hint(312).targetProfiles).toContainEqual(
      expect.objectContaining({
        purpose: "convert_expendable_installed_cards_to_credits",
        targetType: "card",
        hiddenInfoPolicy: "public_or_controller_known_only",
      }),
    );
    expect(hint(506).targetProfiles).toContainEqual(
      expect.objectContaining({
        purpose: "conceal_and_reorder_installed_ice",
        targetType: "ice_position",
        hiddenInfoPolicy: "public_or_controller_known_only",
      }),
    );
    expect(hint(289).targetProfiles).toContainEqual(
      expect.objectContaining({
        purpose: "black_ice_derez",
        targetType: "installed_ice",
        hiddenInfoPolicy: "visible_or_known_only",
      }),
    );
    expect(
      hint(271).targetProfiles,
    ).toContainEqual(
      expect.objectContaining({
        purpose: "install_program_that_answers_current_ice_or_setup_gap",
        targetType: "program",
        hiddenInfoPolicy: "public_or_controller_known_only",
      }),
    );
    expect(hint(271).planRoles).not.toContain(
      "recover_rig",
    );
    expect(hint(575).targetProfiles).toContainEqual(
      expect.objectContaining({
        purpose: "temporarily_rez_ice_on_fort",
        targetType: "installed_ice",
        hiddenInfoPolicy: "public_or_controller_known_only",
        serverScope: "source_fort",
      }),
    );
    expect(hint(37).targetProfiles).toBeUndefined();
  });

  it("keeps Batch 5 restricted economy and drawbacks explicit", () => {
    const techtronica = hint(355);
    expect(techtronica.planRoles).toContain("trace_bid_support");
    expect(techtronica.tacticSignals ?? []).not.toContain("economy.card");
    expect(techtronica.riskTags).toContain("deck_replacement_conflict");

    const retreat = hint(407);
    expect(retreat.strategicExchangeKinds).toContain(
      "ongoing_economy_for_board_development",
    );
    expect(retreat.riskTags).toContain("board_development_lock");

    const arasaka = hint(290);
    expect(arasaka.tacticSignals ?? []).not.toContain("economy.card");
    expect(arasaka.riskTags).toEqual(
      expect.arrayContaining([
        "future_action_debt",
        "future_agenda_point_forfeit",
      ]),
    );
    expect(arasaka.actionCapacityProfiles).toContainEqual(
      expect.objectContaining({ class: "action_debt", amount: 4 }),
    );

    expect(hint(542).planRoles).toContain(
      "remote_asset_modifier",
    );
    expect(hint(542).planRoles).not.toContain(
      "remote_asset_pressure",
    );
    expect(hint(261).tacticSignals ?? []).not.toContain(
      "corp.remote_protection",
    );
  });

  it("projects Batch 6 access replacements by their actual successful-run effect", () => {
    const weather = hint(330);
    expect(weather.roles).toEqual(
      expect.arrayContaining(["hq_pressure", "corp_credit_denial"]),
    );
    expect(weather.roles).not.toContain("rd_pressure");
    expect(weather.effects).toContainEqual(
      expect.objectContaining({
        kind: "economy",
        scope: "corp",
        timing: "successful_run",
        resource: "credits",
        target: "economy.corp_credit_loss",
        amount: 4,
      }),
    );
    expect(weather.functionSignals).toContain("economy.corp_credit_denial");
    expect(weather.functionSignals).not.toContain("info.rnd_topdeck");
    expect(weather.conditions).toContainEqual({ kind: "requires_hq_pressure" });
    expect(weather.conditions).not.toContainEqual({
      kind: "requires_rnd_pressure",
    });

    expect(
      hint(42).effects,
    ).toContainEqual(
      expect.objectContaining({
        kind: "topdeck_info",
        target: "reveal_until_agenda",
      }),
    );
    expect(hint(160).effects).toContainEqual(
      expect.objectContaining({
        kind: "scored_agenda_action",
        target: "runner_gain_agenda_point",
      }),
    );
    expect(hint(163).effects).toContainEqual(
      expect.objectContaining({
        kind: "ice_trash",
        target: "trash_rezzed_ice_on_fort",
      }),
    );
    expect(hint(262).effects).toContainEqual(
      expect.objectContaining({
        kind: "topdeck_info",
        target: "private_look_top_rd",
        amount: 5,
      }),
    );
    expect(hint(354).effects).toContainEqual(
      expect.objectContaining({
        kind: "card_recovery",
        target: "archives_faceup_to_rd",
        amount: 2,
      }),
    );
    expect(hint(317).effects).toContainEqual(
      expect.objectContaining({
        kind: "access_replacement",
        target: "runner_spend_corp_lose_credits",
      }),
    );
  });

  it("binds Batch 6 private choices without treating controller-known cards as unknown", () => {
    expect(hint(270).targetProfiles).toContainEqual(
      expect.objectContaining({
        purpose: "expose_installed_card",
        targetType: "card",
        hiddenInfoPolicy: "legal_targets_only",
      }),
    );
    expect(
      hint(424).targetProfiles,
    ).toContainEqual(
      expect.objectContaining({
        purpose: "rez_best_defensive_ice",
        targetType: "installed_ice",
        hiddenInfoPolicy: "public_or_controller_known_only",
      }),
    );
    expect(
      hint(29).targetProfiles,
    ).toContainEqual(
      expect.objectContaining({
        purpose: "bottom_lowest_value_drawn_card",
        targetType: "card",
        hiddenInfoPolicy: "public_or_controller_known_only",
      }),
    );
    expect(hint(78).targetProfiles).toContainEqual(
      expect.objectContaining({
        purpose: "choose_effective_rez_strength_x",
        targetType: "mode_choice",
        hiddenInfoPolicy: "legal_options_only",
      }),
    );
    expect(hint(158).targetProfiles).toContainEqual(
      expect.objectContaining({
        purpose: "spend_least_needed_stealth_credit_source",
        targetType: "card",
        hiddenInfoPolicy: "public_or_controller_known_only",
      }),
    );
    expect(
      hint(526).targetProfiles,
    ).toContainEqual(
      expect.objectContaining({
        purpose: "show_hq_agendas_for_needed_credits",
        timing: "start_of_turn",
        targetType: "card",
        hiddenInfoPolicy: "public_or_controller_known_only",
      }),
    );
    expect(hint(162).targetProfiles).toEqual([
      expect.objectContaining({ targetType: "server" }),
    ]);
  });

  it("keeps Batch 6 strategy roles and restricted resources calibrated", () => {
    expect(hint(546).strategyAnchors).toContain(
      "corp.fast_advance",
    );
    expect(
      hint(29).strategyAnchors,
    ).toContain("corp.draw_engine");
    expect(hint(426).strategyAnchors).toContain(
      "corp.overadvance_value",
    );
    expect(hint(78).strategyAnchors).toBeUndefined();
    expect(
      hint(120).strategyAnchors,
    ).toBeUndefined();
    expect(hint(54).strategyAnchors).toBeUndefined();
    expect(
      hint(162).strategyAnchors,
    ).toBeUndefined();
    expect(hint(376).tacticSignals ?? []).not.toContain(
      "economy.card",
    );
    expect(
      hint(58).tacticSignals ?? [],
    ).not.toContain("economy.card");
    expect(
      hint(135).tacticSignals ?? [],
    ).not.toContain("corp.remote_protection");
    expect(
      hint(499).actionStrategySupportPairs,
    ).toContainEqual(
      expect.objectContaining({
        role: "enabler",
        roleDetail: "enabler_tag_additional_source",
        evidence: ["tactic_signal_anchor:tag.additional_source"],
      }),
    );
  });

  it("binds Batch 13 target profiles to real controller-known choices", () => {
    expect(
      hint(324).targetProfiles,
    ).toContainEqual(
      expect.objectContaining({
        purpose: "choose_trace_heavy_run_server",
        timing: "on_play",
        targetType: "server",
        hiddenInfoPolicy: "legal_targets_only",
      }),
    );
    expect(
      hint(203).targetProfiles,
    ).toContainEqual(
      expect.objectContaining({
        purpose: "currently_accessed_cards_free_trash",
        targetType: "card",
        hiddenInfoPolicy: "current_access_only",
      }),
    );
    expect(hint(570).targetProfiles).toContainEqual(
      expect.objectContaining({
        purpose: "choose_hq_ice_for_temporary_encounter",
        targetType: "card",
        hiddenInfoPolicy: "public_or_controller_known_only",
      }),
    );
    expect(
      hint(581).targetProfiles,
    ).toContainEqual(
      expect.objectContaining({
        purpose: "swap_unrezzed_fort_ice_with_hq_ice",
        targetType: "card",
        hiddenInfoPolicy: "public_or_controller_known_only",
      }),
    );
    expect(hint(565).targetProfiles).toContainEqual(
      expect.objectContaining({
        purpose: "trash_high_value_daemon",
        targetType: "card",
        hiddenInfoPolicy: "legal_targets_only",
      }),
    );
    expect(
      hint(122).targetProfiles,
    ).toContainEqual(
      expect.objectContaining({
        purpose: "repeat_subroutine_on_fort_ice",
        targetType: "installed_ice",
        hiddenInfoPolicy: "public_or_controller_known_only",
      }),
    );
    expect(hint(367).targetProfiles).toContainEqual(
      expect.objectContaining({
        purpose: "preserve_two_high_value_virus_counters",
        targetType: "counter",
        hiddenInfoPolicy: "public_or_controller_known_only",
      }),
    );
    expect(
      hint(204).targetProfiles,
    ).toBeUndefined();
  });

  it("keeps Batch 13 fort, hand, tag, draw, and access semantics proportional", () => {
    const london = hint(24);
    expect(london.functionSignals).toContain("tax.noisy_breaker_ability");
    expect(london.conditions ?? []).not.toContainEqual({
      kind: "requires_remote_server",
    });
    expect(london.effects).toContainEqual(
      expect.objectContaining({
        kind: "run_tax",
        scope: "fort",
        target: "run.break_cost_penalty",
      }),
    );

    const reprisal = hint(327);
    expect(reprisal.conditions).toContainEqual({
      kind: "requires_corp_scored_black_ops_agenda_last_turn",
    });
    expect(reprisal.effects).toContainEqual(
      expect.objectContaining({
        kind: "random_discard",
        scope: "hq",
        amount: 5,
      }),
    );

    expect(
      hint(23).tacticSignals ?? [],
    ).not.toContain("draw.card");
    expect(
      hint(77).strategyAnchors ?? [],
    ).not.toContain("corp.ice_tax_glacier");
    expect(
      hint(7).strategyAnchors,
    ).toContain("corp.draw_engine");
    expect(
      hint(25).strategyAnchors,
    ).toBeUndefined();
    expect(hint(125).planRoles).toEqual(
      expect.arrayContaining(["protect_hq", "corp_repeatable_draw"]),
    );
    expect(hint(297).strategyAnchors).toEqual([
      "runner.hq_pressure",
    ]);
    expect(
      hint(197).functionSignals,
    ).toEqual(
      expect.arrayContaining([
        "setup.program_host",
        "economy.recurring_breaker_credit",
      ]),
    );
  });
});
