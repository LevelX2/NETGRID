import { describe, expect, it } from "vitest";
import {
  visibleBreakerEncounterQuote,
  visibleBreakerCoverageQuote,
} from "./visible-breaker-encounter-quote";

describe("visibleBreakerEncounterQuote", () => {
  it("preserves negative public breaker strength after counter penalties", () => {
    expect(
      visibleBreakerEncounterQuote({
        breakerDefinitionId: 251,
        breakerInstanceId: "krash",
        breakerStrength: -1,
        iceDefinitionId: 70,
      }),
    ).toMatchObject({ effectiveStrength: -1 });
  });

  it("preserves a signed resolved random-strength adjustment", () => {
    expect(
      visibleBreakerEncounterQuote({
        breakerDefinitionId: 214,
        breakerInstanceId: "boon",
        breakerStrength: -1,
        iceDefinitionId: 70,
        randomRunStrengthState: {
          status: "resolved",
          actualStrength: 2,
          currentStrengthAdjustment: -3,
        },
      }),
    ).toMatchObject({ effectiveStrength: -1 });
  });

  it("preserves Psychic Friend's current-turn pump horizon", () => {
    expect(
      visibleBreakerEncounterQuote({
        breakerDefinitionId: 34,
        breakerInstanceId: "psychic-friend",
        breakerStrength: 1,
        iceDefinitionId: 590,
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
        breakerDefinitionId: 137,
        breakerInstanceId: "bfg",
        breakerStrength: 7,
        iceDefinitionId: 435,
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
        breakerDefinitionId: 214,
        breakerInstanceId: "ai-boon",
        breakerStrength: 5,
        iceDefinitionId: 435,
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
        breakerDefinitionId: 145,
        breakerInstanceId: "legacy",
        breakerStrength: 5,
        iceDefinitionId: 435,
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
        breakerDefinitionId: 214,
        breakerInstanceId: "ai-boon",
        breakerStrength: 5,
        iceDefinitionId: 435,
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
      breakerDefinitionId: 138 as const,
      breakerInstanceId: "black_widow",
      breakerStrength: 2,
      selectedTargetCardId: "chosen_ice",
      iceDefinitionId: 435 as const,
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
      breakerDefinitionId: 146 as const,
      breakerInstanceId: "fubar",
      breakerStrength: 1,
      iceDefinitionId: 435 as const,
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
        breakerDefinitionId: 268,
        breakerInstanceId: "replicator",
        breakerStrength: 2,
        iceDefinitionId: 435,
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
        breakerDefinitionId: 239,
        breakerInstanceId: "flak",
        breakerStrength: 2,
        iceDefinitionId: 435,
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
      breakerDefinitionId: 230 as const,
      breakerInstanceId: "dogcatcher",
      breakerStrength: 2,
      iceSubtypes: ["sentry", "pit_bull"],
      subroutines: [{ id: "etr", type: "end_the_run" as const }],
    };
    expect(
      visibleBreakerEncounterQuote({
        ...common,
        iceDefinitionId: 452,
      }),
    ).toMatchObject({ coverageStatus: "full" });
    expect(
      visibleBreakerEncounterQuote({
        ...common,
        iceDefinitionId: 435,
        iceSubtypes: ["sentry"],
      }),
    ).toMatchObject({ coverageStatus: "none" });
  });

  it("quotes Reflector from stable subroutine break tags", () => {
    expect(
      visibleBreakerEncounterQuote({
        breakerDefinitionId: 267,
        breakerInstanceId: "reflector",
        breakerStrength: 4,
        iceDefinitionId: 435,
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
        breakerDefinitionId: 259,
        breakerInstanceId: "pile-driver",
        breakerStrength: 7,
        iceDefinitionId: 444,
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
        iceDefinitionId: 435,
        iceSubtypes: ["sentry"],
      }),
    ).toBeUndefined();
  });

  it("quotes Japanese Water Torture's future-click loss with its variable pump", () => {
    expect(
      visibleBreakerEncounterQuote({
        breakerDefinitionId: 249,
        breakerInstanceId: "torture",
        breakerStrength: 2,
        iceDefinitionId: 444,
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
        breakerDefinitionId: 219,
        breakerInstanceId: "blink",
        breakerStrength: 5,
        iceDefinitionId: 435,
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

describe("visibleBreakerCoverageQuote", () => {
  it.each([491, 473])(
    "proves no applicable random Sentry break on %s without a strength",
    (iceDefinitionId) => {
      expect(
        visibleBreakerCoverageQuote({
          breakerDefinitionId: 214,
          iceDefinitionId,
        }),
      ).toEqual({ breakOptions: [], coverageStatus: "none" });
    },
  );
  it("keeps matching Sentry coverage separate from unresolved strength", () => {
    expect(
      visibleBreakerCoverageQuote({
        breakerDefinitionId: 214,
        iceDefinitionId: 435,
        subroutines: [{ id: "etr", type: "end_the_run" }],
      }),
    ).toMatchObject({
      coverageStatus: "full",
      breakOptions: [{ breakableSubroutineIndexes: [0] }],
    });
    expect(
      visibleBreakerEncounterQuote({
        breakerDefinitionId: 214,
        breakerInstanceId: "boon",
        breakerStrength: 0,
        iceDefinitionId: 435,
      }),
    ).toBeUndefined();
  });
  it("requires a subtype choice rather than declaring no coverage", () => {
    expect(
      visibleBreakerCoverageQuote({
        breakerDefinitionId: 146,
        iceDefinitionId: 435,
      })?.coverageStatus,
    ).toBe("requires_selection");
  });
  it("does not invent an unknown ICE or breaker definition", () => {
    expect(
      visibleBreakerCoverageQuote({
        breakerDefinitionId: 214,
        iceDefinitionId: 3949173407,
      }),
    ).toBeUndefined();
    expect(
      visibleBreakerCoverageQuote({
        breakerDefinitionId: 4552044,
        iceDefinitionId: 435,
      }),
    ).toBeUndefined();
  });
});
