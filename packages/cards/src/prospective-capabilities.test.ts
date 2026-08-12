import type { CardDefinitionId } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { capabilityKey } from "./capability-identity";
import type { CardSpec } from "./contracts";
import type { CardMechanicalSpec } from "./engine/card-mechanical-contracts";
import {
  PROSPECTIVE_CLASS_BY_FAMILY,
  compileProspectiveCapabilities,
  type ProspectiveCapability,
  type ProspectiveCapabilityFamily,
} from "./prospective-capabilities";
import { canonicalSerialize } from "./serializable";
import { minimalCardSpec } from "./test-fixtures";

const EXPECTED_FAMILIES = [
  "abilities",
  "accessEffects",
  "accessHooks",
  "advanceable",
  "agendaAccessReplacement",
  "corpRootRezCreditOutcome",
  "corpTrashInstalledRunnerSource",
  "corpUtility",
  "damagePreventionSources",
  "flatlineReplacementSources",
  "fortCapacityModifiers",
  "fortRunWindows",
  "hardwareDeck",
  "hiddenReplacementLongtail",
  "hostedProgramCapacity",
  "hostedProgramModifiers",
  "iceEncounter",
  "icebreakerAbilities",
  "icebreakerEncounterStrengthBonus",
  "icebreakerSubtypeChange",
  "installAdditionalCosts",
  "installCapabilities",
  "installTargetBinding",
  "leavePlayCleanup",
  "lifecycle",
  "modifiers",
  "printedSubroutines",
  "regionBaseline",
  "relativeIce",
  "remainingReplacementLongtail",
  "restrictedHostedCreditSource",
  "runEncounterInterventions",
  "runnerCounterEffects",
  "runnerEventLongtail",
  "runnerEventTargetedEffect",
  "runnerRunStrengthBoost",
  "runnerUtilityLongtail",
  "scoredAgenda",
  "selfRezAdditionalCosts",
  "selfRezCostModifiers",
  "selfStealCosts",
  "successfulRunFollowups",
  "tagPreventionSources",
  "trashPreventionSources",
  "unique",
  "uniqueDirectLongtail",
  "variableRez",
  "virusCounter",
] as const satisfies readonly ProspectiveCapabilityFamily[];

function spec(id: string, title: string, side: "runner" | "corp" = "runner") {
  const value = minimalCardSpec();
  value.identity.cardDefinitionId = id as CardDefinitionId;
  value.identity.title = title;
  value.identity.side = side;
  value.identity.cardType = side === "runner" ? "program" : "asset";
  value.engine.characteristics.playCost = null;
  value.engine.characteristics.numeric =
    side === "runner"
      ? {
          installCost: 0,
          memoryCost: 0,
          rezCost: null,
          trashCost: null,
          advancementRequirement: null,
          agendaPoints: null,
        }
      : {
          installCost: null,
          memoryCost: null,
          rezCost: 0,
          trashCost: 0,
          advancementRequirement: null,
          agendaPoints: null,
        };
  value.printings = [{ ...value.printings[0]!, printingId: `${id}:test` }];
  return value;
}

function keyed(key: string) {
  return {
    capabilityKey: capabilityKey(key),
    addressability: ["action"] as const,
  };
}

function capabilities(specification: CardSpec, family: string) {
  return compileProspectiveCapabilities(specification).capabilities.filter(
    (entry) => entry.family === family,
  );
}

function byKey(specification: CardSpec, key: string): ProspectiveCapability {
  const entry = compileProspectiveCapabilities(specification).capabilities.find(
    (candidate) =>
      candidate.identity.kind === "keyed" &&
      candidate.identity.capabilityKey === key,
  );
  expect(entry).toBeDefined();
  return entry!;
}

function descriptorValue(entry: ProspectiveCapability, pathSuffix: string) {
  return entry.descriptors.find((descriptor) =>
    descriptor.path.endsWith(pathSuffix),
  )?.value;
}

describe("compileProspectiveCapabilities", () => {
  it("locks the exhaustive 48-family CS01 classification", () => {
    expect(Object.keys(PROSPECTIVE_CLASS_BY_FAMILY).sort()).toEqual(
      [...EXPECTED_FAMILIES].sort(),
    );
    expect(
      Object.values(PROSPECTIVE_CLASS_BY_FAMILY).filter(
        (value) => value === "statically_compilable",
      ),
    ).toHaveLength(16);
    expect(
      Object.values(PROSPECTIVE_CLASS_BY_FAMILY).filter(
        (value) => value === "requires_engine_quote",
      ),
    ).toHaveLength(31);
    expect(PROSPECTIVE_CLASS_BY_FAMILY.regionBaseline).toBe("unknown");
  });

  it("compiles Broker abilities, shared source limit, and its static initial condition", () => {
    const broker = spec("stress_broker", "Broker");
    broker.engine.abilities = [
      {
        ...keyed("store_credits"),
        kind: "activated",
        timing: "runner_main",
        costs: [{ kind: "action", amount: 1 }],
        limit: {
          kind: "once_per_turn_per_source",
          scope: "any_ability_on_source",
        },
        effects: [
          {
            kind: "add_hosted_credits",
            target: "source",
            amount: 3,
            visibility: "public",
          },
        ],
      },
      {
        ...keyed("withdraw_credits"),
        kind: "activated",
        timing: "runner_main",
        costs: [{ kind: "action", amount: 1 }],
        condition: { kind: "source_has_hosted_credits" },
        limit: {
          kind: "once_per_turn_per_source",
          scope: "any_ability_on_source",
        },
        effects: [
          {
            kind: "take_hosted_credits",
            source: "source",
            recipient: "controller",
            mode: "all",
            visibility: "public",
          },
        ],
      },
    ];
    broker.text.capabilityText = [
      {
        capabilityKey: capabilityKey("store_credits"),
        actionLabel: "Store credits",
      },
      {
        capabilityKey: capabilityKey("withdraw_credits"),
        actionLabel: "Withdraw credits",
      },
    ];

    const store = byKey(broker, "store_credits");
    const withdraw = byKey(broker, "withdraw_credits");
    expect(store.identity).toMatchObject({
      kind: "keyed",
      canonicalCapabilityId: "stress_broker:store_credits",
    });
    expect(descriptorValue(store, ".costs")).toEqual([
      { kind: "action", amount: 1 },
    ]);
    expect(descriptorValue(store, ".limit")).toEqual(
      descriptorValue(withdraw, ".limit"),
    );
    expect(store.initialConditionEvaluation).toEqual({
      state: "not_applicable",
    });
    expect(withdraw.initialConditionEvaluation).toMatchObject({
      state: "condition_unsatisfied",
      reason: "source_hosted_credits_initialized_to_zero",
    });
    expect(withdraw.uncertaintyClass).toBe("requires_engine_quote");
    expect(compileProspectiveCapabilities(broker).initializedValues).toEqual([
      { kind: "hosted_credits", value: 0, basis: "engine_default" },
    ]);
    expect(descriptorValue(store, ".effects")).toEqual([
      expect.objectContaining({ kind: "add_hosted_credits", amount: 3 }),
    ]);
    expect(descriptorValue(withdraw, ".effects")).toEqual([
      expect.objectContaining({ kind: "take_hosted_credits", mode: "all" }),
    ]);
  });

  it("keeps Loan from Chiba transition outcome and three liabilities separate", () => {
    const loan = spec("stress_loan", "Loan from Chiba");
    loan.engine.lifecycle = {
      on_install: [
        {
          kind: "gain_credits",
          recipient: "controller",
          amount: 12,
          visibility: "public",
        },
      ],
      start_of_runner_turn: [
        {
          effects: [
            {
              kind: "lose_credits",
              recipient: "controller",
              amount: 1,
              visibility: "public",
            },
          ],
        },
      ],
      on_leave_play: [
        {
          kind: "pay_credits_or_lose_game",
          payer: "controller",
          amount: 10,
          loseSide: "controller",
          reason: "source_left_play",
          visibility: "public",
        },
      ],
      end_of_runner_turn: [
        {
          ...keyed("trash_at_end_of_turn"),
          effects: [{ kind: "trash_source", visibility: "public" }],
        },
      ],
    };

    const lifecycle = capabilities(loan, "lifecycle");
    const onInstall = lifecycle.find((entry) =>
      entry.sourcePath.endsWith(".on_install[0]"),
    )!;
    expect(onInstall.directOutcomes).toContainEqual(
      expect.objectContaining({
        phase: "transition",
        resolution: "declared_transition_effect",
      }),
    );
    expect(descriptorValue(onInstall, ".amount")).toBe(12);
    const liabilities = lifecycle.flatMap((entry) => entry.liabilities);
    expect(liabilities.map((entry) => entry.phase).sort()).toEqual([
      "end_of_runner_turn",
      "on_leave_play",
      "start_of_runner_turn",
    ]);
    expect(liabilities).toContainEqual(
      expect.objectContaining({
        phase: "on_leave_play",
        resolution: "requires_engine_quote",
      }),
    );
    expect(
      lifecycle.find((entry) =>
        entry.sourcePath.endsWith(".start_of_runner_turn[0]"),
      )?.descriptors,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "effect",
          value: [expect.objectContaining({ kind: "lose_credits", amount: 1 })],
        }),
      ]),
    );
    expect(byKey(loan, "trash_at_end_of_turn").liabilities).toEqual([
      expect.objectContaining({ resolution: "addressable_choice" }),
    ]);
    expectUnique(lifecycle.map((entry) => entry.sourcePath));
    expectUnique(
      lifecycle.flatMap((entry) =>
        entry.descriptors.map((descriptor) => descriptor.path),
      ),
    );
    expectUnique(
      lifecycle.flatMap((entry) =>
        entry.directOutcomes.map((outcome) => outcome.sourcePath),
      ),
    );
    expectUnique(liabilities.map((entry) => entry.sourcePath));
    expect(byKey(loan, "trash_at_end_of_turn").identity).toMatchObject({
      canonicalCapabilityId: "stress_loan:trash_at_end_of_turn",
    });
  });

  it("keeps Black Widow's install binding abstract and its bonus scoped", () => {
    const widow = spec("stress_black_widow", "Black Widow");
    widow.engine.installTargetBinding = {
      ...keyed("bind_ice"),
      kind: "choose_installed_ice_on_install",
      stores: "selectedCardId",
      visibility: "public",
    };
    widow.engine.icebreakerEncounterStrengthBonus = {
      kind: "against_selected_installed_ice",
      amount: 5,
      visibility: "public",
    };
    widow.engine.icebreakerAbilities = [
      {
        ...keyed("break_sentry"),
        kind: "break_subroutine",
        cost: { kind: "credit", amount: 1 },
        matches: { kind: "ice_subtype", subtype: "sentry" },
        visibility: "public",
      },
      {
        ...keyed("pump"),
        kind: "increase_strength",
        cost: { kind: "credit", amount: 2 },
        amount: 1,
        duration: "current_encounter",
        visibility: "public",
      },
    ] satisfies NonNullable<CardMechanicalSpec["icebreakerAbilities"]>;
    const binding = byKey(widow, "bind_ice");
    expect(binding.installChoices).toEqual([
      expect.objectContaining({ selectedValue: null }),
    ]);
    expect(descriptorValue(binding, ".kind")).toBe(
      "choose_installed_ice_on_install",
    );
    expect(descriptorValue(binding, ".stores")).toBe("selectedCardId");
    expect(descriptorValue(byKey(widow, "break_sentry"), ".cost")).toEqual({
      kind: "credit",
      amount: 1,
    });
    expect(descriptorValue(byKey(widow, "break_sentry"), ".matches")).toEqual({
      kind: "ice_subtype",
      subtype: "sentry",
    });
    expect(descriptorValue(byKey(widow, "pump"), ".cost")).toEqual({
      kind: "credit",
      amount: 2,
    });
    expect(descriptorValue(byKey(widow, "pump"), ".amount")).toBe(1);
    expect(canonicalSerialize(binding)).not.toMatch(/instanceId|card-\d+/);
    expect(
      capabilities(widow, "icebreakerEncounterStrengthBonus")[0],
    ).toMatchObject({ uncertaintyClass: "statically_compilable" });
    expect(
      descriptorValue(
        capabilities(widow, "icebreakerEncounterStrengthBonus")[0]!,
        ".kind",
      ),
    ).toBe("against_selected_installed_ice");
  });

  it("compiles Morphing Tool's unselected install choice and later subtype change", () => {
    const morphing = spec("stress_morphing_tool", "Morphing Tool");
    morphing.engine.installTargetBinding = {
      ...keyed("choose_initial_subtype"),
      kind: "choose_icebreaker_subtype_on_install",
      stores: "selectedSubtype",
      choices: ["code_gate", "sentry", "wall"],
      visibility: "public",
    };
    morphing.engine.icebreakerSubtypeChange = {
      ...keyed("change_subtype"),
      timing: "runner_main",
      cost: { clicks: 1, credits: 1 },
      choices: ["code_gate", "sentry", "wall"],
      visibility: "public",
    };
    morphing.engine.icebreakerAbilities = [
      {
        ...keyed("break_selected_subtype"),
        kind: "break_subroutine",
        cost: { kind: "credit", amount: 2 },
        matches: { kind: "selected_ice_subtype" },
        visibility: "public",
      },
    ] satisfies NonNullable<CardMechanicalSpec["icebreakerAbilities"]>;
    const initial = byKey(morphing, "choose_initial_subtype");
    expect(initial.installChoices[0]).toMatchObject({ selectedValue: null });
    expect(descriptorValue(initial, ".choices")).toEqual([
      "code_gate",
      "sentry",
      "wall",
    ]);
    expect(
      descriptorValue(byKey(morphing, "break_selected_subtype"), ".matches"),
    ).toEqual({ kind: "selected_ice_subtype" });
    expect(
      descriptorValue(byKey(morphing, "change_subtype"), ".choices"),
    ).toEqual(["code_gate", "sentry", "wall"]);
    expect(byKey(morphing, "change_subtype")).toMatchObject({
      uncertaintyClass: "requires_engine_quote",
      descriptors: expect.arrayContaining([
        expect.objectContaining({
          kind: "cost",
          value: { clicks: 1, credits: 1 },
        }),
      ]),
    });
  });

  it("keeps Sneak Preview at the hidden-zone choice boundary", () => {
    const sneak = spec("stress_sneak_preview", "Sneak Preview");
    sneak.identity.cardType = "event";
    sneak.engine.characteristics.playCost = { kind: "fixed", credits: 0 };
    sneak.engine.characteristics.numeric = {
      installCost: null,
      memoryCost: null,
      rezCost: null,
      trashCost: null,
      advancementRequirement: null,
      agendaPoints: null,
    };
    sneak.engine.abilities = [
      {
        ...keyed("play_sneak_preview"),
        kind: "on_play",
        costs: "printed",
        effects: [
          {
            kind: "choose_stack_or_trash_program_install",
            installCost: "free",
            shuffleStackAfterwards: true,
            returnInstalledCardToGripAtEndOfTurn: true,
            visibility: "hidden_info_barrier",
          },
        ],
      },
    ];
    const ability = byKey(sneak, "play_sneak_preview");
    expect(ability.transition).toMatchObject({
      kind: "play",
      sourceState: "in_hand",
    });
    expect(ability.installChoices).toEqual([
      expect.objectContaining({ selectedValue: null }),
    ]);
    expect(descriptorValue(ability, ".effects")).toEqual([
      expect.objectContaining({
        kind: "choose_stack_or_trash_program_install",
        installCost: "free",
        shuffleStackAfterwards: true,
        returnInstalledCardToGripAtEndOfTurn: true,
        visibility: "hidden_info_barrier",
      }),
    ]);
    expect(ability.directOutcomes).toEqual([
      expect.objectContaining({ resolution: "requires_engine_quote" }),
    ]);
    expect(ability.liabilities).toEqual([
      expect.objectContaining({
        phase: "end_of_turn_cleanup",
        resolution: "requires_engine_quote",
      }),
    ]);
    expect(ability.uncertaintyClass).toBe("requires_engine_quote");
    expect(canonicalSerialize(ability)).not.toMatch(/selectedCard|instanceId/);
  });

  it("covers Data Masons, Digiconda, Virus Test Site, Data Fort Reclamation, and Roving Submarine families", () => {
    const dataMasons = spec("stress_data_masons", "Data Masons", "corp");
    dataMasons.engine.modifiers = [
      {
        kind: "rez_cost",
        operation: "reduce",
        amount: 2,
        activeWhile: "rezzed",
        sourceZone: "corp_root",
        visibility: "public",
        appliesTo: { cardType: "ice", subtype: "wall" },
      },
      {
        kind: "ice_strength",
        operation: "increase",
        amount: 1,
        activeWhile: "rezzed",
        sourceZone: "corp_root",
        visibility: "public",
        appliesTo: { side: "corp", cardType: "ice", subtype: "wall" },
      },
    ];
    expect(capabilities(dataMasons, "modifiers")).toHaveLength(2);
    expect(capabilities(dataMasons, "modifiers")[0]?.uncertaintyClass).toBe(
      "statically_compilable",
    );
    const [rezReduction, strengthIncrease] = capabilities(
      dataMasons,
      "modifiers",
    );
    expect(descriptorValue(rezReduction!, ".operation")).toBe("reduce");
    expect(descriptorValue(rezReduction!, ".amount")).toBe(2);
    expect(descriptorValue(rezReduction!, ".activeWhile")).toBe("rezzed");
    expect(descriptorValue(rezReduction!, ".appliesTo")).toEqual({
      cardType: "ice",
      subtype: "wall",
    });
    expect(descriptorValue(strengthIncrease!, ".operation")).toBe("increase");
    expect(descriptorValue(strengthIncrease!, ".amount")).toBe(1);

    const digiconda = spec("stress_digiconda", "Digiconda", "corp");
    digiconda.identity.cardType = "ice";
    digiconda.engine.characteristics.numeric.rezCost = 6;
    digiconda.engine.characteristics.numeric.trashCost = null;
    digiconda.engine.characteristics.strength = {
      kind: "paid_x",
      minimumStrength: 0,
      maximumStrength: 6,
    };
    digiconda.engine.variableRez = {
      ...keyed("choose_rez_x"),
      kind: "x_strength",
      additionalCostPerValue: 1,
      minValue: 0,
      maxValue: 6,
      visibility: "public",
    };
    expect(byKey(digiconda, "choose_rez_x")).toMatchObject({
      uncertaintyClass: "requires_engine_quote",
      transition: { kind: "rez" },
    });
    expect(canonicalSerialize(byKey(digiconda, "choose_rez_x"))).not.toMatch(
      /chosenX|legalAction/,
    );
    expect(descriptorValue(byKey(digiconda, "choose_rez_x"), ".minValue")).toBe(
      0,
    );
    expect(descriptorValue(byKey(digiconda, "choose_rez_x"), ".maxValue")).toBe(
      6,
    );
    expect(
      descriptorValue(
        byKey(digiconda, "choose_rez_x"),
        ".additionalCostPerValue",
      ),
    ).toBe(1);

    const virus = spec("stress_virus_test_site", "Virus Test Site", "corp");
    virus.engine.advanceable = { while: "installed_before_and_after_rez" };
    virus.engine.accessEffects = [
      {
        ...keyed("access_unrezzed"),
        kind: "on_access",
        sourceZones: ["installed"],
        installedSourceActivation: "unrezzed_only",
        visibility: "hidden_info_barrier",
        effects: [
          {
            kind: "damage",
            recipient: "runner",
            damageType: "net",
            amount: 1,
            preventable: true,
            visibility: "hidden_info_barrier",
          },
        ],
      },
      {
        ...keyed("access_installed"),
        kind: "on_access",
        sourceZones: ["installed"],
        visibility: "hidden_info_barrier",
        effects: [
          {
            kind: "damage_from_source_advancement_counters",
            recipient: "runner",
            damageType: "net",
            amountPerCounter: 2,
            minimumAmount: 1,
            preventable: true,
            visibility: "hidden_info_barrier",
          },
        ],
      },
      {
        ...keyed("access_central"),
        kind: "on_access",
        sourceZones: ["hq", "rd", "archives"],
        ignoreIfAccessedFrom: ["archives"],
        revealIfAccessedFrom: ["rd"],
        visibility: "hidden_info_barrier",
        effects: [
          {
            kind: "damage_from_source_advancement_counters",
            recipient: "runner",
            damageType: "net",
            amountPerCounter: 2,
            minimumAmount: 1,
            preventable: true,
            visibility: "hidden_info_barrier",
          },
        ],
      },
    ];
    expect(capabilities(virus, "advanceable")[0]?.uncertaintyClass).toBe(
      "statically_compilable",
    );
    expect(capabilities(virus, "accessEffects")).toHaveLength(3);
    expect(
      capabilities(virus, "accessEffects").every(
        (entry) => entry.uncertaintyClass === "requires_engine_quote",
      ),
    ).toBe(true);
    expect(capabilities(virus, "advanceable")[0]?.transition).toMatchObject({
      kind: "install",
      sourceState: "installed",
    });
    const centralAccess = byKey(virus, "access_central");
    expect(descriptorValue(centralAccess, ".ignoreIfAccessedFrom")).toEqual([
      "archives",
    ]);
    expect(descriptorValue(centralAccess, ".revealIfAccessedFrom")).toEqual([
      "rd",
    ]);
    expect(descriptorValue(centralAccess, ".visibility")).toBe(
      "hidden_info_barrier",
    );
    const originalIds = capabilities(virus, "accessEffects")
      .map((entry) => entry.identity)
      .filter((identity) => identity.kind === "keyed")
      .map((identity) => identity.canonicalCapabilityId)
      .sort();
    const reorderedVirus = JSON.parse(JSON.stringify(virus)) as CardSpec;
    reorderedVirus.engine.accessEffects = [
      ...reorderedVirus.engine.accessEffects!,
    ].reverse();
    expect(
      capabilities(reorderedVirus, "accessEffects")
        .map((entry) => entry.identity)
        .filter((identity) => identity.kind === "keyed")
        .map((identity) => identity.canonicalCapabilityId)
        .sort(),
    ).toEqual(originalIds);

    const reclamation = spec(
      "stress_data_fort_reclamation",
      "Data Fort Reclamation",
      "corp",
    );
    reclamation.identity.cardType = "agenda";
    reclamation.engine.characteristics.numeric = {
      installCost: null,
      memoryCost: null,
      rezCost: null,
      trashCost: null,
      advancementRequirement: 4,
      agendaPoints: 2,
    };
    reclamation.engine.scoredAgenda = {
      ...keyed("score_install_sequence"),
      kind: "score_install_hq_cards_into_new_remote_then_rez",
      sourceZone: "hq",
      targetServer: "new_remote",
      allowedCards: "corp_installable",
      maxCards: 4,
      temporaryCredits: {
        amount: 10,
        usableFor: "install_and_rez_cards_from_sequence",
        returnUnused: true,
      },
      optionalRez: true,
      visibility: "hidden_info_barrier",
    };
    const score = byKey(reclamation, "score_install_sequence");
    expect(score.transition.kind).toBe("score");
    expect(score.uncertaintyClass).toBe("requires_engine_quote");
    expect(descriptorValue(score, ".maxCards")).toBe(4);
    expect(descriptorValue(score, ".temporaryCredits")).toEqual({
      amount: 10,
      returnUnused: true,
      usableFor: "install_and_rez_cards_from_sequence",
    });
    expect(score.liabilities).toEqual([
      expect.objectContaining({ phase: "end_of_turn_cleanup" }),
    ]);
    expect(canonicalSerialize(score)).not.toMatch(/serverInstance|hqCardId/);

    const roving = spec("stress_roving_submarine", "Roving Submarine", "corp");
    roving.engine.installCapabilities = [
      {
        kind: "install_only_inside_subsidiary_data_fort",
        visibility: "public",
      },
    ];
    roving.engine.regionBaseline = {
      kind: "region_baseline",
      rezOnInstall: true,
      installOnlyIfRezAffordable: true,
      oneRegionPerFort: true,
      trashOlderRegions: true,
    };
    roving.engine.fortRunWindows = [
      {
        ...keyed("run_start_gate"),
        kind: "server_run_start_restriction",
        timing: "run_start_legal",
        target: "source_fort",
        condition:
          "corp_installed_or_advanced_on_target_server_during_latest_corp_turn",
        visibility: "public",
      },
    ];
    expect(
      capabilities(roving, "installCapabilities")[0]?.uncertaintyClass,
    ).toBe("statically_compilable");
    expect(byKey(roving, "run_start_gate").uncertaintyClass).toBe(
      "requires_engine_quote",
    );
    expect(
      descriptorValue(capabilities(roving, "installCapabilities")[0]!, ".kind"),
    ).toBe("install_only_inside_subsidiary_data_fort");
    expect(descriptorValue(byKey(roving, "run_start_gate"), ".condition")).toBe(
      "corp_installed_or_advanced_on_target_server_during_latest_corp_turn",
    );
    expect(PROSPECTIVE_CLASS_BY_FAMILY.regionBaseline).toBe("unknown");
    expect(capabilities(roving, "regionBaseline")[0]).toMatchObject({
      uncertaintyClass: "unknown",
      uncertaintyReason: "unowned_family_requires_engine_owner_or_removal",
    });
    expect(capabilities(roving, "regionBaseline")[0]?.descriptors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "engine.regionBaseline.rezOnInstall",
          value: true,
        }),
        expect.objectContaining({
          path: "engine.regionBaseline.installOnlyIfRezAffordable",
          value: true,
        }),
        expect.objectContaining({
          path: "engine.regionBaseline.oneRegionPerFort",
          value: true,
        }),
        expect.objectContaining({
          path: "engine.regionBaseline.trashOlderRegions",
          value: true,
        }),
      ]),
    );
  });

  it("is deterministic, JSON roundtrippable, deeply frozen, cache-stable, and side-independent", () => {
    const first = spec("stress_determinism", "Determinism");
    first.engine.modifiers = [
      {
        kind: "ice_strength",
        operation: "increase",
        amount: 2,
        activeWhile: "installed",
        sourceZone: "runner_installed",
        visibility: "public",
        appliesTo: { side: "corp", cardType: "ice" },
      },
    ];
    const clone = JSON.parse(JSON.stringify(first)) as CardSpec;
    clone.identity.side = "corp";
    const firstView = compileProspectiveCapabilities(first);
    const sameView = compileProspectiveCapabilities(
      JSON.parse(JSON.stringify(first)) as CardSpec,
    );
    expect(sameView).toBe(firstView);
    expect(JSON.parse(JSON.stringify(firstView))).toEqual(firstView);
    expect(canonicalSerialize(firstView)).toBe(canonicalSerialize(sameView));
    expect(isDeepFrozen(firstView)).toBe(true);
    expect(() => {
      (firstView.capabilities as ProspectiveCapability[]).push(
        firstView.capabilities[0] as ProspectiveCapability,
      );
    }).toThrow();

    const otherSideView = compileProspectiveCapabilities(clone);
    expect(otherSideView.capabilities.map(withoutTransition)).toEqual(
      firstView.capabilities.map(withoutTransition),
    );
    expect(canonicalSerialize(firstView)).not.toMatch(
      /gameState|playerView|legalActions|actionId|stateVersion|sourceCardInstanceId/,
    );

    first.text.rulesText = "Changed display text only";
    first.publication = {
      schemaVersion: "card-publication-v1",
      status: "disabled",
      blockReason: "editor only",
    };
    expect(compileProspectiveCapabilities(first)).toBe(firstView);
  });

  it("derives changed mechanics and keys instead of using card-specific tables", () => {
    const first = spec("stress_generic_first", "Generic A");
    first.engine.modifiers = [
      {
        kind: "ice_strength",
        operation: "increase",
        amount: 1,
        activeWhile: "installed",
        sourceZone: "runner_installed",
        visibility: "public",
        appliesTo: { side: "corp", cardType: "ice" },
      },
    ];
    const second = spec("stress_generic_second", "Generic B");
    second.engine.modifiers = [
      {
        kind: "ice_strength",
        operation: "increase",
        amount: 4,
        activeWhile: "installed",
        sourceZone: "runner_installed",
        visibility: "public",
        appliesTo: { side: "corp", cardType: "ice" },
      },
    ];
    expect(
      descriptorValue(capabilities(first, "modifiers")[0]!, ".amount"),
    ).toBe(1);
    expect(
      descriptorValue(capabilities(second, "modifiers")[0]!, ".amount"),
    ).toBe(4);
    expect(canonicalSerialize(compileProspectiveCapabilities(first))).not.toBe(
      canonicalSerialize(compileProspectiveCapabilities(second)),
    );
  });

  it("keeps dynamic transition effects conservative and compiles exact cleanup obligations", () => {
    const dynamic = spec("stress_dynamic_install", "Dynamic Install");
    dynamic.engine.lifecycle = {
      on_install: [
        {
          kind: "trace",
          traceLimit: 1,
          onSuccess: [],
          visibility: "public",
        },
      ],
    };
    const transition = capabilities(dynamic, "lifecycle")[0]!;
    expect(transition.directOutcomes).toEqual([
      expect.objectContaining({ resolution: "requires_engine_quote" }),
    ]);

    const cleanup = spec("stress_cleanup", "Cleanup", "corp");
    cleanup.engine.leavePlayCleanup = [
      {
        kind: "trash_agenda_or_node_if_fort_over_capacity",
        target: "agenda_or_node_inside_same_fort",
        selection: "deterministic_lowest_instance_id",
        visibility: "public",
      },
    ];
    expect(capabilities(cleanup, "leavePlayCleanup")[0]?.liabilities).toEqual([
      expect.objectContaining({
        phase: "on_leave_play",
        resolution: "declared_effect",
      }),
    ]);

    const rezOnInstall = spec(
      "stress_rez_on_install",
      "Rez on install",
      "corp",
    );
    rezOnInstall.engine.installCapabilities = [
      {
        kind: "rez_on_install",
        installOnlyIfRezAffordable: true,
        visibility: "public",
      },
    ];
    expect(
      capabilities(rezOnInstall, "installCapabilities")[0]?.directOutcomes,
    ).toEqual([
      expect.objectContaining({
        phase: "transition",
        resolution: "declared_transition_effect",
      }),
    ]);
  });

  it("clones planning annotations and invalidates only relevant cache fingerprints", () => {
    const annotated = spec("stress_annotations", "Annotations");
    annotated.engine.abilities = [
      {
        ...keyed("gain"),
        kind: "activated",
        timing: "runner_main",
        costs: [],
        effects: [],
      },
    ];
    annotated.text.capabilityText = [
      {
        capabilityKey: capabilityKey("gain"),
        actionLabel: "Gain",
      },
    ];
    annotated.planningAnnotations = {
      schemaVersion: "card-planning-annotations-v1",
      card: [{ kind: "strategy_anchor", strategyKey: "economy" }],
      capabilities: [
        {
          capabilityKey: capabilityKey("gain"),
          annotations: [
            { kind: "line_support", lineKey: "setup", support: "supports" },
          ],
        },
      ],
    };
    const first = compileProspectiveCapabilities(annotated);
    expect(Object.isFrozen(annotated)).toBe(false);
    expect(Object.isFrozen(annotated.planningAnnotations)).toBe(false);
    expect(first.cardPlanningAnnotations).not.toBe(
      annotated.planningAnnotations.card,
    );
    expect(byKey(annotated, "gain").planningAnnotations).not.toBe(
      annotated.planningAnnotations.capabilities?.[0]?.annotations,
    );

    const annotationChanged = JSON.parse(JSON.stringify(annotated)) as CardSpec;
    annotationChanged.planningAnnotations = {
      ...annotationChanged.planningAnnotations!,
      card: [{ kind: "strategy_anchor", strategyKey: "tempo" }],
    };
    expect(compileProspectiveCapabilities(annotationChanged)).not.toBe(first);

    const mechanicChanged = JSON.parse(JSON.stringify(annotated)) as CardSpec;
    mechanicChanged.engine.characteristics.numeric.installCost = 1;
    expect(compileProspectiveCapabilities(mechanicChanged)).not.toBe(first);

    const editorialChanged = JSON.parse(JSON.stringify(annotated)) as CardSpec;
    editorialChanged.text.rulesText = "Editor change";
    editorialChanged.printings = [
      { ...editorialChanged.printings[0]!, variant: "alternate" },
    ];
    editorialChanged.publication = {
      schemaVersion: "card-publication-v1",
      status: "disabled",
      blockReason: "editor only",
    };
    expect(compileProspectiveCapabilities(editorialChanged)).toBe(first);

    const paths = first.capabilities.map((entry) => entry.sourcePath);
    expect(new Set(paths).size).toBe(paths.length);
    const referencedPaths = first.capabilities.flatMap((entry) => [
      ...entry.descriptors.map((descriptor) => descriptor.path),
      ...entry.directOutcomes.flatMap((outcome) => outcome.descriptorPaths),
      ...entry.liabilities.flatMap((liability) => liability.descriptorPaths),
    ]);
    expect(referencedPaths.every((path) => typeof path === "string")).toBe(
      true,
    );
  });

  it("fails before derivation for unknown runtime engine fields", () => {
    const malformed = spec("stress_malformed", "Malformed");
    (malformed.engine as unknown as Record<string, unknown>).unknownMechanic = {
      amount: 1,
    };
    expect(() => compileProspectiveCapabilities(malformed)).toThrowError(
      /unknown_contract_field/,
    );
  });
});

function withoutTransition(entry: ProspectiveCapability) {
  const { transition: _transition, ...rest } = entry;
  return rest;
}

function isDeepFrozen(value: unknown, seen = new Set<object>()): boolean {
  if (value === null || typeof value !== "object" || seen.has(value))
    return true;
  seen.add(value);
  if (!Object.isFrozen(value)) return false;
  return Reflect.ownKeys(value).every((key) =>
    isDeepFrozen((value as Record<PropertyKey, unknown>)[key], seen),
  );
}

function expectUnique(values: readonly string[]): void {
  expect(new Set(values).size).toBe(values.length);
}
