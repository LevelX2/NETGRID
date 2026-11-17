import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  cardSpecImplementationDefinitionIds,
  cardSpecRuntimeDefinitionIds,
  cardSpecSourceRefByDefinitionId,
} from "@netgrid/cards/engine";
import { CARD_DEFINITIONS_BY_ID } from "../index";
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

const repoRoot = fileURLToPath(new URL("../../../../", import.meta.url));

function duplicateIds(ids: readonly string[]): string[] {
  return ids.filter((id, index) => ids.indexOf(id) !== index);
}

describe("CardImplementation coverage and registry invariants", () => {
  it("reports exact CardSpec registry source authority for the active runtime partition", () => {
    const paths = new Set<string>();
    const activeCardSpecDefinitionIds = cardSpecRuntimeDefinitionIds();
    for (const definitionId of activeCardSpecDefinitionIds) {
      const sourceRef = cardSpecSourceRefByDefinitionId(definitionId);
      expect(sourceRef, definitionId).toBeDefined();
      if (sourceRef === undefined)
        throw new Error(`Missing CardSpec source ref for ${definitionId}`);
      const sourcePath = sourceRef.sourcePath;
      expect(sourcePath).toMatch(
        /^packages\/cards\/src\/specs\/.+\.card-spec\.ts$/,
      );
      expect(sourcePath).not.toContain(
        "packages/engine/src/card-implementations",
      );
      expect(existsSync(`${repoRoot}/${sourcePath}`)).toBe(true);
      paths.add(sourcePath);
    }
    expect(paths.size).toBe(activeCardSpecDefinitionIds.length);

    for (const definitionId of cardSpecImplementationDefinitionIds()) {
      const coverage = cardImplementationCoverageForDefinitionId(definitionId);
      expect(coverage).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
        reason:
          "CardSpec registry mechanical contract projects runtime behavior.",
      });
      if (coverage === undefined)
        throw new Error(`Missing coverage for ${definitionId}`);
      expect(coverage.currentLocations).toHaveLength(1);
      const locations = coverage.currentLocations;
      if (locations === undefined || locations.length !== 1)
        throw new Error(`Invalid source coverage for ${definitionId}`);
      expect(locations[0]).toBe(
        cardSpecSourceRefByDefinitionId(definitionId)?.sourcePath,
      );
    }

    const implementationIds = new Set(cardSpecImplementationDefinitionIds());
    const definitionOnlyIds = activeCardSpecDefinitionIds.filter(
      (definitionId) => !implementationIds.has(definitionId),
    );
    expect(definitionOnlyIds).toHaveLength(24);
    for (const definitionId of definitionOnlyIds) {
      expect(cardImplementationCoverageForDefinitionId(definitionId)).toEqual({
        cardDefinitionId: definitionId,
        status: "no_engine_behavior_required",
        reason:
          "CardSpec definition and generic printed-card rules own runtime behavior without a projected CardImplementation.",
        currentLocations: [
          cardSpecSourceRefByDefinitionId(definitionId)?.sourcePath,
        ],
      });
    }
  });
  it("keeps every avoid-tag card in the shared prevention registry with its printed cost", () => {
    const cases = [
      [347, { kind: "credit", amount: 3 }, 125],
      [373, { kind: "trash_source" }, 120],
      [379, { kind: "trash_source" }, 122],
      [382, { kind: "trash_source" }, 121],
      [
        399,
        { kind: "trash_source" },
        130,
      ],
      [
        198,
        { kind: "credit_and_trash_source", amount: 1 },
        118,
      ],
      [
        55,
        { kind: "credit_and_forgo_next_action", amount: 1 },
        130,
      ],
    ] as const;

    for (const [definitionId, cost, priority] of cases) {
      expect(
        cardImplementationForDefinitionId(definitionId)?.tagPreventionSources,
        definitionId,
      ).toEqual([
        expect.objectContaining({
          kind: "avoid_tag",
          amount: 1,
          cost,
          priority,
          visibility: "public",
        }),
      ]);
    }
  });

  const p344SimpleIcebreakers = [
    251,
    226,
    228,
    264,
    282,
    285,
    233,
    286,
    218,
    227,
    252,
    266,
    272,
    284,
    239,
    230,
    267,
    268,
  ] as const;

  it("migrates P3.44 simple icebreakers into CardImplementation coverage", () => {
    for (const definitionId of p344SimpleIcebreakers) {
      const implementation = cardImplementationForDefinitionId(definitionId);
      expect(
        implementation?.icebreakerAbilities?.length,
        definitionId,
      ).toBeGreaterThan(0);
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      CARD_IMPLEMENTATION_COVERAGE_OVERRIDES.some(
        (entry) => entry.cardDefinitionId === 251,
      ),
    ).toBe(false);
  });

  const p345SpecialIcebreakers = [
    243,
    248,
    259,
    265,
    231,
    242,
    249,
    278,
    214,
    219,
    217,
    232,
    235,
  ] as const;

  it("migrates P3.45 special icebreakers into CardImplementation coverage", () => {
    for (const definitionId of p345SpecialIcebreakers) {
      const implementation = cardImplementationForDefinitionId(definitionId);
      expect(
        implementation?.icebreakerAbilities?.length,
        definitionId,
      ).toBeGreaterThan(0);
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationForDefinitionId(235),
    ).toMatchObject({
      damagePreventionSources: expect.any(Array),
    });
  });

  it("migrates P3.46 daemon hosting and Chimera into CardImplementation coverage", () => {
    const daemonSpecs = [
      [213, 3, true],
      [245, 2, true],
      [281, 3, false],
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
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationForDefinitionId(565)?.accessEffects,
    ).toEqual([
      expect.objectContaining({
        capabilityKey: "access_effects_on_access_trash_installed_runner_cards",
        addressability: ["plan", "action", "quote", "debug"],
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
      }),
    ]);
    expect(
      cardImplementationCoverageForDefinitionId(565),
    ).toMatchObject({
      cardDefinitionId: 565,
      status: "implemented",
    });
  });

  it("migrates P3.47 runner recycle preps into CardImplementation coverage", () => {
    expect(
      cardImplementationForDefinitionId(312)?.abilities,
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
      cardImplementationForDefinitionId(315)?.abilities,
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
      cardImplementationForDefinitionId(313)?.abilities,
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
      312,
      313,
      315,
    ] as const) {
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationCoverageForDefinitionId(
        343,
      )?.status,
    ).toBe("implemented");
  });

  it("migrates P3.48 run control cards into CardImplementation coverage", () => {
    const implemented = [
      288,
      306,
      324,
      335,
      292,
      321,
      256,
      298,
    ] as const;

    for (const definitionId of implemented) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationForDefinitionId(335)
        ?.successfulRunFollowups,
    ).toContainEqual(
      expect.objectContaining({
        kind: "optional_make_run_after_successful_run",
      }),
    );
    expect(
      cardImplementationForDefinitionId(256)
        ?.successfulRunFollowups,
    ).toContainEqual(
      expect.objectContaining({
        kind: "reverse_ice_on_successful_run_fort",
      }),
    );
    expect(
      cardImplementationForDefinitionId(300),
    ).toBeDefined();
  });

  it("migrates P3.51 Corp utility operations and nodes into CardImplementation coverage", () => {
    const p351Cards = [
      509,
      501,
      508,
      510,
      518,
      515,
      498,
      511,
      534,
      548,
      528,
      545,
      531,
      544,
      542,
    ] as const;

    for (const definitionId of p351Cards) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationForDefinitionId(531)
        ?.corpUtility,
    ).toMatchObject({ kind: "counter_prevention_replacement" });
    expect(
      cardImplementationForDefinitionId(542)?.corpUtility,
    ).toMatchObject({
      kind: "recurring_trace_credit_pool",
      amount: 1,
      counterType: "bit",
      spendWindow: "trace",
      refresh: "start_of_corp_turn_after_use",
    });
  });

  it("migrates P3.52 fort ICE-control windows into CardImplementation coverage", () => {
    const p352Cards = [
      575,
      576,
      581,
      238,
    ] as const;

    for (const definitionId of p352Cards) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationForDefinitionId(575)
        ?.fortRunWindows,
    ).toContainEqual(
      expect.objectContaining({
        kind: "discounted_rez_ice_on_this_fort",
        discount: "half_rez_cost_rounded_down",
      }),
    );
    expect(
      cardImplementationForDefinitionId(576)
        ?.fortRunWindows,
    ).toContainEqual(
      expect.objectContaining({
        kind: "swap_unrezzed_fort_ice_with_hq_ice",
      }),
    );
    expect(
      cardImplementationForDefinitionId(581)
        ?.fortRunWindows,
    ).toContainEqual(
      expect.objectContaining({
        kind: "swap_unrezzed_fort_ice_with_hq_ice",
      }),
    );
    expect(
      cardImplementationForDefinitionId(238)
        ?.successfulRunFollowups,
    ).toContainEqual(
      expect.objectContaining({
        kind: "force_rez_ice_outermost_inward_after_successful_run",
      }),
    );
  });

  it("migrates P3.53 run/encounter interventions into CardImplementation coverage", () => {
    const p353Cards = [
      277,
      279,
      454,
      459,
      483,
    ] as const;

    for (const definitionId of p353Cards) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationForDefinitionId(277)
        ?.runEncounterInterventions,
    ).toContainEqual(
      expect.objectContaining({
        kind: "approach_ice_expose_then_jack_out_before_rez",
      }),
    );
    expect(
      cardImplementationForDefinitionId(279)
        ?.runEncounterInterventions,
    ).toContainEqual(
      expect.objectContaining({
        kind: "jack_out_after_corp_rezzes_upgrade_or_node_before_effect",
      }),
    );
    expect(
      CARD_DEFINITIONS_BY_ID[454]?.subroutines,
    ).toContainEqual(
      expect.objectContaining({
        type: "set_next_encounter_unless_fully_break_damage",
        amount: 3,
      }),
    );
    expect(
      cardImplementationForDefinitionId(454)
        ?.printedSubroutines,
    ).toBeUndefined();
    expect(
      CARD_DEFINITIONS_BY_ID[459]?.subroutines,
    ).toContainEqual(
      expect.objectContaining({
        type: "set_runner_run_lock_actions",
        amount: 6,
      }),
    );
    expect(CARD_DEFINITIONS_BY_ID[483]?.subroutines).toEqual([
      expect.objectContaining({
        type: "end_the_run_and_runner_forgoes_next_action",
      }),
    ]);
    expect(
      cardImplementationForDefinitionId(459)
        ?.printedSubroutines,
    ).toBeUndefined();
    expect(
      cardImplementationForDefinitionId(483)
        ?.printedSubroutines,
    ).toBeUndefined();
  });

  it("migrates P3.54 delayed fort run windows into CardImplementation coverage", () => {
    const p354Cards = [
      561,
      570,
      571,
      584,
      585,
    ] as const;

    for (const definitionId of p354Cards) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationForDefinitionId(570)?.fortRunWindows,
    ).toContainEqual(
      expect.objectContaining({
        kind: "temporary_hq_ice_encounter_after_successful_run",
      }),
    );
    expect(
      cardImplementationForDefinitionId(571)
        ?.fortRunWindows,
    ).toContainEqual(
      expect.objectContaining({
        kind: "install_hq_ice_innermost_after_successful_run",
      }),
    );
    expect(
      cardImplementationForDefinitionId(
        585,
      )?.fortRunWindows,
    ).toContainEqual(
      expect.objectContaining({
        kind: "block_stealth_bits_during_runs_on_this_fort",
      }),
    );
    expect(
      cardImplementationForDefinitionId(584)
        ?.accessEffects?.[0]?.effects,
    ).toContainEqual(
      expect.objectContaining({
        kind: "trace",
        traceLimit: 10,
      }),
    );
  });

  it("migrates P3.55 fort region longtail cards into CardImplementation coverage", () => {
    const p355Cards = [
      577,
      579,
      580,
      583,
      573,
    ] as const;

    for (const definitionId of p355Cards) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationForDefinitionId(577)
        ?.fortRunWindows,
    ).toContainEqual(
      expect.objectContaining({
        kind: "corp_trace_bits_during_runs_on_this_fort",
        amount: 3,
      }),
    );
    expect(
      cardImplementationForDefinitionId(579)
        ?.fortRunWindows,
    ).toContainEqual(
      expect.objectContaining({
        kind: "roll_die_on_pass_rezzed_ice_on_same_fort",
      }),
    );
    expect(
      cardImplementationForDefinitionId(580)
        ?.fortRunWindows,
    ).toContainEqual(
      expect.objectContaining({
        kind: "server_run_start_restriction",
        target: "source_fort",
        condition:
          "corp_installed_or_advanced_on_target_server_during_latest_corp_turn",
      }),
    );
    expect(
      cardImplementationForDefinitionId(583)
        ?.fortRunWindows,
    ).toContainEqual(
      expect.objectContaining({
        kind: "gain_credits_after_unsuccessful_run_on_same_fort",
        amount: 2,
      }),
    );
    expect(
      cardImplementationForDefinitionId(573)
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
      434,
      440,
      460,
      472,
      484,
      487,
      488,
    ] as const;

    for (const definitionId of p356Cards) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationForDefinitionId(472)
        ?.iceEncounter,
    ).toMatchObject({
      kind: "add_encounter_temporary_credits",
      amount: 4,
    });
    expect(
      CARD_DEFINITIONS_BY_ID[488]?.subroutines,
    ).toHaveLength(2);
    expect(
      cardImplementationForDefinitionId(488)
        ?.printedSubroutines,
    ).toBeUndefined();
  });

  it("migrates Proteus Phase 1a reuse-only cards into CardImplementation coverage", () => {
    const phase1aCards = [
      99,
      123,
      130,
      135,
      208,
    ] as const;

    for (const definitionId of phase1aCards) {
      if (definitionId === 99) {
        expect(cardImplementationForDefinitionId(definitionId)).toBeUndefined();
        expect(
          cardImplementationCoverageForDefinitionId(definitionId),
        ).toMatchObject({
          cardDefinitionId: definitionId,
          status: "no_engine_behavior_required",
        });
        continue;
      }
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      CARD_DEFINITIONS_BY_ID[99]?.subroutines,
    ).toHaveLength(4);
    expect(
      cardImplementationForDefinitionId(
        208,
      )?.abilities?.[0],
    ).toMatchObject({
      kind: "activated",
      timing: "runner_main",
      costs: [{ kind: "action", amount: 1 }],
    });
  });

  it("migrates Proteus Phase 1b dynamic public ETR ICE into CardImplementation coverage", () => {
    const phase1bCards = [
      89,
      92,
    ] as const;

    for (const definitionId of phase1bCards) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationForDefinitionId(89)
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
      cardImplementationForDefinitionId(92)
        ?.abilities?.[0],
    ).toMatchObject({
      kind: "activated",
      timing: "corp_encounter",
      costs: [{ kind: "credit", amount: 2 }],
    });
  });

  it("migrates Proteus Phase 1d public fort pass windows into CardImplementation coverage", () => {
    const phase1dCards = [
      120,
      128,
    ] as const;

    for (const definitionId of phase1dCards) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationForDefinitionId(120)
        ?.fortRunWindows?.[0],
    ).toMatchObject({
      kind: "add_advancement_counters_after_passing_last_ice_on_this_fort",
      timing: "pass_last_ice_on_this_fort",
      target: "installed_card_in_this_fort",
    });
    expect(
      cardImplementationForDefinitionId(128)
        ?.fortRunWindows?.[0],
    ).toMatchObject({
      kind: "runner_pay_or_end_run_after_passing_ice_on_this_fort",
      timing: "pass_ice_on_this_fort",
      amount: 1,
    });
  });

  it("migrates Proteus Phase 1g post-pass derez utility into CardImplementation coverage", () => {
    const definitionId = 143;
    expect(
      cardImplementationForDefinitionId(definitionId),
      definitionId,
    ).toBeDefined();
    expect(
      cardImplementationCoverageForDefinitionId(definitionId),
    ).toMatchObject({
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

  it("migrates Proteus Phase 8d runner virus run counters into CardImplementation coverage", () => {
    const implemented = [
      148,
      155,
      156,
      157,
    ] as const;

    for (const definitionId of implemented) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
        definitionId,
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
  });

  it("migrates Proteus Phase 8e virus access-trash programs into CardImplementation coverage", () => {
    const implemented = [
      142,
      147,
    ] as const;

    for (const definitionId of implemented) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
        definitionId,
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
  });

  it("migrates Proteus Phase 8f random Bad-Publicity virus longtails into CardImplementation coverage", () => {
    const implemented = [
      136,
      152,
    ] as const;

    for (const definitionId of implemented) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
        definitionId,
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
  });

  it("migrates Proteus Phase 2b scored-agenda Bad Publicity into CardImplementation coverage", () => {
    const definitionId = 60;
    expect(
      cardImplementationForDefinitionId(definitionId),
      definitionId,
    ).toBeDefined();
    expect(
      cardImplementationCoverageForDefinitionId(definitionId),
    ).toMatchObject({
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

  it("migrates Proteus Phase 2c direct runner event BP damage into CardImplementation coverage", () => {
    const definitionId = 166;
    expect(
      cardImplementationForDefinitionId(definitionId),
      definitionId,
    ).toBeDefined();
    expect(
      cardImplementationCoverageForDefinitionId(definitionId),
    ).toMatchObject({
      cardDefinitionId: definitionId,
      status: "implemented",
    });
    expect(
      cardImplementationForDefinitionId(definitionId)?.abilities?.[0],
    ).toMatchObject({
      kind: "on_play",
      costs: "printed",
      effects: [
        { kind: "add_bad_publicity", amount: 1 },
        {
          kind: "damage",
          damageType: "core",
          amount: 2,
          preventable: false,
        },
      ],
    });
  });

  it("migrates Proteus Phase 2d installed-connection BP cost into CardImplementation coverage", () => {
    const definitionId = 175;
    expect(
      cardImplementationForDefinitionId(definitionId),
      definitionId,
    ).toBeDefined();
    expect(
      cardImplementationCoverageForDefinitionId(definitionId),
    ).toMatchObject({
      cardDefinitionId: definitionId,
      status: "implemented",
    });
    expect(
      cardImplementationForDefinitionId(definitionId)?.runnerEventLongtail,
    ).toMatchObject({
      kind: "trash_installed_runner_connections_then_add_bad_publicity",
      count: 2,
      badPublicity: 1,
      visibility: "hidden_info_barrier",
    });
  });

  it("migrates Proteus Phase 3a variable ICE into CardImplementation coverage", () => {
    const cases = [
      {
        definitionId: 78,
        variableRez: {
          kind: "x_strength",
          additionalCostPerValue: 1,
          minValue: 0,
          maxValue: 6,
        },
      },
      {
        definitionId: 80,
        variableRez: {
          kind: "paid_end_the_run_subroutines",
          additionalCostPerSubroutine: 2,
          minSubroutines: 0,
        },
      },
    ] as const;

    for (const { definitionId, variableRez } of cases) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
      expect(
        cardImplementationForDefinitionId(definitionId)?.variableRez,
      ).toMatchObject(variableRez);
    }
  });

  it("migrates Proteus Phase 3b variable ICE into CardImplementation coverage", () => {
    const cases = [
      {
        definitionId: 71,
        variableRez: { kind: "alternate_subtype", additionalCost: 1 },
      },
      {
        definitionId: 75,
        variableRez: { kind: "alternate_subtype", additionalCost: 1 },
      },
      {
        definitionId: 81,
        variableRez: { kind: "alternate_subtype", additionalCost: 1 },
      },
      {
        definitionId: 82,
        variableRez: { kind: "paid_end_the_run_subroutines" },
      },
      {
        definitionId: 83,
        variableRez: {
          kind: "x_strength",
          maxValue: 8,
          traceLimitFromValue: true,
        },
      },
      {
        definitionId: 86,
        variableRez: { kind: "alternate_subtype", additionalCost: 1 },
      },
      {
        definitionId: 94,
        variableRez: { kind: "paid_end_the_run_subroutines" },
      },
      {
        definitionId: 97,
        variableRez: { kind: "alternate_subtype", additionalCost: 4 },
      },
      {
        definitionId: 98,
        variableRez: { kind: "alternate_subtype", additionalCost: 1 },
      },
    ] as const;

    for (const { definitionId, variableRez } of cases) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
      expect(
        cardImplementationForDefinitionId(definitionId)?.variableRez,
      ).toMatchObject(variableRez);
    }
  });

  it("migrates Proteus Phase 3c relative ICE into CardImplementation coverage", () => {
    const cases = [
      70,
      79,
      84,
      88,
    ] as const;

    for (const definitionId of cases) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
      expect(
        cardImplementationForDefinitionId(definitionId)?.relativeIce,
      ).toMatchObject({
        kind: "rezzed_ice_outside_this_ice",
      });
    }
  });

  it("migrates Proteus Phase 3e ICE repositioning into CardImplementation coverage", () => {
    const cases = [
      91,
      102,
    ] as const;

    for (const definitionId of cases) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
      expect(
        cardImplementationForDefinitionId(definitionId)?.fortRunWindows?.[0],
      ).toMatchObject({
        kind: "move_self_to_different_position_on_same_fort",
        timing: "start_of_run_on_this_fort",
        target: "different_position_on_same_fort",
      });
    }
  });

  it("migrates Proteus PRO004 simple icebreakers into CardImplementation coverage", () => {
    const cases = [
      {
        definitionId: 137,
        breakCost: 6,
        matcher: { kind: "ice_subtype", subtype: "sentry" },
        count: 5,
        pumpCost: 1,
        pumpAmount: 1,
      },
      {
        definitionId: 139,
        breakCost: 2,
        matcher: { kind: "ice_subtype", subtype: "wall" },
        pumpCost: 1,
        pumpAmount: 1,
      },
      {
        definitionId: 141,
        breakCost: 0,
        matcher: { kind: "ice_subtype", subtype: "wall" },
        pumpCost: 1,
        pumpAmount: 1,
      },
      {
        definitionId: 151,
        breakCost: 1,
        matcher: { kind: "ice_subtype", subtype: "sentry" },
        count: 2,
        pumpCost: 3,
        pumpAmount: 1,
      },
      {
        definitionId: 153,
        breakCost: 0,
        matcher: { kind: "ice_subtype", subtype: "code_gate" },
        pumpCost: 3,
        pumpAmount: 4,
      },
      {
        definitionId: 158,
        breakCost: 0,
        matcher: { kind: "ice_subtype", subtype: "wall" },
        pumpCost: 2,
        pumpAmount: 1,
        stealthLoss: 1,
      },
    ] as const;

    for (const testCase of cases) {
      const implementation = cardImplementationForDefinitionId(
        testCase.definitionId,
      );
      expect(implementation, testCase.definitionId).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(testCase.definitionId),
      ).toMatchObject({
        cardDefinitionId: testCase.definitionId,
        status: "implemented",
      });

      const abilities = implementation?.icebreakerAbilities ?? [];
      expect(abilities.length, testCase.definitionId).toBeGreaterThanOrEqual(2);

      const breakAbility = abilities.find(
        (ability) => ability.kind === "break_subroutine",
      );
      expect(breakAbility, testCase.definitionId).toMatchObject({
        kind: "break_subroutine",
        cost: { kind: "credit", amount: testCase.breakCost },
        matches: testCase.matcher,
        visibility: "public",
      });
      if ("count" in testCase) {
        expect(breakAbility, testCase.definitionId).toMatchObject({
          count: testCase.count,
        });
      } else {
        expect(breakAbility, testCase.definitionId).not.toHaveProperty("count");
      }
      if ("stealthLoss" in testCase) {
        expect(breakAbility, testCase.definitionId).toMatchObject({
          onSuccessfulBreak: [
            {
              kind: "lose_bits_from_stealth_sources",
              amount: testCase.stealthLoss,
              sourceMode: "single_stealth_card",
              optionalIfUnavailable: true,
            },
          ],
        });
      }

      expect(
        abilities.find((ability) => ability.kind === "increase_strength"),
        testCase.definitionId,
      ).toMatchObject({
        kind: "increase_strength",
        cost: { kind: "credit", amount: testCase.pumpCost },
        amount: testCase.pumpAmount,
        duration: "current_encounter",
        visibility: "public",
      });
    }
  });

  it("migrates Proteus PRO005 simple runner economy/draw events into CardImplementation coverage", () => {
    const cases = [
      {
        definitionId: 161,
        effects: [
          {
            kind: "gain_credits",
            recipient: "controller",
            amount: 1,
            visibility: "public",
          },
          {
            kind: "draw_cards",
            recipient: "controller",
            amount: 2,
            visibility: "public",
          },
        ],
      },
      {
        definitionId: 182,
        effects: [
          {
            kind: "gain_credits",
            recipient: "controller",
            amount: 2,
            visibility: "public",
          },
          {
            kind: "draw_cards",
            recipient: "controller",
            amount: 1,
            visibility: "public",
          },
        ],
      },
    ] as const;

    for (const testCase of cases) {
      expect(
        cardImplementationForDefinitionId(testCase.definitionId),
        testCase.definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(testCase.definitionId),
      ).toMatchObject({
        cardDefinitionId: testCase.definitionId,
        status: "implemented",
      });
      expect(
        cardImplementationForDefinitionId(testCase.definitionId)?.abilities,
      ).toContainEqual(
        expect.objectContaining({
          kind: "on_play",
          costs: "printed",
          effects: testCase.effects,
        }),
      );
    }
  });

  it("migrates Proteus Phase 9d data-fort creation lock into CardImplementation coverage", () => {
    const definitionId = 204;

    expect(cardImplementationForDefinitionId(definitionId)).toMatchObject({
      modifiers: [
        {
          kind: "new_data_fort_creation_lock",
          activeWhile: "installed",
          sourceZone: "runner_installed",
          blocks: "corp_new_remote_installs",
          corpTrashSourceCost: { clicks: 1, credits: 4 },
        },
      ],
    });
    expect(
      cardImplementationCoverageForDefinitionId(definitionId),
    ).toMatchObject({
      cardDefinitionId: definitionId,
      status: "implemented",
    });
  });

  it("migrates P3.57 runner sabotage prep cards into CardImplementation coverage", () => {
    const p357Cards = [
      289,
      294,
      295,
      302,
      310,
      325,
      327,
      329,
    ] as const;

    for (const definitionId of p357Cards) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationForDefinitionId(300),
    ).toBeDefined();
    expect(
      cardImplementationForDefinitionId(323),
    ).toBeDefined();
  });

  it("migrates P3.58 hidden replacement longtail cards into CardImplementation coverage", () => {
    const p358Cards = [
      300,
      323,
      506,
      388,
      563,
      367,
    ] as const;

    for (const definitionId of p358Cards) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationForDefinitionId(343),
    ).toBeDefined();
  });

  it("migrates P3.59 runner utility longtail cards into CardImplementation coverage", () => {
    const p359Cards = [
      343,
      280,
      263,
      394,
      244,
      374,
      383,
      384,
      344,
    ] as const;

    for (const definitionId of p359Cards) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
  });

  it("migrates P3.60 Corporate Ally Karl de Veres Smith's Pawnshop Databroker Wilson Nevinyrral I Got a Rock Schlaghund Crash Everett unique direct CardImplementation coverage", () => {
    const p360ImplementedCards = [
      368,
      378,
      392,
      371,
      543,
      539,
      551,
    ] as const;

    for (const definitionId of p360ImplementedCards) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationForDefinitionId(
        399,
      ),
    ).toBeDefined();
    expect(
      cardImplementationForDefinitionId(
        369,
      ),
    ).toBeDefined();
  });

  it("migrates P3.61 remaining replacement longtail CardImplementation coverage", () => {
    const p361Cards = [
      369,
      399,
      520,
      541,
      525,
      537,
      566,
    ] as const;

    for (const definitionId of p361Cards) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
  });

  it("migrates P3.62 remaining singleton CardImplementation coverage", () => {
    const implementedCards = [
      224,
      316,
      385,
    ] as const;

    for (const definitionId of implementedCards) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationForDefinitionId(432),
    ).toBeUndefined();
    expect(
      cardImplementationCoverageForDefinitionId(432),
    ).toMatchObject({
      cardDefinitionId: 432,
      status: "no_engine_behavior_required",
    });
  });

  it("keeps Proteus exclusively in the canonical CardSpec source partition", () => {
    const proteusRuntimeIds = cardSpecRuntimeDefinitionIds().filter((id) =>
      id.startsWith("onr_proteus_"),
    );
    const proteusImplementationIds =
      cardSpecImplementationDefinitionIds().filter((id) =>
        id.startsWith("onr_proteus_"),
      );
    const legacyProteusImplementationIds = CARD_IMPLEMENTATIONS.filter(
      (implementation) =>
        implementation.cardDefinitionId.startsWith("onr_proteus_") &&
        !proteusImplementationIds.includes(implementation.cardDefinitionId),
    );

    expect(proteusRuntimeIds).toHaveLength(154);
    expect(proteusImplementationIds).toHaveLength(151);
    expect(legacyProteusImplementationIds).toEqual([]);
    expect(existsSync(`${repoRoot}/data/cards/proteus-cards.json`)).toBe(false);
    expect(
      existsSync(`${repoRoot}/data/manifests/proteus-card-support.json`),
    ).toBe(false);
    expect(
      existsSync(
        `${repoRoot}/packages/engine/src/card-implementations/proteus`,
      ),
    ).toBe(false);
    expect(
      existsSync(
        `${repoRoot}/packages/engine/src/card-implementations/subregistries/proteus-corp-agenda-implementations.ts`,
      ),
    ).toBe(false);

    for (const definitionId of proteusRuntimeIds) {
      const sourceRef = cardSpecSourceRefByDefinitionId(definitionId);
      expect(sourceRef?.sourcePath, definitionId).toMatch(
        /^packages\/cards\/src\/specs\/proteus\/.+\.card-spec\.ts$/,
      );
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
        definitionId,
      ).toBe(
        proteusImplementationIds.includes(definitionId)
          ? "implemented"
          : "no_engine_behavior_required",
      );
    }
  });

  it("requires implementation coverage for every demo card", () => {
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

    for (const definitionId of Object.keys(CARD_DEFINITIONS_BY_ID)) {
      const coverage = cardImplementationCoverageForDefinitionId(definitionId);
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
      expect(implementation, entry.cardDefinitionId).toBeDefined();
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

    const currentReleaseDefinitionIds = Object.keys(
      CARD_DEFINITIONS_BY_ID,
    ).filter((definitionId) =>
      isCurrentCardImplementationReleaseScopeDefinitionId(definitionId),
    );
    const outsideScopeDefinitionIds = Object.keys(
      CARD_DEFINITIONS_BY_ID,
    ).filter(
      (definitionId) =>
        !isCurrentCardImplementationReleaseScopeDefinitionId(definitionId),
    );
    const implementationIdSet = new Set(
      CARD_IMPLEMENTATIONS.map(
        (implementation) => implementation.cardDefinitionId,
      ),
    );
    const cardSpecRuntimeIdSet = new Set(cardSpecRuntimeDefinitionIds());
    const expectedOutsideScopeCoverageCount = outsideScopeDefinitionIds.filter(
      (definitionId) =>
        !implementationIdSet.has(definitionId) &&
        !cardSpecRuntimeIdSet.has(definitionId),
    ).length;

    expect(currentReleaseDefinitionIds).toHaveLength(374);
    expect(outsideScopeDefinitionIds.length).toBeGreaterThanOrEqual(206);
    expect(CARD_IMPLEMENTATIONS.length).toBeGreaterThanOrEqual(527);
    expect(coverageByStatus.get("implemented")).toBe(
      CARD_IMPLEMENTATIONS.length,
    );
    expect(coverageByStatus.get("no_engine_behavior_required")).toBe(24);
    expect(coverageByStatus.get("outside_current_release_scope") ?? 0).toBe(
      expectedOutsideScopeCoverageCount,
    );
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
      if (CARD_IMPLEMENTATIONS_BY_DEFINITION_ID[definitionId]) {
        expect(
          cardImplementationCoverageForDefinitionId(definitionId)?.status,
          definitionId,
        ).toBe("implemented");
      } else if (cardSpecRuntimeIdSet.has(definitionId)) {
        expect(
          cardImplementationCoverageForDefinitionId(definitionId)?.status,
          definitionId,
        ).toBe("no_engine_behavior_required");
      } else {
        expect(
          cardImplementationCoverageForDefinitionId(definitionId)?.status,
          definitionId,
        ).toBe("outside_current_release_scope");
      }
    }
  });

  it("registers migrated runner successful-run and access-interface cards as implemented", () => {
    const p332Cases = [
      293,
      296,
      297,
      308,
      317,
      318,
      319,
      330,
      274,
      262,
      341,
      351,
      236,
      395,
      253,
      354,
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

  it("migrates Proteus PRO006 simple Corp ICE resolvers into CardImplementation coverage", () => {
    const cases = [
      {
        definitionId: 69,
        printedSubroutines: [
          {
            kind: "damage",
            damageType: "brain",
            amount: 1,
            preventable: true,
            text: "*Do 1 brain damage.",
          },
        ],
      },
      {
        definitionId: 73,
        printedSubroutines: [
          { kind: "trash_program", text: "*Trash a program." },
          { kind: "trash_program", text: "*Trash a program." },
          { kind: "trash_program", text: "*Trash a program." },
          { kind: "end_the_run", text: "*End the run." },
          { kind: "end_the_run", text: "*End the run." },
        ],
      },
      {
        definitionId: 90,
        printedSubroutines: [
          {
            kind: "end_the_run_unless_runner_pays",
            amount: 1,
            text: "*End the run unless Runner pays [1].",
          },
        ],
        lifecycle: {
          on_rez: [
            {
              kind: "gain_credits",
              recipient: "corp",
              amount: 3,
              visibility: "public",
            },
          ],
        },
      },
      {
        definitionId: 96,
        printedSubroutines: [
          {
            kind: "end_the_run_unless_runner_pays",
            amount: 1,
            text: "*End the run unless Runner pays [1].",
          },
        ],
        lifecycle: {
          on_rez: [
            {
              kind: "gain_credits",
              recipient: "corp",
              amount: 3,
              visibility: "public",
            },
          ],
        },
      },
    ] as const;

    for (const testCase of cases) {
      const definitionOnly =
        testCase.definitionId === 69 ||
        testCase.definitionId === 73;
      if (definitionOnly) {
        expect(
          cardImplementationForDefinitionId(testCase.definitionId),
          testCase.definitionId,
        ).toBeUndefined();
        expect(
          cardImplementationCoverageForDefinitionId(testCase.definitionId),
        ).toMatchObject({
          cardDefinitionId: testCase.definitionId,
          status: "no_engine_behavior_required",
        });
        expect(
          CARD_DEFINITIONS_BY_ID[testCase.definitionId]?.subroutines,
          testCase.definitionId,
        ).toEqual(
          testCase.definitionId === 69
            ? [
                {
                  id: "subroutine_brain_damage_one",
                  type: "do_damage",
                  damageType: "core",
                  amount: 1,
                },
              ]
            : [
                {
                  id: "subroutine_trash_program_a",
                  type: "trash_installed_program",
                },
                {
                  id: "subroutine_trash_program_b",
                  type: "trash_installed_program",
                },
                {
                  id: "subroutine_trash_program_c",
                  type: "trash_installed_program",
                },
                {
                  id: "subroutine_end_run_a",
                  type: "end_the_run",
                },
                {
                  id: "subroutine_end_run_b",
                  type: "end_the_run",
                },
              ],
        );
        continue;
      }
      expect(
        cardImplementationForDefinitionId(testCase.definitionId),
        testCase.definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(testCase.definitionId),
      ).toMatchObject({
        cardDefinitionId: testCase.definitionId,
        status: "implemented",
      });
      expect(
        CARD_DEFINITIONS_BY_ID[testCase.definitionId]?.subroutines,
        testCase.definitionId,
      ).toEqual([
        {
          id: "subroutine_end_run_unless_runner_pays_one",
          type: "end_the_run_unless_runner_pays",
          amount: 1,
        },
      ]);
      if ("lifecycle" in testCase) {
        expect(
          cardImplementationForDefinitionId(testCase.definitionId)?.lifecycle,
          testCase.definitionId,
        ).toEqual(testCase.lifecycle);
      }
    }
  });

  it("migrates Proteus PRO007 Corp Operation economy, trace, and history cards into CardImplementation coverage", () => {
    const cases = [
      {
        definitionId: 105,
        ability: {
          kind: "on_play",
          costs: "printed",
          effects: [
            {
              kind: "gain_credits",
              recipient: "controller",
              amount: 15,
              visibility: "public",
            },
          ],
        },
      },
      {
        definitionId: 106,
        ability: {
          kind: "on_play",
          costs: "printed",
          condition: { kind: "runner_trashed_node_last_turn" },
          effects: [
            {
              kind: "add_tags",
              recipient: "runner",
              amount: 1,
              visibility: "public",
            },
          ],
        },
      },
      {
        definitionId: 108,
        ability: {
          kind: "on_play",
          costs: "printed",
          condition: { kind: "runner_attempted_run_last_turn", minimumRuns: 1 },
          effects: [
            {
              kind: "trace",
              traceLimit: 6,
              visibility: "public",
              onSuccess: [
                {
                  kind: "add_tags_by_trace_margin_over_runner_link",
                  recipient: "runner",
                  visibility: "public",
                },
              ],
            },
          ],
        },
      },
      {
        definitionId: 110,
        ability: {
          kind: "on_play",
          costs: "printed",
          condition: { kind: "runner_attempted_run_this_game", minimumRuns: 1 },
          effects: [
            {
              kind: "trace",
              traceLimit: 3,
              additionalPlayCostPerTraceLimitPointAboveZero: 1,
              visibility: "public",
              onSuccess: [
                {
                  kind: "add_tags",
                  recipient: "runner",
                  amount: 1,
                  visibility: "public",
                },
              ],
            },
          ],
        },
      },
      {
        definitionId: 111,
        ability: {
          kind: "on_play",
          costs: "printed",
          condition: { kind: "runner_installed_resource_last_turn" },
          effects: [
            {
              kind: "trace",
              traceLimit: 4,
              visibility: "public",
              onSuccess: [
                {
                  kind: "trash_runner_resource_and_add_tag",
                  target: "runner_resource_installed_last_turn",
                  visibility: "public",
                },
              ],
            },
          ],
        },
      },
    ] as const;

    for (const testCase of cases) {
      expect(
        cardImplementationForDefinitionId(testCase.definitionId),
        testCase.definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(testCase.definitionId),
      ).toMatchObject({
        cardDefinitionId: testCase.definitionId,
        status: "implemented",
      });
      expect(
        cardImplementationForDefinitionId(testCase.definitionId)?.abilities,
      ).toContainEqual(expect.objectContaining(testCase.ability));
    }
  });

  it("migrates Proteus PRO008 Runner Event Run/Economy/Followup Suite into CardImplementation coverage", () => {
    const cases = [
      159,
      162,
      163,
      164,
      165,
      172,
      176,
      178,
      179,
      180,
      185,
      188,
      206,
    ] as const;

    for (const definitionId of cases) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }

    expect(
      cardImplementationForDefinitionId(159)?.abilities,
    ).toContainEqual(
      expect.objectContaining({
        kind: "on_play",
        effects: [
          expect.objectContaining({
            kind: "make_run",
            target: { kind: "central_server", server: "hq" },
            accessCount: 4,
            prohibitNoisyIcebreakers: true,
          }),
        ],
      }),
    );
    expect(
      cardImplementationForDefinitionId(188)
        ?.abilities,
    ).toContainEqual(
      expect.objectContaining({
        timing: "trace_base_link_window",
        effects: [
          expect.objectContaining({
            kind: "use_base_link",
            baseLink: 2,
            rewardCreditsOnAvoidTrace: 1,
          }),
        ],
      }),
    );
  });

  it("migrates Proteus PRO011 hidden resource economy/access suite into CardImplementation coverage", () => {
    const cases = [
      186,
      191,
      200,
      201,
      205,
      207,
      210,
      211,
    ] as const;

    for (const definitionId of cases) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }

    expect(
      cardImplementationForDefinitionId(210)
        ?.abilities,
    ).toHaveLength(2);
    expect(
      cardImplementationForDefinitionId(211)
        ?.trashPreventionSources,
    ).toContainEqual(
      expect.objectContaining({
        protectsCardTypes: ["resource"],
        excludesSelf: true,
        cost: { kind: "trash_source" },
      }),
    );
  });

  it("migrates Proteus PRO012 hidden resource prevention/sabotage suite into CardImplementation coverage", () => {
    const cases = [
      187,
      190,
      194,
      195,
      198,
      199,
      203,
      212,
    ] as const;

    for (const definitionId of cases) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }

    expect(
      cardImplementationForDefinitionId(190)
        ?.damagePreventionSources,
    ).toContainEqual(
      expect.objectContaining({
        damageTypes: ["meat"],
        amount: 2,
        cost: { kind: "trash_source" },
      }),
    );
    expect(
      cardImplementationForDefinitionId(
        198,
      )?.tagPreventionSources,
    ).toContainEqual(
      expect.objectContaining({
        amount: 1,
        cost: { kind: "credit_and_trash_source", amount: 1 },
      }),
    );
    expect(
      cardImplementationForDefinitionId(212)
        ?.abilities,
    ).toContainEqual(
      expect.objectContaining({
        timing: "trace_post_bid_link_window",
        costs: [{ kind: "trash_source", amount: 1 }],
      }),
    );
  });

  it("migrates Proteus PRO013 agenda steal and overadvance suite into CardImplementation coverage", () => {
    const cases = [
      61,
      62,
      63,
      66,
      68,
      160,
      174,
      177,
    ] as const;

    for (const definitionId of cases) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }

    expect(
      cardImplementationForDefinitionId(62)
        ?.selfStealCosts,
    ).toContainEqual(
      expect.objectContaining({
        kind: "current_access_self_steal_cost",
        amount: 2,
      }),
    );
    expect(
      cardImplementationForDefinitionId(174)
        ?.abilities?.[0]?.effects,
    ).toContainEqual(
      expect.objectContaining({
        kind: "make_run_each_data_fort_sequence",
        onAllSuccessful: "gain_runner_event_agenda_point",
        onAnyUnsuccessful: "forgo_next_action",
      }),
    );
  });
});
