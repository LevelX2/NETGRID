import { describe, expect, it } from "vitest";
import { visibleBreakerEncounterQuote } from "./visible-breaker-encounter-quote";

describe("visibleBreakerEncounterQuote", () => {
  it("preserves Psychic Friend's current-turn pump horizon", () => {
    expect(
      visibleBreakerEncounterQuote({
        breakerDefinitionId: "onr_classic_030_psychic-friend",
        breakerInstanceId: "psychic-friend",
        breakerStrength: 1,
        iceDefinitionId: "simple_code_gate_ice",
        iceSubtypes: ["code_gate"],
      })?.pumpOptions,
    ).toEqual([
      expect.objectContaining({
        creditCost: 2,
        strengthGain: 1,
        duration: "current_turn",
      }),
    ]);
  });

  it("quotes Big Frackin' Gun's printed pump and five-subroutine break", () => {
    expect(
      visibleBreakerEncounterQuote({
        breakerDefinitionId: "onr_proteus_079_big-frackin-gun",
        breakerInstanceId: "bfg",
        breakerStrength: 7,
        iceDefinitionId: "onr_v1_223_banpei",
        iceSubtypes: ["sentry"],
      }),
    ).toMatchObject({
      effectiveStrength: 7,
      pumpOptions: [
        {
          creditCost: 1,
          strengthGain: 1,
          duration: "current_encounter",
        },
      ],
      breakOptions: [{ creditCost: 6, maximumSubroutinesPerUse: 5 }],
      coverageStatus: "full",
    });
  });

  it("keeps run-start random strength unresolved even when the displayed strength is positive", () => {
    expect(
      visibleBreakerEncounterQuote({
        breakerDefinitionId: "onr_v1_002_ai-boon",
        breakerInstanceId: "ai-boon",
        breakerStrength: 5,
        iceDefinitionId: "onr_v1_223_banpei",
        iceSubtypes: ["sentry"],
        randomRunStrengthState: { status: "unresolved" },
      }),
    ).toMatchObject({
      randomRunStrength: {
        status: "unresolved",
        minimumStrength: 1,
        expectedStrength: 3.5,
        maximumStrength: 6,
      },
    });
  });

  it("uses an explicit resolved run-start value, including zero", () => {
    expect(
      visibleBreakerEncounterQuote({
        breakerDefinitionId: "onr_proteus_087_forwards-legacy",
        breakerInstanceId: "legacy",
        breakerStrength: 5,
        iceDefinitionId: "onr_v1_223_banpei",
        iceSubtypes: ["sentry"],
        randomRunStrengthState: {
          status: "resolved",
          actualStrength: 0,
          currentStrengthAdjustment: 5,
        },
      }),
    ).toMatchObject({
      effectiveStrength: 5,
      randomRunStrength: {
        status: "resolved",
        actualStrength: 0,
        currentStrengthAdjustment: 5,
      },
    });
  });

  it("rejects a resolved random strength that does not explain the visible strength", () => {
    expect(() =>
      visibleBreakerEncounterQuote({
        breakerDefinitionId: "onr_v1_002_ai-boon",
        breakerInstanceId: "ai-boon",
        breakerStrength: 5,
        iceDefinitionId: "onr_v1_223_banpei",
        iceSubtypes: ["sentry"],
        randomRunStrengthState: {
          status: "resolved",
          actualStrength: 2,
          currentStrengthAdjustment: 0,
        },
      }),
    ).toThrow("zufaellige Breakerstaerke");
  });

  it("applies an implementation-declared chosen-ICE strength bonus only to its bound instance", () => {
    const common = {
      breakerDefinitionId: "onr_proteus_080_black-widow" as const,
      breakerInstanceId: "black_widow",
      breakerStrength: 2,
      selectedTargetCardId: "chosen_ice",
      iceDefinitionId: "onr_v1_223_banpei" as const,
      iceSubtypes: ["sentry"],
    };

    expect(
      visibleBreakerEncounterQuote({ ...common, iceInstanceId: "chosen_ice" }),
    ).toMatchObject({
      effectiveStrength: 7,
      coverageStatus: "full",
    });
    expect(
      visibleBreakerEncounterQuote({ ...common, iceInstanceId: "chosen_ice" }),
    ).toMatchObject({
      pumpOptions: [{ creditCost: 2, strengthGain: 1 }],
      breakOptions: [{ creditCost: 1, maximumSubroutinesPerUse: 1 }],
    });
    expect(
      visibleBreakerEncounterQuote({ ...common, iceInstanceId: "other_ice" }),
    ).toMatchObject({ effectiveStrength: 2 });
  });

  it("uses selected subtype state and reports an unresolved selectable breaker", () => {
    const common = {
      breakerDefinitionId: "onr_proteus_088_fubar" as const,
      breakerInstanceId: "fubar",
      breakerStrength: 1,
      iceDefinitionId: "onr_v1_223_banpei" as const,
      iceSubtypes: ["sentry"],
    };
    expect(visibleBreakerEncounterQuote(common)).toMatchObject({
      coverageStatus: "requires_selection",
    });
    expect(
      visibleBreakerEncounterQuote({ ...common, selectedSubtype: "sentry" }),
    ).toMatchObject({
      coverageStatus: "full",
      breakOptions: [
        {
          creditCost: 1,
          consequences: [{ kind: "lose_stealth_credits", amount: 1 }],
        },
      ],
    });
  });

  it("reports partial coverage when a breaker matches only structured trace subroutines", () => {
    expect(
      visibleBreakerEncounterQuote({
        breakerDefinitionId: "onr_v1_056_replicator",
        breakerInstanceId: "replicator",
        breakerStrength: 2,
        iceDefinitionId: "onr_v1_223_banpei",
        iceSubtypes: ["sentry"],
        subroutines: [
          { id: "trace", type: "initiate_trace" },
          { id: "etr", type: "end_the_run" },
        ],
      }),
    ).toMatchObject({
      coverageStatus: "partial",
      breakOptions: [{ breakableSubroutineIndexes: [0], creditCost: 0 }],
    });
  });

  it("quotes Flak against only AP-tagged subroutines", () => {
    expect(
      visibleBreakerEncounterQuote({
        breakerDefinitionId: "onr_v1_027_flak",
        breakerInstanceId: "flak",
        breakerStrength: 2,
        iceDefinitionId: "onr_v1_223_banpei",
        iceSubtypes: ["sentry", "ap"],
        subroutines: [
          { id: "ap", type: "do_damage", breakTags: ["ap"] },
          { id: "not-ap", type: "end_the_run" },
        ],
      }),
    ).toMatchObject({
      coverageStatus: "partial",
      breakOptions: [{ breakableSubroutineIndexes: [0], creditCost: 1 }],
    });
  });

  it("quotes Dogcatcher from dog ICE subtypes", () => {
    const common = {
      breakerDefinitionId: "onr_v1_018_dogcatcher" as const,
      breakerInstanceId: "dogcatcher",
      breakerStrength: 2,
      iceSubtypes: ["sentry", "pit_bull"],
      subroutines: [{ id: "etr", type: "end_the_run" as const }],
    };
    expect(
      visibleBreakerEncounterQuote({
        ...common,
        iceDefinitionId: "onr_v1_240_fang",
      }),
    ).toMatchObject({ coverageStatus: "full" });
    expect(
      visibleBreakerEncounterQuote({
        ...common,
        iceDefinitionId: "onr_v1_223_banpei",
        iceSubtypes: ["sentry"],
      }),
    ).toMatchObject({ coverageStatus: "none" });
  });

  it("quotes Reflector from stable subroutine break tags", () => {
    expect(
      visibleBreakerEncounterQuote({
        breakerDefinitionId: "onr_v1_055_reflector",
        breakerInstanceId: "reflector",
        breakerStrength: 4,
        iceDefinitionId: "onr_v1_223_banpei",
        iceSubtypes: ["sentry"],
        subroutines: [
          { id: "stun", type: "do_damage", breakTags: ["stun"] },
          { id: "hellbolt", type: "do_damage", breakTags: ["hellbolt"] },
          { id: "knockout", type: "do_damage", breakTags: ["knockout"] },
          { id: "other", type: "end_the_run" },
        ],
      }),
    ).toMatchObject({
      coverageStatus: "partial",
      breakOptions: [{ breakableSubroutineIndexes: [0, 1, 2], creditCost: 0 }],
    });
  });

  it("quotes Pile Driver's stealth loss once per four-subroutine break use", () => {
    expect(
      visibleBreakerEncounterQuote({
        breakerDefinitionId: "onr_v1_047_pile-driver",
        breakerInstanceId: "pile-driver",
        breakerStrength: 7,
        iceDefinitionId: "onr_v1_232_crystal-wall",
        iceSubtypes: ["wall"],
      }),
    ).toMatchObject({
      breakOptions: [
        {
          maximumSubroutinesPerUse: 4,
          consequences: [
            {
              kind: "lose_stealth_credits",
              amount: 3,
              trigger: "per_ability_use",
              sourceMode: "any_stealth_cards",
              optionalIfUnavailable: true,
            },
          ],
        },
      ],
    });
  });

  it("returns no regular quote for an unknown breaker definition", () => {
    expect(
      visibleBreakerEncounterQuote({
        breakerDefinitionId: "unknown-breaker" as never,
        breakerInstanceId: "unknown",
        breakerStrength: 5,
        iceDefinitionId: "onr_v1_223_banpei",
        iceSubtypes: ["sentry"],
      }),
    ).toBeUndefined();
  });

  it("quotes Japanese Water Torture's future-click loss with its variable pump", () => {
    expect(
      visibleBreakerEncounterQuote({
        breakerDefinitionId: "onr_v1_037_japanese-water-torture",
        breakerInstanceId: "torture",
        breakerStrength: 2,
        iceDefinitionId: "onr_v1_232_crystal-wall",
        iceSubtypes: ["wall"],
      }),
    ).toMatchObject({
      pumpOptions: [
        {
          creditCost: 1,
          consequences: expect.arrayContaining([
            { kind: "lose_future_clicks", amountPerStrength: 1 },
          ]),
        },
      ],
    });
  });

  it("derives Blink's probability and net-damage range from its structured die effect", () => {
    expect(
      visibleBreakerEncounterQuote({
        breakerDefinitionId: "onr_v1_007_blink",
        breakerInstanceId: "blink",
        breakerStrength: 5,
        iceDefinitionId: "onr_v1_223_banpei",
        iceSubtypes: ["sentry"],
      }),
    ).toMatchObject({
      breakOptions: [
        {
          consequences: [
            {
              kind: "random_break_attempt",
              successProbability: 0.5,
              expectedNetDamage: 1,
              maximumNetDamage: 3,
            },
          ],
        },
      ],
    });
  });
});
