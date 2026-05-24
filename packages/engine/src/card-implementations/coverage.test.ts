import { describe, expect, it } from "vitest";
import { DEMO_CARDS_BY_ID } from "../index";
import {
  CARD_IMPLEMENTATION_COVERAGE_ENTRIES,
  CARD_IMPLEMENTATION_COVERAGE_OVERRIDES,
  cardImplementationCoverageForDefinitionId,
  isCurrentCardImplementationReleaseScopeDefinitionId,
} from "./coverage";
import {
  CARD_IMPLEMENTATIONS,
  CARD_IMPLEMENTATIONS_BY_DEFINITION_ID,
  cardImplementationForDefinitionId,
} from "./registry";

describe("CardImplementation coverage and registry invariants", () => {
  const p344SimpleIcebreakers = [
    "onr_v1_039_krash",
    "onr_v1_014_codecracker",
    "onr_v1_016_cyfermaster",
    "onr_v1_052_raffles",
    "onr_v1_070_tinweasel",
    "onr_v1_073_wizards-book",
    "onr_v1_021_dwarf",
    "onr_v1_074_worm",
    "onr_v1_006_black-dahlia",
    "onr_v1_015_codeslinger",
    "onr_v1_040_loony-goon",
    "onr_v1_054_raptor",
    "onr_v1_060_shaka",
    "onr_v1_072_wild-card",
    "onr_v1_027_flak",
    "onr_v1_018_dogcatcher",
    "onr_v1_055_reflector",
    "onr_v1_056_replicator",
  ] as const;

  it("migrates P3.44 simple icebreakers into CardImplementation coverage", () => {
    for (const definitionId of p344SimpleIcebreakers) {
      const implementation = cardImplementationForDefinitionId(definitionId);
      expect(implementation?.icebreakerAbilities?.length, definitionId).toBeGreaterThan(0);
      expect(cardImplementationCoverageForDefinitionId(definitionId)).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      CARD_IMPLEMENTATION_COVERAGE_OVERRIDES.some(
        (entry) => entry.cardDefinitionId === "onr_v1_039_krash",
      ),
    ).toBe(false);
  });

  const p345SpecialIcebreakers = [
    "onr_v1_031_hammer",
    "onr_v1_036_jackhammer",
    "onr_v1_047_pile-driver",
    "onr_v1_053_ramming-piston",
    "onr_v1_019_dropp",
    "onr_v1_030_grubb",
    "onr_v1_037_japanese-water-torture",
    "onr_v1_066_snowball",
    "onr_v1_002_ai-boon",
    "onr_v1_007_blink",
    "onr_v1_005_bartmoss-memorial-icebreaker",
    "onr_v1_020_dupre",
    "onr_v1_023_evil-twin",
  ] as const;

  it("migrates P3.45 special icebreakers into CardImplementation coverage", () => {
    for (const definitionId of p345SpecialIcebreakers) {
      const implementation = cardImplementationForDefinitionId(definitionId);
      expect(implementation?.icebreakerAbilities?.length, definitionId).toBeGreaterThan(0);
      expect(cardImplementationCoverageForDefinitionId(definitionId)).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(cardImplementationForDefinitionId("onr_v1_023_evil-twin")).toMatchObject({
      damagePreventionSources: expect.any(Array),
    });
  });

  it("migrates P3.46 daemon hosting and Chimera into CardImplementation coverage", () => {
    const daemonSpecs = [
      ["onr_v1_001_afreet", 3, true],
      ["onr_v1_033_imp", 2, true],
      ["onr_v1_069_succubus", 3, false],
    ] as const;
    for (const [definitionId, capacityMu, reducesStrength] of daemonSpecs) {
      const implementation = cardImplementationForDefinitionId(definitionId);
      expect(implementation?.hostedProgramCapacity).toMatchObject({
        capacityMu,
        allowedCardTypes: ["program"],
        hostedProgramsAreInstalled: true,
        hostLeavesPlayTrashesHosted: true,
      });
      expect(Boolean(implementation?.hostedProgramModifiers?.length)).toBe(
        reducesStrength,
      );
      expect(cardImplementationCoverageForDefinitionId(definitionId)).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(cardImplementationForDefinitionId("onr_v1_353_chimera")?.accessEffects).toEqual([
      {
        kind: "on_access",
        sourceZones: ["installed"],
        visibility: "hidden_info_barrier",
        effects: [
          {
            kind: "trash_installed_runner_cards",
            target: "daemon",
            amount: 1,
            visibility: "hidden_info_barrier",
          },
        ],
      },
    ]);
    expect(cardImplementationCoverageForDefinitionId("onr_v1_353_chimera")).toMatchObject({
      cardDefinitionId: "onr_v1_353_chimera",
      status: "implemented",
    });
  });

  it("migrates P3.47 runner recycle preps into CardImplementation coverage", () => {
    expect(
      cardImplementationForDefinitionId("onr_v1_100_misc-for-sale")?.abilities,
    ).toContainEqual(
      expect.objectContaining({
        kind: "on_play",
        effects: [
          {
            kind: "trash_own_installed_cards_for_credits",
            target: "chosen_installed_runner_cards",
            min: 0,
            max: "any",
            gainPerTrashed: 3,
            visibility: "public",
          },
        ],
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_103_organ-donor")?.abilities,
    ).toContainEqual(
      expect.objectContaining({
        kind: "on_play",
        effects: [
          {
            kind: "trash_cards_from_grip_for_credits",
            target: "chosen_runner_grip_cards",
            max: 5,
            gainPerTrashed: 2,
            visibility: "hidden_info_barrier",
          },
        ],
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_101_mit-west-tier")?.abilities,
    ).toContainEqual(
      expect.objectContaining({
        kind: "on_play",
        effects: [
          {
            kind: "shuffle_grip_trash_and_stack_then_draw",
            drawCount: 5,
            removePlayedCardFromGame: true,
            visibility: "hidden_info_barrier",
          },
        ],
      }),
    );
    for (const definitionId of [
      "onr_v1_100_misc-for-sale",
      "onr_v1_101_mit-west-tier",
      "onr_v1_103_organ-donor",
    ] as const) {
      expect(cardImplementationCoverageForDefinitionId(definitionId)).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationCoverageForDefinitionId(
        "onr_v1_131_microtech-backup-drive",
      )?.status,
    ).toBe("implemented");
  });

  it("migrates P3.48 run control cards into CardImplementation coverage", () => {
    const implemented = [
      "onr_v1_076_all-nighter",
      "onr_v1_094_inside-job",
      "onr_v1_112_stumble-through-wilderspace",
      "onr_v1_123_bodyweight-data-creche",
      "onr_v1_080_core-command-jettison-ice",
      "onr_v1_109_security-code-worm-chip",
      "onr_v1_044_netspace-inverter",
      "onr_v1_086_forged-activation-orders",
    ] as const;

    for (const definitionId of implemented) {
      expect(cardImplementationForDefinitionId(definitionId), definitionId).toBeDefined();
      expect(cardImplementationCoverageForDefinitionId(definitionId)).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationForDefinitionId("onr_v1_123_bodyweight-data-creche")
        ?.successfulRunFollowups,
    ).toContainEqual(
      expect.objectContaining({
        kind: "optional_make_run_after_successful_run",
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_044_netspace-inverter")
        ?.successfulRunFollowups,
    ).toContainEqual(
      expect.objectContaining({
        kind: "reverse_ice_on_successful_run_fort",
      }),
    );
    expect(cardImplementationForDefinitionId("onr_v1_088_fortress-respecification")).toBeDefined();
  });

  it("migrates P3.51 Corp utility operations and nodes into CardImplementation coverage", () => {
    const p351Cards = [
      "onr_v1_297_overtime-incentives",
      "onr_v1_289_edgerunner-inc-temps",
      "onr_v1_296_off-site-backups",
      "onr_v1_298_planning-consultants",
      "onr_v1_306_trojan-horse",
      "onr_v1_303_silver-lining-recovery-protocol",
      "onr_v1_286_corporate-detective-agency",
      "onr_v1_299_power-grid-overload",
      "onr_v1_322_euromarket-consortium",
      "onr_v1_336_rescheduler",
      "onr_v1_316_cowboy-sysop",
      "onr_v1_333_omniscience-foundation",
      "onr_v1_319_disinfectant-inc",
      "onr_v1_332_newsgroup-taunting",
      "onr_v1_330_krumz",
    ] as const;

    for (const definitionId of p351Cards) {
      expect(cardImplementationForDefinitionId(definitionId), definitionId).toBeDefined();
      expect(cardImplementationCoverageForDefinitionId(definitionId)).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationForDefinitionId("onr_v1_319_disinfectant-inc")
        ?.corpUtility,
    ).toMatchObject({ kind: "disinfectant_avoid_virus_counter" });
    expect(
      cardImplementationForDefinitionId("onr_v1_330_krumz")?.corpUtility,
    ).toMatchObject({ kind: "krumz_trace_bit" });
  });

  it("migrates P3.52 fort ICE-control windows into CardImplementation coverage", () => {
    const p352Cards = [
      "onr_v1_363_olivia-salazar",
      "onr_v1_364_omni-kismet-ph-d",
      "onr_v1_369_singapore-city-grid",
      "onr_v1_026_false-echo",
    ] as const;

    for (const definitionId of p352Cards) {
      expect(cardImplementationForDefinitionId(definitionId), definitionId).toBeDefined();
      expect(cardImplementationCoverageForDefinitionId(definitionId)).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationForDefinitionId("onr_v1_363_olivia-salazar")
        ?.fortRunWindows,
    ).toContainEqual(
      expect.objectContaining({
        kind: "discounted_rez_ice_on_this_fort",
        discount: "half_rez_cost_rounded_down",
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_364_omni-kismet-ph-d")
        ?.fortRunWindows,
    ).toContainEqual(
      expect.objectContaining({
        kind: "swap_unrezzed_fort_ice_with_hq_ice",
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_369_singapore-city-grid")
        ?.fortRunWindows,
    ).toContainEqual(
      expect.objectContaining({
        kind: "swap_unrezzed_fort_ice_with_hq_ice",
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_026_false-echo")
        ?.successfulRunFollowups,
    ).toContainEqual(
      expect.objectContaining({
        kind: "force_rez_ice_outermost_inward_after_successful_run",
      }),
    );
  });

  it("migrates P3.53 run/encounter interventions into CardImplementation coverage", () => {
    const p353Cards = [
      "onr_v1_065_smarteye",
      "onr_v1_067_speed-trap",
      "onr_v1_242_fatal-attractor",
      "onr_v1_247_haunting-inquisition",
      "onr_v1_271_tko-2-0",
    ] as const;

    for (const definitionId of p353Cards) {
      expect(cardImplementationForDefinitionId(definitionId), definitionId).toBeDefined();
      expect(cardImplementationCoverageForDefinitionId(definitionId)).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationForDefinitionId("onr_v1_065_smarteye")
        ?.runEncounterInterventions,
    ).toContainEqual(
      expect.objectContaining({
        kind: "approach_ice_expose_then_jack_out_before_rez",
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_067_speed-trap")
        ?.runEncounterInterventions,
    ).toContainEqual(
      expect.objectContaining({
        kind: "jack_out_after_corp_rezzes_upgrade_or_node_before_effect",
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_242_fatal-attractor")
        ?.printedSubroutines,
    ).toContainEqual(
      expect.objectContaining({
        kind: "next_encounter_unless_fully_break_damage",
        amount: 3,
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_247_haunting-inquisition")
        ?.printedSubroutines,
    ).toContainEqual(
      expect.objectContaining({ kind: "runner_run_lock_actions", amount: 6 }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_271_tko-2-0")
        ?.printedSubroutines,
    ).toContainEqual(
      expect.objectContaining({ kind: "runner_forgoes_next_action" }),
    );
  });

  it("migrates P3.54 delayed fort run windows into CardImplementation coverage", () => {
    const p354Cards = [
      "onr_v1_349_aardvark",
      "onr_v1_358_dr-dreff",
      "onr_v1_359_jenny-jett",
      "onr_v1_372_turbeau-delacroix",
      "onr_v1_373_twenty-four-hour-surveillance",
    ] as const;

    for (const definitionId of p354Cards) {
      expect(cardImplementationForDefinitionId(definitionId), definitionId).toBeDefined();
      expect(cardImplementationCoverageForDefinitionId(definitionId)).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationForDefinitionId("onr_v1_358_dr-dreff")
        ?.fortRunWindows,
    ).toContainEqual(
      expect.objectContaining({
        kind: "temporary_hq_ice_encounter_after_successful_run",
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_359_jenny-jett")
        ?.fortRunWindows,
    ).toContainEqual(
      expect.objectContaining({
        kind: "install_hq_ice_innermost_after_successful_run",
      }),
    );
    expect(
      cardImplementationForDefinitionId(
        "onr_v1_373_twenty-four-hour-surveillance",
      )?.fortRunWindows,
    ).toContainEqual(
      expect.objectContaining({
        kind: "block_stealth_bits_during_runs_on_this_fort",
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_372_turbeau-delacroix")
        ?.accessEffects?.[0]?.effects,
    ).toContainEqual(
      expect.objectContaining({
        kind: "trace",
        baseTraceStrength: 10,
      }),
    );
  });

  it("migrates P3.55 fort region longtail cards into CardImplementation coverage", () => {
    const p355Cards = [
      "onr_v1_365_paris-city-grid",
      "onr_v1_367_rio-de-janeiro-city-grid",
      "onr_v1_368_roving-submarine",
      "onr_v1_371_tokyo-chiba-infighting",
      "onr_v1_361_namatoki-plaza",
    ] as const;

    for (const definitionId of p355Cards) {
      expect(cardImplementationForDefinitionId(definitionId), definitionId).toBeDefined();
      expect(cardImplementationCoverageForDefinitionId(definitionId)).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationForDefinitionId("onr_v1_365_paris-city-grid")
        ?.fortRunWindows,
    ).toContainEqual(
      expect.objectContaining({
        kind: "corp_trace_bits_during_runs_on_this_fort",
        amount: 3,
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_367_rio-de-janeiro-city-grid")
        ?.fortRunWindows,
    ).toContainEqual(
      expect.objectContaining({
        kind: "roll_die_on_pass_rezzed_ice_on_same_fort",
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_368_roving-submarine")
        ?.fortRunWindows,
    ).toContainEqual(
      expect.objectContaining({
        kind: "can_run_fort_only_if_last_corp_turn_activity_on_fort",
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_371_tokyo-chiba-infighting")
        ?.fortRunWindows,
    ).toContainEqual(
      expect.objectContaining({
        kind: "gain_credits_after_unsuccessful_run_on_same_fort",
        amount: 2,
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_361_namatoki-plaza")
        ?.fortCapacityModifiers,
    ).toContainEqual(
      expect.objectContaining({
        kind: "additional_agenda_or_node_slot_inside_fort",
        amount: 1,
      }),
    );
  });

  it("migrates P3.56 remaining Corp ICE longtail subroutines into CardImplementation coverage", () => {
    const p356Cards = [
      "onr_v1_222_ball-and-chain",
      "onr_v1_228_cinderella",
      "onr_v1_248_homewrecker",
      "onr_v1_260_pocket-virtual-reality",
      "onr_v1_272_too-many-doors",
      "onr_v1_275_vacuum-link",
      "onr_v1_276_viral-15",
    ] as const;

    for (const definitionId of p356Cards) {
      expect(cardImplementationForDefinitionId(definitionId), definitionId).toBeDefined();
      expect(cardImplementationCoverageForDefinitionId(definitionId)).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationForDefinitionId("onr_v1_260_pocket-virtual-reality")
        ?.iceEncounter,
    ).toMatchObject({
      kind: "add_encounter_temporary_credits",
      amount: 4,
    });
    expect(
      cardImplementationForDefinitionId("onr_v1_276_viral-15")
        ?.printedSubroutines,
    ).toHaveLength(2);
  });

  it("migrates Proteus Phase 1a reuse-only cards into CardImplementation coverage", () => {
    const phase1aCards = [
      "onr_proteus_041_toughoniumtm-wall",
      "onr_proteus_065_networked-center",
      "onr_proteus_072_research-bunker",
      "onr_proteus_077_weapons-depot",
      "onr_proteus_150_streetware-distributor",
    ] as const;

    for (const definitionId of phase1aCards) {
      expect(cardImplementationForDefinitionId(definitionId), definitionId).toBeDefined();
      expect(cardImplementationCoverageForDefinitionId(definitionId)).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationForDefinitionId("onr_proteus_041_toughoniumtm-wall")
        ?.printedSubroutines,
    ).toHaveLength(4);
    expect(
      cardImplementationForDefinitionId("onr_proteus_150_streetware-distributor")
        ?.abilities?.[0],
    ).toMatchObject({
      kind: "activated",
      timing: "runner_main",
      costs: [{ kind: "action", amount: 1 }],
    });
  });

  it("migrates Proteus Phase 1b dynamic public ETR ICE into CardImplementation coverage", () => {
    const phase1bCards = [
      "onr_proteus_031_minotaur",
      "onr_proteus_034_riddler",
    ] as const;

    for (const definitionId of phase1bCards) {
      expect(cardImplementationForDefinitionId(definitionId), definitionId).toBeDefined();
      expect(cardImplementationCoverageForDefinitionId(definitionId)).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationForDefinitionId("onr_proteus_031_minotaur")
        ?.modifiers?.[0],
    ).toMatchObject({
      kind: "additional_subroutine",
      sourceZone: "corp_installed",
      appliesTo: { sourceCardOnly: true },
      repeat: {
        kind: "for_each_rezzed_installed_ice",
        subtypeAnyOf: ["code_gate", "wall"],
        excludeSource: true,
      },
    });
    expect(
      cardImplementationForDefinitionId("onr_proteus_034_riddler")
        ?.abilities?.[0],
    ).toMatchObject({
      kind: "activated",
      timing: "corp_encounter",
      costs: [{ kind: "credit", amount: 2 }],
    });
  });

  it("migrates Proteus Phase 1d public fort pass windows into CardImplementation coverage", () => {
    const phase1dCards = [
      "onr_proteus_062_lesley-major",
      "onr_proteus_070_rasmin-bridger",
    ] as const;

    for (const definitionId of phase1dCards) {
      expect(cardImplementationForDefinitionId(definitionId), definitionId).toBeDefined();
      expect(cardImplementationCoverageForDefinitionId(definitionId)).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationForDefinitionId("onr_proteus_062_lesley-major")
        ?.fortRunWindows?.[0],
    ).toMatchObject({
      kind: "add_advancement_counters_after_passing_last_ice_on_this_fort",
      timing: "pass_last_ice_on_this_fort",
      target: "advanceable_installed_card_in_this_fort",
    });
    expect(
      cardImplementationForDefinitionId("onr_proteus_070_rasmin-bridger")
        ?.fortRunWindows?.[0],
    ).toMatchObject({
      kind: "runner_pay_or_end_run_after_passing_ice_on_this_fort",
      timing: "pass_ice_on_this_fort",
      amount: 1,
    });
  });

  it("migrates Proteus Phase 1g post-pass derez utility into CardImplementation coverage", () => {
    const definitionId = "onr_proteus_085_disintegrator";
    expect(cardImplementationForDefinitionId(definitionId), definitionId).toBeDefined();
    expect(cardImplementationCoverageForDefinitionId(definitionId)).toMatchObject({
      cardDefinitionId: definitionId,
      status: "implemented",
    });
    expect(
      cardImplementationForDefinitionId(definitionId)?.runnerUtilityLongtail,
    ).toMatchObject({
      kind: "derez_fully_broken_passed_ice_and_end_run",
      cost: { kind: "credit", amount: 2 },
      timing: "after_passing_fully_broken_ice",
      target: "that_ice",
    });
  });

  it("migrates Proteus Phase 2b scored-agenda Bad Publicity into CardImplementation coverage", () => {
    const definitionId = "onr_proteus_002_charity-takeover";
    expect(cardImplementationForDefinitionId(definitionId), definitionId).toBeDefined();
    expect(cardImplementationCoverageForDefinitionId(definitionId)).toMatchObject({
      cardDefinitionId: definitionId,
      status: "implemented",
    });
    expect(
      cardImplementationForDefinitionId(definitionId)?.lifecycle?.on_score,
    ).toEqual([
      expect.objectContaining({
        kind: "gain_credits",
        recipient: "corp",
        amount: 9,
      }),
      expect.objectContaining({
        kind: "add_bad_publicity",
        amount: 1,
      }),
    ]);
  });

  it("migrates P3.57 runner sabotage prep cards into CardImplementation coverage", () => {
    const p357Cards = [
      "onr_v1_077_anonymous-tip",
      "onr_v1_082_deal-with-militech",
      "onr_v1_083_desperate-competitor",
      "onr_v1_090_hot-tip-for-wns",
      "onr_v1_098_lucidrine-booster-drug",
      "onr_v1_113_synchronized-attack-on-hq",
      "onr_v1_115_terrorist-reprisal",
      "onr_v1_117_valu-pak-software-bundle",
    ] as const;

    for (const definitionId of p357Cards) {
      expect(cardImplementationForDefinitionId(definitionId), definitionId).toBeDefined();
      expect(cardImplementationCoverageForDefinitionId(definitionId)).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(cardImplementationForDefinitionId("onr_v1_088_fortress-respecification")).toBeDefined();
    expect(cardImplementationForDefinitionId("onr_v1_111_social-engineering")).toBeDefined();
  });

  it("migrates P3.58 hidden replacement longtail cards into CardImplementation coverage", () => {
    const p358Cards = [
      "onr_v1_088_fortress-respecification",
      "onr_v1_111_social-engineering",
      "onr_v1_294_new-blood",
      "onr_v1_176_the-shell-traders",
      "onr_v1_351_bizarre-encryption-scheme",
      "onr_v1_155_code-viral-cache",
    ] as const;

    for (const definitionId of p358Cards) {
      expect(cardImplementationForDefinitionId(definitionId), definitionId).toBeDefined();
      expect(cardImplementationCoverageForDefinitionId(definitionId)).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(cardImplementationForDefinitionId("onr_v1_131_microtech-backup-drive")).toBeDefined();
  });

  it("migrates P3.59 runner utility longtail cards into CardImplementation coverage", () => {
    const p359Cards = [
      "onr_v1_131_microtech-backup-drive",
      "onr_v1_068_startup-immolator",
      "onr_v1_051_rabbit",
      "onr_v1_182_submarine-uplink",
      "onr_v1_032_i-spy",
      "onr_v1_162_field-reporter-for-ice-and-data",
      "onr_v1_171_preying-mantis",
      "onr_v1_172_quest-for-cattekin",
      "onr_v1_132_microtech-trode-set",
    ] as const;

    for (const definitionId of p359Cards) {
      expect(cardImplementationForDefinitionId(definitionId), definitionId).toBeDefined();
      expect(cardImplementationCoverageForDefinitionId(definitionId)).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
  });

  it("migrates P3.60 Corporate Ally Karl de Veres Smith's Pawnshop Databroker Wilson Nevinyrral I Got a Rock Schlaghund Crash Everett unique direct CardImplementation coverage", () => {
    const p360ImplementedCards = [
      "onr_v1_156_corporate-ally",
      "onr_v1_166_karl-de-veres-corporate-stooge",
      "onr_v1_180_smiths-pawnshop",
      "onr_v1_159_databroker",
      "onr_v1_331_nevinyrral",
      "onr_v1_327_i-got-a-rock",
      "onr_v1_339_schlaghund",
    ] as const;

    for (const definitionId of p360ImplementedCards) {
      expect(cardImplementationForDefinitionId(definitionId), definitionId).toBeDefined();
      expect(cardImplementationCoverageForDefinitionId(definitionId)).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationForDefinitionId("onr_v1_187_wilson-weeflerunner-apprentice"),
    ).toBeDefined();
    expect(
      cardImplementationForDefinitionId("onr_v1_157_crash-everett-inventive-fixer"),
    ).toBeDefined();
  });

  it("migrates P3.61 remaining replacement longtail CardImplementation coverage", () => {
    const p361Cards = [
      "onr_v1_157_crash-everett-inventive-fixer",
      "onr_v1_187_wilson-weeflerunner-apprentice",
      "onr_v1_308_acme-savings-and-loan",
      "onr_v1_329_investment-firm",
      "onr_v1_313_city-surveillance",
      "onr_v1_325_hacker-tracker-central",
      "onr_v1_354_crybaby",
    ] as const;

    for (const definitionId of p361Cards) {
      expect(cardImplementationForDefinitionId(definitionId), definitionId).toBeDefined();
      expect(cardImplementationCoverageForDefinitionId(definitionId)).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
  });

  it("migrates P3.62 remaining singleton CardImplementation coverage", () => {
    const implementedCards = [
      "onr_v1_012_clown",
      "onr_v1_104_playful-ai",
      "onr_v1_173_restrictive-net-zoning",
    ] as const;

    for (const definitionId of implementedCards) {
      expect(cardImplementationForDefinitionId(definitionId), definitionId).toBeDefined();
      expect(cardImplementationCoverageForDefinitionId(definitionId)).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(cardImplementationForDefinitionId("onr_v1_220_tycho-extension")).toBeUndefined();
    expect(cardImplementationCoverageForDefinitionId("onr_v1_220_tycho-extension")).toMatchObject({
      cardDefinitionId: "onr_v1_220_tycho-extension",
      status: "no_engine_behavior_required",
    });
  });

  it("requires implementation coverage for every demo card", () => {
    const duplicateIds = (ids: string[]): string[] =>
      ids.filter((id, index) => ids.indexOf(id) !== index);

    const implementationIds = CARD_IMPLEMENTATIONS.map(
      (implementation) => implementation.cardDefinitionId,
    );
    expect(duplicateIds(implementationIds)).toEqual([]);
    const coverageIds = CARD_IMPLEMENTATION_COVERAGE_ENTRIES.map(
      (entry) => entry.cardDefinitionId,
    );
    expect(duplicateIds(coverageIds)).toEqual([]);
    expect(
      duplicateIds(
        CARD_IMPLEMENTATION_COVERAGE_OVERRIDES.map(
          (entry) => entry.cardDefinitionId,
        ),
      ),
    ).toEqual([]);

    for (const definitionId of Object.keys(DEMO_CARDS_BY_ID)) {
      const coverage =
        cardImplementationCoverageForDefinitionId(definitionId);
      expect(coverage, definitionId).toBeDefined();
      expect(coverage?.cardDefinitionId).toBe(definitionId);
      expect(coverage?.reason.trim(), definitionId).not.toBe("");
    }

    for (const entry of CARD_IMPLEMENTATION_COVERAGE_ENTRIES) {
      if (
        entry.status !== "implemented" &&
        entry.status !== "partial_implementation"
      )
        continue;
      const implementation =
        CARD_IMPLEMENTATIONS_BY_DEFINITION_ID[entry.cardDefinitionId];
      if (entry.status === "partial_implementation") {
        expect(entry.reason, entry.cardDefinitionId).toMatch(
          /missing|fehlt|removed|no generic/i,
        );
        if (!implementation) continue;
      }
      expect(
        implementation,
        entry.cardDefinitionId,
      ).toBeDefined();
    }

    for (const implementation of CARD_IMPLEMENTATIONS) {
      expect(
        cardImplementationCoverageForDefinitionId(
          implementation.cardDefinitionId,
        )?.status,
        implementation.cardDefinitionId,
      ).toMatch(/^(implemented|partial_implementation)$/);
    }
  });

  it("reconciles CardImplementation coverage against the ONR-v1 release scope", () => {
    const coverageByStatus = new Map<string, number>();
    for (const entry of CARD_IMPLEMENTATION_COVERAGE_ENTRIES) {
      coverageByStatus.set(
        entry.status,
        (coverageByStatus.get(entry.status) ?? 0) + 1,
      );
    }

    const currentReleaseDefinitionIds = Object.keys(DEMO_CARDS_BY_ID).filter(
      (definitionId) =>
        isCurrentCardImplementationReleaseScopeDefinitionId(definitionId),
    );
    const outsideScopeDefinitionIds = Object.keys(DEMO_CARDS_BY_ID).filter(
      (definitionId) =>
        !isCurrentCardImplementationReleaseScopeDefinitionId(definitionId),
    );

    expect(currentReleaseDefinitionIds).toHaveLength(374);
    expect(outsideScopeDefinitionIds).toHaveLength(55);
    expect(CARD_IMPLEMENTATIONS).toHaveLength(373);
    expect(coverageByStatus.get("implemented")).toBe(373);
    expect(coverageByStatus.get("no_engine_behavior_required")).toBe(1);
    expect(coverageByStatus.get("outside_current_release_scope")).toBe(55);
    expect(coverageByStatus.get("pending_implementation") ?? 0).toBe(0);
    expect(coverageByStatus.get("partial_implementation") ?? 0).toBe(0);
    expect(coverageByStatus.get("legacy_engine_special_case") ?? 0).toBe(0);

    for (const definitionId of currentReleaseDefinitionIds) {
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
        definitionId,
      ).not.toBe("outside_current_release_scope");
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
        definitionId,
      ).not.toBe("pending_implementation");
    }

    for (const definitionId of outsideScopeDefinitionIds) {
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
        definitionId,
      ).toBe("outside_current_release_scope");
      expect(
        CARD_IMPLEMENTATIONS_BY_DEFINITION_ID[definitionId],
        definitionId,
      ).toBeUndefined();
    }
  });

  it("registers migrated runner successful-run and access-interface cards as implemented", () => {
    const p332Cases = [
      "onr_v1_081_custodial-position",
      "onr_v1_084_edited-shipping-manifests",
      "onr_v1_085_executive-wiretaps",
      "onr_v1_096_kilroy-was-here",
      "onr_v1_105_priority-wreck",
      "onr_v1_106_private-ldl-access",
      "onr_v1_107_romp-through-hq",
      "onr_v1_118_weather-to-finance-pipe",
      "onr_v1_062_shredder-uplink-protocol",
      "onr_v1_050_r-and-d-protocol-files",
      "onr_v1_129_hq-interface",
      "onr_v1_139_r-and-d-interface",
      "onr_v1_024_expert-schedule-analyzer",
      "onr_v1_183_technician-lover",
      "onr_v1_041_microtech-ai-interface",
      "onr_v1_142_record-reconstructor",
    ] as const;

    for (const definitionId of p332Cases) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
        definitionId,
      ).toBe("implemented");
    }
  });

});
