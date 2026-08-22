import { describe, expect, it } from "vitest";
import { CARD_DEFINITIONS_BY_ID } from "../card-definitions";
import { cardImplementationCoverageForDefinitionId } from "./coverage";
import {
  CARD_IMPLEMENTATIONS,
  cardImplementationForDefinitionId,
} from "./registry";

describe("CardImplementation definition descriptors", () => {
  it("describes passive Corp rez-cost modifiers through card implementations", () => {
    expect(
      cardImplementationForDefinitionId("onr_v1_317_data-masons")?.modifiers,
    ).toContainEqual(
      expect.objectContaining({
        kind: "rez_cost",
        operation: "reduce",
        amount: 2,
        activeWhile: "rezzed",
        sourceZone: "corp_root",
        visibility: "public",
        appliesTo: { cardType: "ice", subtype: "wall" },
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_317_data-masons")?.modifiers,
    ).toContainEqual(
      expect.objectContaining({
        kind: "ice_strength",
        operation: "increase",
        amount: 1,
        appliesTo: { side: "corp", cardType: "ice", subtype: "wall" },
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_320_encoder-inc")?.modifiers,
    ).toContainEqual(
      expect.objectContaining({
        kind: "rez_cost",
        operation: "reduce",
        amount: 1,
        appliesTo: { cardType: "ice", subtype: "code_gate" },
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_320_encoder-inc")?.modifiers,
    ).toContainEqual(
      expect.objectContaining({
        kind: "additional_subroutine",
        append: "after_existing",
        appliesTo: { side: "corp", cardType: "ice", subtype: "code_gate" },
        subroutine: {
          kind: "end_the_run",
          visibility: "public",
        },
      }),
    );
    expect(
      cardImplementationForDefinitionId(
        "onr_v1_341_skalderviken-sa-beta-test-site",
      )?.modifiers,
    ).toContainEqual(
      expect.objectContaining({
        kind: "rez_cost",
        operation: "reduce",
        amount: 2,
        appliesTo: { cardType: "ice", subtype: "black_ice" },
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_324_fortress-architects")
        ?.modifiers,
    ).toContainEqual(
      expect.objectContaining({
        kind: "install_cost",
        operation: "reduce",
        amount: 1,
        appliesTo: { side: "corp", cardType: "ice" },
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_360_jerusalem-city-grid")
        ?.modifiers,
    ).toContainEqual(
      expect.objectContaining({
        kind: "rez_cost",
        operation: "reduce",
        amount: 2,
        appliesTo: {
          cardType: "ice",
          subtype: "wall",
          sameServerAsSource: true,
        },
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_360_jerusalem-city-grid")
        ?.modifiers,
    ).toContainEqual(
      expect.objectContaining({
        kind: "ice_strength",
        operation: "increase",
        amount: 1,
        appliesTo: {
          side: "corp",
          cardType: "ice",
          subtype: "wall",
          sameServerAsSource: true,
        },
      }),
    );
    expect(
      cardImplementationCoverageForDefinitionId("onr_v1_317_data-masons")
        ?.status,
    ).toBe("implemented");
    expect(
      cardImplementationCoverageForDefinitionId("onr_v1_320_encoder-inc")
        ?.status,
    ).toBe("implemented");
    expect(
      cardImplementationCoverageForDefinitionId(
        "onr_v1_341_skalderviken-sa-beta-test-site",
      )?.status,
    ).toBe("implemented");
    expect(
      cardImplementationCoverageForDefinitionId(
        "onr_v1_324_fortress-architects",
      )?.status,
    ).toBe("implemented");
    expect(
      cardImplementationCoverageForDefinitionId(
        "onr_v1_360_jerusalem-city-grid",
      )?.status,
    ).toBe("implemented");
  });

  it("describes simple credit cards through typed on-play effects", () => {
    expect(
      cardImplementationForDefinitionId("onr_v1_281_accounts-receivable")
        ?.abilities,
    ).toContainEqual(
      expect.objectContaining({
        kind: "on_play",
        costs: "printed",
        effects: [
          expect.objectContaining({
            kind: "gain_credits",
            recipient: "controller",
            amount: 9,
            visibility: "public",
          }),
        ],
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_290_efficiency-experts")
        ?.abilities,
    ).toContainEqual(
      expect.objectContaining({
        kind: "on_play",
        costs: "printed",
        effects: [
          expect.objectContaining({
            kind: "gain_credits",
            recipient: "controller",
            amount: 3,
            visibility: "public",
          }),
        ],
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_097_livewires-contacts")
        ?.abilities,
    ).toContainEqual(
      expect.objectContaining({
        kind: "on_play",
        costs: "printed",
        effects: [
          expect.objectContaining({
            kind: "gain_credits",
            recipient: "controller",
            amount: 3,
            visibility: "public",
          }),
        ],
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_108_score")?.abilities,
    ).toContainEqual(
      expect.objectContaining({
        kind: "on_play",
        costs: "printed",
        effects: [
          expect.objectContaining({
            kind: "gain_credits",
            recipient: "controller",
            amount: 9,
            visibility: "public",
          }),
        ],
      }),
    );
  });

  it("describes simple draw and ordered mixed cards through typed on-play effects", () => {
    expect(
      cardImplementationForDefinitionId("onr_v1_282_annual-reviews")?.abilities,
    ).toContainEqual(
      expect.objectContaining({
        kind: "on_play",
        costs: "printed",
        effects: [
          expect.objectContaining({
            kind: "draw_cards",
            recipient: "controller",
            amount: 3,
            visibility: "public",
          }),
        ],
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_288_day-shift")?.abilities,
    ).toContainEqual(
      expect.objectContaining({
        kind: "on_play",
        costs: "printed",
        effects: [
          expect.objectContaining({
            kind: "draw_cards",
            recipient: "controller",
            amount: 2,
            visibility: "public",
          }),
          expect.objectContaining({
            kind: "gain_credits",
            recipient: "controller",
            amount: 1,
            visibility: "public",
          }),
        ],
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_295_night-shift")?.abilities,
    ).toContainEqual(
      expect.objectContaining({
        kind: "on_play",
        costs: "printed",
        effects: [
          expect.objectContaining({
            kind: "gain_credits",
            recipient: "controller",
            amount: 2,
            visibility: "public",
          }),
          expect.objectContaining({
            kind: "draw_cards",
            recipient: "controller",
            amount: 1,
            visibility: "public",
          }),
        ],
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_079_bodyweight-synthetic-blood")
        ?.abilities,
    ).toContainEqual(
      expect.objectContaining({
        kind: "on_play",
        costs: "printed",
        effects: [
          expect.objectContaining({
            kind: "draw_cards",
            recipient: "controller",
            amount: 5,
            visibility: "public",
          }),
        ],
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_095_jack-n-joe")?.abilities,
    ).toContainEqual(
      expect.objectContaining({
        kind: "on_play",
        costs: "printed",
        effects: [
          expect.objectContaining({
            kind: "draw_cards",
            recipient: "controller",
            amount: 3,
            visibility: "public",
          }),
        ],
      }),
    );
  });

  it("describes Closed Accounts through a tagged on-play lose_credits effect", () => {
    expect(
      cardImplementationForDefinitionId("onr_v1_285_closed-accounts")
        ?.abilities,
    ).toContainEqual(
      expect.objectContaining({
        kind: "on_play",
        costs: "printed",
        condition: { kind: "runner_is_tagged" },
        effects: [
          expect.objectContaining({
            kind: "lose_credits",
            recipient: "runner",
            mode: "all",
            visibility: "public",
          }),
        ],
      }),
    );
    expect(
      cardImplementationCoverageForDefinitionId("onr_v1_285_closed-accounts")
        ?.status,
    ).toBe("implemented");
  });

  it("describes Datapool® by Zetatech through a tagged on-play add_tags effect", () => {
    expect(
      cardImplementationForDefinitionId("onr_v1_287_datapool-by-zetatech")
        ?.abilities,
    ).toContainEqual(
      expect.objectContaining({
        kind: "on_play",
        costs: "printed",
        condition: { kind: "runner_is_tagged" },
        effects: [
          expect.objectContaining({
            kind: "add_tags",
            recipient: "runner",
            amount: 2,
            visibility: "public",
          }),
        ],
      }),
    );
    expect(
      cardImplementationCoverageForDefinitionId(
        "onr_v1_287_datapool-by-zetatech",
      )?.status,
    ).toBe("implemented");
  });

  it("describes P3.2 tagged Corp Operations through on-play card effects", () => {
    expect(
      cardImplementationForDefinitionId("onr_v1_293_netwatch-credit-voucher")
        ?.abilities,
    ).toContainEqual(
      expect.objectContaining({
        kind: "on_play",
        costs: "printed",
        condition: { kind: "runner_is_tagged" },
        effects: [
          expect.objectContaining({
            kind: "add_tags",
            recipient: "runner",
            amount: 1,
            visibility: "public",
          }),
          expect.objectContaining({
            kind: "gain_credits",
            recipient: "controller",
            amount: 1,
            visibility: "public",
          }),
        ],
      }),
    );

    for (const [definitionId, amount] of [
      ["onr_v1_301_punitive-counterstrike", 2],
      ["onr_v1_302_scorched-earth", 4],
      ["onr_v1_307_urban-renewal", 5],
    ] as const) {
      expect(
        cardImplementationForDefinitionId(definitionId)?.abilities,
      ).toContainEqual(
        expect.objectContaining({
          kind: "on_play",
          costs: "printed",
          condition: { kind: "runner_is_tagged" },
          effects: [
            expect.objectContaining({
              kind: "damage",
              recipient: "runner",
              damageType: "meat",
              amount,
              preventable: true,
              visibility: "public",
            }),
          ],
        }),
      );
    }

    for (const definitionId of [
      "onr_v1_293_netwatch-credit-voucher",
      "onr_v1_301_punitive-counterstrike",
      "onr_v1_302_scorched-earth",
      "onr_v1_307_urban-renewal",
    ] as const) {
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
      ).toBe("implemented");
    }
  });

  it("describes P3.3 tagged activated meat-damage abilities", () => {
    for (const [definitionId, amount] of [
      ["onr_v1_342_solo-squad", 1],
      ["onr_v1_208_on-call-solo-team", 1],
      ["onr_v1_217_strike-force-kali", 2],
    ] as const) {
      expect(
        cardImplementationForDefinitionId(definitionId)?.abilities,
      ).toContainEqual(
        expect.objectContaining({
          kind: "activated",
          timing: "corp_main",
          costs: [{ kind: "action", amount: 1 }],
          condition: { kind: "runner_is_tagged" },
          effects: [
            expect.objectContaining({
              kind: "damage",
              recipient: "runner",
              damageType: "meat",
              amount,
              preventable: true,
              visibility: "public",
            }),
          ],
        }),
      );
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
      ).toBe("implemented");
    }
  });

  it("describes P3.4 activated economy and draw abilities", () => {
    for (const [definitionId, actionCost, amount] of [
      ["onr_v1_206_marine-arcology", 2, 3],
      ["onr_v1_210_political-overthrow", 1, 3],
      ["onr_v1_343_south-african-mining-corp", 3, 6],
    ] as const) {
      expect(
        cardImplementationForDefinitionId(definitionId)?.abilities,
      ).toContainEqual(
        expect.objectContaining({
          kind: "activated",
          timing: "corp_main",
          costs: [{ kind: "action", amount: actionCost }],
          effects: [
            expect.objectContaining({
              kind: "gain_credits",
              recipient: "controller",
              amount,
              visibility: "public",
            }),
          ],
        }),
      );
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
      ).toBe("implemented");
    }

    expect(
      cardImplementationForDefinitionId("onr_v1_179_silicon-saloon-franchise")
        ?.abilities,
    ).toContainEqual(
      expect.objectContaining({
        kind: "activated",
        timing: "runner_main",
        costs: [{ kind: "action", amount: 1 }],
        effects: [
          expect.objectContaining({
            kind: "gain_credits",
            recipient: "controller",
            amount: 1,
            visibility: "public",
          }),
          expect.objectContaining({
            kind: "draw_cards",
            recipient: "controller",
            amount: 1,
            visibility: "public",
          }),
        ],
      }),
    );
    expect(
      cardImplementationCoverageForDefinitionId(
        "onr_v1_179_silicon-saloon-franchise",
      )?.status,
    ).toBe("implemented");
  });

  it("describes P3.5 hosted-credit economy abilities", () => {
    for (const [
      definitionId,
      lifecycle,
      startingCredits,
      takeAmount,
      timing,
    ] of [
      ["onr_v1_309_bbs-whispering-campaign", "on_rez", 16, 2, "corp_main"],
      ["onr_v1_337_rockerboy-promotion", "on_rez", 15, 3, "corp_main"],
      ["onr_v1_178_short-term-contract", "on_install", 12, 2, "runner_main"],
      ["onr_v1_193_corporate-coup", "on_score", 15, 3, "corp_main"],
      ["onr_v1_209_political-coup", "on_score", 12, 3, "corp_main"],
    ] as const) {
      expect(
        cardImplementationForDefinitionId(definitionId)?.lifecycle?.[lifecycle],
      ).toEqual([
        expect.objectContaining({
          kind: "add_hosted_credits",
          target: "source",
          amount: startingCredits,
          visibility: "public",
        }),
      ]);
      expect(
        cardImplementationForDefinitionId(definitionId)?.abilities,
      ).toContainEqual(
        expect.objectContaining({
          kind: "activated",
          timing,
          costs: [{ kind: "action", amount: 1 }],
          condition: { kind: "source_has_hosted_credits" },
          effects: expect.arrayContaining([
            expect.objectContaining({
              kind: "take_hosted_credits",
              source: "source",
              recipient: "controller",
              amount: takeAmount,
              mode: "up_to_amount_if_available",
              visibility: "public",
            }),
          ]),
        }),
      );
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
      ).toBe("implemented");
    }

    for (const definitionId of [
      "onr_v1_309_bbs-whispering-campaign",
      "onr_v1_337_rockerboy-promotion",
      "onr_v1_178_short-term-contract",
    ] as const) {
      expect(
        cardImplementationForDefinitionId(definitionId)?.abilities?.at(0)
          ?.effects,
      ).toContainEqual(
        expect.objectContaining({
          kind: "trash_source_when_empty",
          source: "source",
          visibility: "public",
        }),
      );
    }
  });

  it("describes P3.17 manual hosted-credit abilities", () => {
    expect(
      cardImplementationForDefinitionId("onr_v1_154_broker")?.abilities,
    ).toEqual([
      expect.objectContaining({
        kind: "activated",
        timing: "runner_main",
        costs: [{ kind: "action", amount: 1 }],
        limit: {
          kind: "once_per_turn_per_source",
          scope: "any_ability_on_source",
        },
        effects: [
          expect.objectContaining({
            kind: "add_hosted_credits",
            target: "source",
            amount: 3,
            visibility: "public",
          }),
        ],
      }),
      expect.objectContaining({
        kind: "activated",
        timing: "runner_main",
        costs: [{ kind: "action", amount: 1 }],
        condition: { kind: "source_has_hosted_credits" },
        limit: {
          kind: "once_per_turn_per_source",
          scope: "any_ability_on_source",
        },
        effects: [
          expect.objectContaining({
            kind: "take_hosted_credits",
            source: "source",
            recipient: "controller",
            mode: "all",
            visibility: "public",
          }),
        ],
      }),
    ]);
    expect(
      cardImplementationForDefinitionId(
        "onr_v1_318_department-of-truth-enhancement",
      )?.abilities,
    ).toEqual([
      expect.objectContaining({
        kind: "activated",
        timing: "corp_main",
        costs: [{ kind: "action", amount: 1 }],
        effects: [
          expect.objectContaining({
            kind: "add_hosted_credits",
            target: "source",
            amount: 3,
            visibility: "public",
          }),
        ],
      }),
      expect.objectContaining({
        kind: "activated",
        timing: "corp_main",
        costs: [{ kind: "action", amount: 1 }],
        condition: { kind: "source_has_hosted_credits" },
        effects: [
          expect.objectContaining({
            kind: "take_hosted_credits",
            source: "source",
            recipient: "controller",
            mode: "all",
            visibility: "public",
          }),
        ],
      }),
    ]);
    expect(
      cardImplementationCoverageForDefinitionId("onr_v1_154_broker")?.status,
    ).toBe("implemented");
    expect(
      cardImplementationCoverageForDefinitionId(
        "onr_v1_318_department-of-truth-enhancement",
      )?.status,
    ).toBe("implemented");
  });

  it("describes P3.6 start-of-Corp-turn hosted-credit economy cards", () => {
    for (const [
      definitionId,
      startingCredits,
      takeAmount,
      trashesWhenEmpty,
    ] of [
      ["onr_v1_311_braindance-campaign", 12, 2, true],
      ["onr_v1_326_holovid-campaign", 12, 1, true],
    ] as const) {
      expect(
        cardImplementationForDefinitionId(definitionId)?.lifecycle?.on_rez,
      ).toEqual([
        expect.objectContaining({
          kind: "add_hosted_credits",
          target: "source",
          amount: startingCredits,
          visibility: "public",
        }),
      ]);
      expect(
        cardImplementationForDefinitionId(definitionId)?.lifecycle
          ?.start_of_corp_turn,
      ).toContainEqual(
        expect.objectContaining({
          condition: { kind: "source_has_hosted_credits" },
          effects: [
            expect.objectContaining({
              kind: "take_hosted_credits",
              source: "source",
              recipient: "controller",
              amount: takeAmount,
              mode: "up_to_amount_if_available",
              visibility: "public",
            }),
            ...(trashesWhenEmpty
              ? [
                  expect.objectContaining({
                    kind: "trash_source_when_empty",
                    source: "source",
                    visibility: "public",
                  }),
                ]
              : []),
          ],
        }),
      );
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
      ).toBe("implemented");
    }

    expect(
      cardImplementationForDefinitionId("onr_v1_198_detroit-police-contract")
        ?.lifecycle?.on_score,
    ).toEqual([
      expect.objectContaining({
        kind: "add_hosted_credits",
        target: "source",
        amount: 12,
        visibility: "public",
      }),
    ]);
    expect(
      cardImplementationForDefinitionId("onr_v1_198_detroit-police-contract")
        ?.lifecycle?.start_of_corp_turn,
    ).toContainEqual(
      expect.objectContaining({
        condition: { kind: "source_has_hosted_credits" },
        effects: [
          expect.objectContaining({
            kind: "take_hosted_credits",
            source: "source",
            recipient: "controller",
            amount: 2,
            mode: "up_to_amount_if_available",
            visibility: "public",
          }),
        ],
      }),
    );

    expect(
      cardImplementationForDefinitionId("onr_v1_344_spinn-public-relations")
        ?.lifecycle?.start_of_corp_turn,
    ).toContainEqual(
      expect.objectContaining({
        condition: { kind: "source_has_hosted_credits" },
        effects: [
          expect.objectContaining({
            kind: "take_hosted_credits",
            source: "source",
            recipient: "controller",
            amount: 1,
            mode: "up_to_amount_if_available",
            visibility: "public",
          }),
        ],
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_344_spinn-public-relations")
        ?.abilities,
    ).toContainEqual(
      expect.objectContaining({
        kind: "activated",
        timing: "corp_main",
        costs: [{ kind: "action", amount: 1 }],
        effects: [
          expect.objectContaining({
            kind: "add_hosted_credits",
            target: "source",
            amount: 3,
            visibility: "public",
          }),
        ],
      }),
    );

    for (const definitionId of [
      "onr_v1_198_detroit-police-contract",
      "onr_v1_344_spinn-public-relations",
    ] as const) {
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
      ).toBe("implemented");
    }
  });

  it("describes P3.7 turn-start economy and run-start cleanup cards", () => {
    expect(
      cardImplementationForDefinitionId("onr_v1_211_polymer-breakthrough")
        ?.lifecycle?.start_of_corp_turn,
    ).toContainEqual(
      expect.objectContaining({
        effects: [
          expect.objectContaining({
            kind: "gain_credits",
            recipient: "controller",
            amount: 1,
            visibility: "public",
          }),
        ],
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_163_floating-runner-bbs")
        ?.lifecycle?.start_of_runner_turn,
    ).toContainEqual(
      expect.objectContaining({
        effects: [
          expect.objectContaining({
            kind: "gain_credits",
            recipient: "controller",
            amount: 1,
            visibility: "public",
          }),
        ],
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_174_rigged-investments")
        ?.lifecycle?.on_install,
    ).toEqual([
      expect.objectContaining({
        kind: "add_hosted_credits",
        target: "source",
        amount: 12,
        visibility: "public",
      }),
    ]);
    expect(
      cardImplementationForDefinitionId("onr_v1_174_rigged-investments")
        ?.lifecycle?.start_of_runner_turn,
    ).toContainEqual(
      expect.objectContaining({
        condition: { kind: "source_has_hosted_credits" },
        effects: [
          expect.objectContaining({
            kind: "take_hosted_credits",
            source: "source",
            recipient: "controller",
            amount: 1,
            mode: "up_to_amount_if_available",
            visibility: "public",
          }),
          expect.objectContaining({
            kind: "trash_source_when_empty",
            source: "source",
            visibility: "public",
          }),
        ],
      }),
    );

    for (const definitionId of [
      "onr_v1_335_remote-facility",
      "onr_v1_218_subsidiary-branch",
    ] as const) {
      expect(
        cardImplementationForDefinitionId(definitionId)?.lifecycle
          ?.start_of_corp_turn,
      ).toContainEqual(
        expect.objectContaining({
          effects: [
            expect.objectContaining({
              kind: "gain_actions",
              recipient: "controller",
              amount: 1,
              visibility: "public",
            }),
          ],
        }),
      );
    }

    expect(
      cardImplementationForDefinitionId("onr_v1_184_top-runners-conference")
        ?.lifecycle?.start_of_runner_turn,
    ).toContainEqual(
      expect.objectContaining({
        effects: [
          expect.objectContaining({
            kind: "gain_credits",
            recipient: "controller",
            amount: 2,
            visibility: "public",
          }),
        ],
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_184_top-runners-conference")
        ?.lifecycle?.on_runner_run_start,
    ).toContainEqual(
      expect.objectContaining({
        effects: [
          expect.objectContaining({
            kind: "trash_source",
            visibility: "public",
          }),
        ],
      }),
    );

    for (const definitionId of [
      "onr_v1_163_floating-runner-bbs",
      "onr_v1_174_rigged-investments",
      "onr_v1_184_top-runners-conference",
      "onr_v1_211_polymer-breakthrough",
      "onr_v1_218_subsidiary-branch",
      "onr_v1_335_remote-facility",
    ] as const) {
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
      ).toBe("implemented");
    }
  });

  it("describes P3.8 passive hand-size and memory-unit modifiers", () => {
    for (const [definitionId, amount] of [
      ["onr_v1_134_mram-chip", 2],
      ["onr_v1_133_militech-mram-chip", 3],
    ] as const) {
      expect(
        cardImplementationForDefinitionId(definitionId)?.modifiers,
      ).toContainEqual(
        expect.objectContaining({
          kind: "hand_size",
          operation: "increase",
          amount,
          activeWhile: "installed",
          sourceZone: "runner_installed",
          side: "runner",
          visibility: "public",
        }),
      );
    }
    expect(
      cardImplementationForDefinitionId("onr_v1_205_main-office-relocation")
        ?.modifiers,
    ).toContainEqual(
      expect.objectContaining({
        kind: "hand_size",
        operation: "increase",
        amount: 2,
        activeWhile: "scored",
        sourceZone: "corp_scored_agenda",
        side: "corp",
        visibility: "public",
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_338_rustbelt-hq-branch")
        ?.modifiers,
    ).toContainEqual(
      expect.objectContaining({
        kind: "hand_size",
        operation: "increase",
        amount: 2,
        activeWhile: "rezzed",
        sourceZone: "corp_root",
        side: "corp",
        visibility: "public",
      }),
    );

    for (const [definitionId, amount] of [
      ["onr_v1_145_wutech-mem-chip", 1],
      ["onr_v1_146_zetatech-mem-chip", 2],
      ["onr_v1_144_tycho-mem-chip", 3],
    ] as const) {
      expect(
        cardImplementationForDefinitionId(definitionId)?.modifiers,
      ).toContainEqual(
        expect.objectContaining({
          kind: "memory_units",
          operation: "increase",
          amount,
          activeWhile: "installed",
          sourceZone: "runner_installed",
          side: "runner",
          visibility: "public",
        }),
      );
    }

    for (const definitionId of [
      "onr_v1_134_mram-chip",
      "onr_v1_133_militech-mram-chip",
      "onr_v1_205_main-office-relocation",
      "onr_v1_338_rustbelt-hq-branch",
      "onr_v1_145_wutech-mem-chip",
      "onr_v1_146_zetatech-mem-chip",
      "onr_v1_144_tycho-mem-chip",
    ] as const) {
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
      ).toBe("implemented");
    }
  });

  it("describes P3.9 scored agenda passive modifiers", () => {
    for (const [definitionId, subtype] of [
      ["onr_v1_189_artificial-security-directors", "black_ops"],
      ["onr_v1_201_executive-extraction", "gray_ops"],
      ["onr_v1_202_genetics-visionary-acquisition", "research"],
    ] as const) {
      expect(
        cardImplementationForDefinitionId(definitionId)?.modifiers,
      ).toContainEqual(
        expect.objectContaining({
          kind: "agenda_difficulty",
          operation: "reduce",
          amount: 1,
          activeWhile: "scored",
          sourceZone: "corp_scored_agenda",
          side: "corp",
          visibility: "public",
          appliesTo: { cardType: "agenda", subtype },
        }),
      );
    }
    expect(
      cardImplementationForDefinitionId(
        "onr_v1_191_black-ice-quality-assurance",
      )?.modifiers,
    ).toContainEqual(
      expect.objectContaining({
        kind: "ice_strength",
        operation: "increase",
        amount: 2,
        activeWhile: "scored",
        sourceZone: "corp_scored_agenda",
        visibility: "public",
        appliesTo: {
          side: "corp",
          cardType: "ice",
          subtype: "black_ice",
        },
      }),
    );

    for (const definitionId of [
      "onr_v1_189_artificial-security-directors",
      "onr_v1_191_black-ice-quality-assurance",
      "onr_v1_201_executive-extraction",
      "onr_v1_202_genetics-visionary-acquisition",
    ] as const) {
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
      ).toBe("implemented");
    }
  });

  it("describes P3.10 server-scoped ICE modifiers", () => {
    expect(
      cardImplementationForDefinitionId("onr_v1_352_chester-mix")?.modifiers,
    ).toContainEqual(
      expect.objectContaining({
        kind: "install_cost",
        operation: "reduce",
        amount: 2,
        activeWhile: "rezzed",
        sourceZone: "corp_root",
        visibility: "public",
        appliesTo: {
          side: "corp",
          cardType: "ice",
          sameServerAsSource: true,
        },
      }),
    );
    expect(
      cardImplementationForDefinitionId(
        "onr_v1_350_antiquated-interface-routines",
      )?.modifiers,
    ).toContainEqual(
      expect.objectContaining({
        kind: "ice_strength",
        operation: "increase",
        amount: 1,
        activeWhile: "rezzed",
        sourceZone: "corp_root",
        visibility: "public",
        appliesTo: {
          side: "corp",
          cardType: "ice",
          sameServerAsSource: true,
        },
      }),
    );
    expect(
      cardImplementationForDefinitionId(
        "onr_v1_370_tesseract-fort-construction",
      )?.modifiers,
    ).toContainEqual(
      expect.objectContaining({
        kind: "additional_subroutine",
        activeWhile: "rezzed",
        sourceZone: "corp_root",
        visibility: "public",
        appliesTo: {
          side: "corp",
          cardType: "ice",
          sameServerAsSource: true,
        },
        append: "after_existing",
        subroutine: {
          kind: "end_the_run_unless_runner_pays",
          amount: 1,
          visibility: "public",
        },
      }),
    );

    for (const definitionId of [
      "onr_v1_350_antiquated-interface-routines",
      "onr_v1_352_chester-mix",
      "onr_v1_370_tesseract-fort-construction",
    ] as const) {
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
      ).toBe("implemented");
    }
    expect(
      cardImplementationForDefinitionId("onr_v1_366_red-herrings"),
    ).toBeDefined();
  });

  it("describes P3.11 Red Herrings steal-cost modifier", () => {
    expect(
      cardImplementationForDefinitionId("onr_v1_366_red-herrings")?.modifiers,
    ).toContainEqual(
      expect.objectContaining({
        kind: "steal_cost",
        operation: "increase",
        amount: 5,
        activeWhile: "rezzed",
        sourceZone: "corp_root",
        side: "corp",
        visibility: "public",
        appliesTo: {
          cardType: "agenda",
        },
        sameServerAsSource: true,
        persistsForCurrentAccessIfSourceTrashed: true,
      }),
    );
    expect(
      cardImplementationCoverageForDefinitionId("onr_v1_366_red-herrings")
        ?.status,
    ).toBe("implemented");
  });

  it("describes P3.12 region city-grid modifiers", () => {
    expect(
      cardImplementationForDefinitionId("onr_v1_374_washington-d-c-city-grid")
        ?.modifiers,
    ).toContainEqual(
      expect.objectContaining({
        kind: "agenda_difficulty",
        operation: "reduce",
        amount: 1,
        activeWhile: "rezzed",
        sourceZone: "corp_root",
        side: "corp",
        visibility: "public",
        appliesTo: {
          cardType: "agenda",
          sameServerAsSource: true,
        },
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_362_new-galveston-city-grid")
        ?.modifiers,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "trash_cost",
          operation: "increase",
          amount: 2,
          activeWhile: "rezzed",
          sourceZone: "corp_root",
          side: "corp",
          visibility: "public",
          appliesTo: { cardType: "asset" },
          sameServerAsSource: true,
        }),
        expect.objectContaining({
          kind: "trash_cost",
          operation: "increase",
          amount: 2,
          activeWhile: "rezzed",
          sourceZone: "corp_root",
          side: "corp",
          visibility: "public",
          appliesTo: { cardType: "upgrade" },
          sameServerAsSource: true,
        }),
      ]),
    );
    for (const definitionId of [
      "onr_v1_360_jerusalem-city-grid",
      "onr_v1_362_new-galveston-city-grid",
      "onr_v1_374_washington-d-c-city-grid",
    ] as const) {
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
      ).toBe("implemented");
    }
  });

  it("describes Proteus Phase 1a reuse-only baseline implementations", () => {
    expect(
      CARD_DEFINITIONS_BY_ID["onr_proteus_041_toughoniumtm-wall"]?.subroutines,
    ).toEqual([
      expect.objectContaining({ type: "end_the_run" }),
      expect.objectContaining({ type: "end_the_run" }),
      expect.objectContaining({ type: "end_the_run" }),
      expect.objectContaining({ type: "end_the_run" }),
    ]);

    for (const [definitionId, subtype] of [
      ["onr_proteus_065_networked-center", "gray_ops"],
      ["onr_proteus_072_research-bunker", "research"],
      ["onr_proteus_077_weapons-depot", "black_ops"],
    ] as const) {
      expect(CARD_DEFINITIONS_BY_ID[definitionId]?.subtypes).toContain(
        "region",
      );
      expect(
        cardImplementationForDefinitionId(definitionId)?.modifiers,
      ).toContainEqual(
        expect.objectContaining({
          kind: "agenda_difficulty",
          operation: "reduce",
          amount: 1,
          activeWhile: "rezzed",
          sourceZone: "corp_root",
          side: "corp",
          visibility: "public",
          appliesTo: {
            cardType: "agenda",
            subtype,
            sameServerAsSource: true,
          },
        }),
      );
    }

    expect(
      cardImplementationForDefinitionId(
        "onr_proteus_150_streetware-distributor",
      )?.lifecycle?.start_of_runner_turn,
    ).toEqual([
      {
        condition: { kind: "source_has_hosted_credits" },
        simultaneousResolution: {
          kind: "order_independent_between_copies",
        },
        effects: [
          {
            kind: "take_hosted_credits",
            source: "source",
            recipient: "controller",
            amount: 1,
            mode: "up_to_amount_if_available",
            visibility: "public",
          },
        ],
      },
    ]);
    expect(
      cardImplementationForDefinitionId(
        "onr_proteus_150_streetware-distributor",
      )?.abilities?.[0],
    ).toMatchObject({
      kind: "activated",
      timing: "runner_main",
      costs: [{ kind: "action", amount: 1 }],
      effects: [
        {
          kind: "add_hosted_credits",
          target: "source",
          amount: 3,
          visibility: "public",
        },
      ],
    });
    expect(
      cardImplementationForDefinitionId("onr_proteus_146_precision-bribery")
        ?.modifiers?.[0],
    ).toMatchObject({
      kind: "new_data_fort_creation_lock",
      activeWhile: "installed",
      sourceZone: "runner_installed",
      side: "corp",
      visibility: "public",
      blocks: "corp_new_remote_installs",
      corpTrashSourceCost: {
        clicks: 1,
        credits: 4,
      },
    });
  });

  it("describes Proteus Phase 1b dynamic public ETR ICE implementations", () => {
    expect(
      cardImplementationForDefinitionId("onr_proteus_031_minotaur")?.modifiers,
    ).toContainEqual(
      expect.objectContaining({
        kind: "additional_subroutine",
        activeWhile: "rezzed",
        sourceZone: "corp_installed",
        visibility: "public",
        appliesTo: {
          side: "corp",
          cardType: "ice",
          sourceCardOnly: true,
        },
        append: "after_existing",
        repeat: {
          kind: "for_each_rezzed_installed_ice",
          subtypeAnyOf: ["code_gate", "wall"],
          excludeSource: true,
          scope: "outside_source_same_server",
          subtypeMatch: "effective_current_subtypes",
        },
        subroutine: {
          kind: "end_the_run",
          visibility: "public",
        },
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_proteus_034_riddler")
        ?.abilities?.[0],
    ).toMatchObject({
      kind: "activated",
      timing: "corp_encounter",
      costs: [{ kind: "credit", amount: 2 }],
      effects: [
        {
          kind: "add_current_encounter_additional_subroutine",
          target: "encountered_ice_self",
          append: "after_existing",
          subroutine: {
            kind: "end_the_run",
            visibility: "public",
          },
          visibility: "public",
        },
      ],
    });
  });

  it("describes Proteus Phase 1d public fort pass window implementations", () => {
    expect(
      cardImplementationForDefinitionId("onr_proteus_062_lesley-major"),
    ).toMatchObject({
      installCapabilities: [
        {
          kind: "install_only_inside_subsidiary_data_fort",
          visibility: "public",
        },
      ],
      fortRunWindows: [
        {
          kind: "add_advancement_counters_after_passing_last_ice_on_this_fort",
          timing: "pass_last_ice_on_this_fort",
          cost: { kind: "credit", amount: 5 },
          target: "installed_card_in_this_fort",
          amount: 2,
          limit: "once_per_run_per_source",
          visibility: "public",
        },
      ],
    });
    expect(
      cardImplementationForDefinitionId("onr_proteus_070_rasmin-bridger")
        ?.fortRunWindows,
    ).toContainEqual(
      expect.objectContaining({
        kind: "runner_pay_or_end_run_after_passing_ice_on_this_fort",
        timing: "pass_ice_on_this_fort",
        amount: 1,
        visibility: "public",
      }),
    );
  });

  it("describes Proteus Phase 1g post-pass derez utility implementation", () => {
    expect(
      cardImplementationForDefinitionId("onr_proteus_085_disintegrator")
        ?.runnerUtilityLongtail,
    ).toMatchObject({
      kind: "derez_fully_broken_passed_ice_and_end_run",
      cost: { kind: "credit", amount: 2 },
      timing: "after_passing_fully_broken_ice",
      target: "that_ice",
      visibility: "public",
    });
  });

  it("describes Proteus Phase 2b Charity Takeover score implementation", () => {
    expect(
      cardImplementationForDefinitionId("onr_proteus_002_charity-takeover")
        ?.lifecycle?.on_score,
    ).toEqual([
      {
        kind: "gain_credits",
        recipient: "corp",
        amount: 9,
        visibility: "public",
      },
      {
        kind: "add_bad_publicity",
        amount: 1,
        visibility: "public",
      },
    ]);
    expect(
      cardImplementationCoverageForDefinitionId(
        "onr_proteus_002_charity-takeover",
      )?.status,
    ).toBe("implemented");
  });

  it("describes Proteus Phase 2c Faked Hit event implementation", () => {
    expect(
      cardImplementationForDefinitionId("onr_proteus_108_faked-hit")
        ?.abilities?.[0],
    ).toMatchObject({
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "add_bad_publicity",
          amount: 1,
          visibility: "public",
        },
        {
          kind: "damage",
          recipient: "runner",
          damageType: "core",
          amount: 2,
          preventable: false,
          visibility: "public",
        },
      ],
    });
    expect(
      cardImplementationCoverageForDefinitionId("onr_proteus_108_faked-hit")
        ?.status,
    ).toBe("implemented");
  });

  it("describes Proteus Phase 2d Poisoned Water Supply event implementation", () => {
    expect(
      cardImplementationForDefinitionId("onr_proteus_117_poisoned-water-supply")
        ?.runnerEventLongtail,
    ).toMatchObject({
      kind: "trash_installed_runner_connections_then_add_bad_publicity",
      capabilityKey: "trash_two_connections_add_bad_publicity",
      count: 2,
      badPublicity: 1,
      visibility: "hidden_info_barrier",
    });
    expect(
      cardImplementationCoverageForDefinitionId(
        "onr_proteus_117_poisoned-water-supply",
      )?.status,
    ).toBe("implemented");
  });

  it("describes CLASSIC-03 simple operation and event implementations", () => {
    expect(
      cardImplementationForDefinitionId("onr_classic_017_corporate-shuffle")
        ?.corpUtility,
    ).toEqual({
      capabilityKey: "draw_five_then_shuffle_hq_card",
      addressability: ["plan", "action", "quote", "debug"],
      kind: "draw_corp_cards_then_shuffle_hq_card_into_rd",
      drawCount: 5,
      playCost: { kind: "printed", additionalClicks: 1 },
      visibility: "hidden_info_barrier",
    });
    expect(
      cardImplementationForDefinitionId("onr_classic_018_reclamation-project")
        ?.corpUtility,
    ).toEqual({
      capabilityKey: "return_archives_ice_to_hq",
      addressability: ["plan", "action", "quote", "debug"],
      kind: "corp_archives_to_hq",
      filter: { cardType: "ice" },
      maxSelections: "all",
      revealToRunner: true,
      playCost: { kind: "printed", additionalClicks: 1 },
      visibility: "hidden_info_barrier",
    });
    expect(
      cardImplementationForDefinitionId("onr_classic_037_finders-keepers")
        ?.runnerEventLongtail,
    ).toEqual({
      capabilityKey: "roll_three_dice_gain_credits",
      addressability: ["plan", "action", "quote", "debug"],
      kind: "three_dice_gain_credits",
      dieFaces: 6,
      diceCount: 3,
      recipient: "runner",
      visibility: "public",
    });
    expect(
      cardImplementationForDefinitionId("onr_classic_040_meat-upgrade")
        ?.abilities?.[0],
    ).toMatchObject({
      kind: "on_play",
      costs: { kind: "printed", additionalClicks: 1 },
      effects: [
        { kind: "remove_tags", mode: "up_to_amount", amount: 2 },
        { kind: "draw_cards", amount: 3 },
      ],
    });
    expect(
      cardImplementationForDefinitionId("onr_classic_041_networking")
        ?.abilities?.[0],
    ).toMatchObject({
      kind: "on_play",
      costs: { kind: "printed", additionalClicks: 1 },
      effects: [{ kind: "gain_credits", amount: 9 }],
    });
    expect(
      cardImplementationForDefinitionId("onr_classic_042_panzer-run")
        ?.abilities?.[0],
    ).toMatchObject({
      kind: "on_play",
      costs: { kind: "printed", additionalClicks: 1 },
      effects: [
        { kind: "gain_credits", amount: 4 },
        { kind: "draw_cards", amount: 2 },
      ],
    });

    for (const definitionId of [
      "onr_classic_017_corporate-shuffle",
      "onr_classic_018_reclamation-project",
      "onr_classic_037_finders-keepers",
      "onr_classic_040_meat-upgrade",
      "onr_classic_041_networking",
      "onr_classic_042_panzer-run",
    ]) {
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
        definitionId,
      ).toBe("implemented");
    }
  });

  it("describes CLASSIC-04 runner program implementations", () => {
    expect(
      cardImplementationForDefinitionId("onr_classic_027_early-worm")
        ?.icebreakerAbilities,
    ).toMatchObject([
      {
        kind: "break_subroutine",
        cost: { kind: "credit", amount: 1 },
        matches: { kind: "ice_subtype", subtype: "wall" },
      },
      {
        kind: "increase_strength",
        cost: { kind: "credit", amount: 2 },
        amount: 3,
      },
    ]);
    expect(
      cardImplementationForDefinitionId("onr_classic_028_matador")
        ?.icebreakerAbilities,
    ).toMatchObject([
      {
        kind: "break_subroutine",
        cost: { kind: "credit", amount: 1 },
        matches: { kind: "ice_subtype", subtype: "sentry" },
      },
      {
        kind: "increase_strength",
        cost: { kind: "credit", amount: 3 },
        amount: 5,
      },
    ]);
    expect(
      cardImplementationForDefinitionId("onr_classic_029_ms-todon")
        ?.icebreakerAbilities?.[0],
    ).toMatchObject({
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 1 },
      matches: { kind: "ice_subtype", subtype: "sentry" },
      special: { kind: "once_per_run_break_tag_and_all_stealth_loss" },
    });
    expect(
      cardImplementationForDefinitionId("onr_classic_030_psychic-friend")
        ?.icebreakerAbilities,
    ).toMatchObject([
      {
        kind: "break_subroutine",
        cost: { kind: "credit", amount: 1 },
        matches: { kind: "ice_subtype", subtype: "code_gate" },
      },
      {
        kind: "increase_strength",
        cost: { kind: "credit", amount: 2 },
        amount: 1,
        duration: "current_turn",
      },
    ]);
    expect(
      cardImplementationForDefinitionId("onr_classic_031_rent-i-con")
        ?.icebreakerAbilities?.[0],
    ).toMatchObject({
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 1 },
      matches: { kind: "any" },
      special: { kind: "run_end_trash_source_if_used" },
    });
    expect(
      cardImplementationForDefinitionId(
        "onr_classic_032_schematics-search-engine",
      )?.runnerUtilityLongtail,
    ).toEqual({
      capabilityKey: "hq_access_expose_installed_corp_cards",
      addressability: ["plan", "action", "quote", "debug"],
      kind: "hq_access_expose_all_installed_corp_cards",
      visibility: "public",
    });
    expect(
      cardImplementationForDefinitionId("onr_classic_033_superglue")
        ?.runnerUtilityLongtail,
    ).toEqual({
      capabilityKey: "derez_fully_broken_passed_ice",
      addressability: ["plan", "action", "quote", "debug"],
      kind: "derez_fully_broken_passed_ice",
      cost: { kind: "trash_source" },
      timing: "after_passing_fully_broken_ice",
      target: "that_ice",
      visibility: "public",
    });

    for (const definitionId of [
      "onr_classic_027_early-worm",
      "onr_classic_028_matador",
      "onr_classic_029_ms-todon",
      "onr_classic_030_psychic-friend",
      "onr_classic_031_rent-i-con",
      "onr_classic_032_schematics-search-engine",
      "onr_classic_033_superglue",
    ]) {
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
        definitionId,
      ).toBe("implemented");
    }
  });

  it("describes CLASSIC-05 Corp ICE baseline implementations", () => {
    expect(
      cardImplementationForDefinitionId("onr_classic_005_baskerville")
        ?.selfRezCostModifiers,
    ).toEqual([
      {
        kind: "self_rez_cost_reduction_during_run_after_noisy_icebreaker",
        amount: 5,
        visibility: "public",
      },
    ]);
    expect(
      CARD_DEFINITIONS_BY_ID["onr_classic_005_baskerville"]?.subroutines,
    ).toMatchObject([
      { type: "do_damage", damageType: "net", amount: 2 },
      {
        type: "initiate_trace",
        traceLimit: 5,
        traceSuccessEffect: {
          type: "add_counter",
          counterType: "baskerville",
          amount: 1,
        },
      },
      { type: "end_the_run" },
    ]);
    expect(
      cardImplementationForDefinitionId("onr_classic_005_baskerville")
        ?.runnerCounterEffects,
    ).toEqual([
      {
        capabilityKey: "baskerville_counter_run_start_damage",
        addressability: ["plan", "action", "quote", "debug"],
        counterType: "baskerville",
        removeCost: 3,
        runStart: {
          kind: "damage",
          damageType: "net",
          amountPerCounter: 2,
          preventable: true,
          visibility: "public",
        },
      },
    ]);
    expect(
      CARD_DEFINITIONS_BY_ID["onr_classic_006_bolter-swarm"]?.subroutines,
    ).toMatchObject([
      { type: "do_damage", damageType: "net", amount: 4 },
      { type: "set_next_encounter_no_break_subroutines" },
    ]);
    expect(
      CARD_DEFINITIONS_BY_ID["onr_classic_007_brain-drain"]?.subroutines,
    ).toMatchObject([
      {
        type: "random_damage",
        dieFaces: 6,
        damageOnResults: [1],
        damageType: "core",
        amount: 3,
      },
    ]);
    expect(
      CARD_DEFINITIONS_BY_ID["onr_classic_008_deadeye"]?.subroutines,
    ).toMatchObject([
      { type: "trash_installed_program" },
      { type: "end_the_run" },
    ]);
    expect(
      CARD_DEFINITIONS_BY_ID["onr_classic_012_imperial-guard"]?.subroutines,
    ).toMatchObject([
      { type: "trash_installed_program" },
      { type: "end_the_run" },
    ]);
    expect(
      CARD_DEFINITIONS_BY_ID["onr_classic_013_puzzle"]?.subroutines,
    ).toMatchObject([
      {
        type: "end_the_run_and_trash_source_at_end_of_turn",
      },
      {
        type: "end_the_run_and_trash_source_at_end_of_turn",
      },
    ]);

    for (const definitionId of [
      "onr_classic_005_baskerville",
      "onr_classic_006_bolter-swarm",
      "onr_classic_007_brain-drain",
      "onr_classic_008_deadeye",
      "onr_classic_012_imperial-guard",
      "onr_classic_013_puzzle",
    ]) {
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
        definitionId,
      ).toBe(
        ["onr_classic_007_brain-drain", "onr_classic_013_puzzle"].includes(
          definitionId,
        )
          ? "no_engine_behavior_required"
          : "implemented",
      );
    }
  });

  it("describes Proteus Phase 5b runner protection programs", () => {
    expect(
      cardImplementationForDefinitionId(
        "onr_proteus_086_enterprise-inc-shields",
      )?.damagePreventionSources,
    ).toMatchObject([
      {
        kind: "damage_prevention",
        capabilityKey: "prevent_two_net_damage",
        damageTypes: ["net"],
        amount: 2,
        amountMode: "up_to",
        cost: { kind: "credit", amount: 1 },
        priority: 100,
        visibility: "public",
      },
      {
        kind: "damage_prevention",
        capabilityKey: "prevent_one_core_damage",
        damageTypes: ["core"],
        amount: 1,
        cost: { kind: "credit", amount: 1 },
        priority: 101,
        visibility: "public",
      },
    ]);
    expect(
      cardImplementationForDefinitionId("onr_proteus_096_skullcap")
        ?.damagePreventionSources,
    ).toMatchObject([
      {
        kind: "damage_prevention",
        capabilityKey: "trash_source_prevent_all_net_or_core_damage",
        damageTypes: ["net", "core"],
        amount: "all",
        cost: { kind: "trash_source" },
        priority: 102,
        visibility: "public",
      },
    ]);
    expect(
      cardImplementationCoverageForDefinitionId(
        "onr_proteus_086_enterprise-inc-shields",
      )?.status,
    ).toBe("implemented");
    expect(
      cardImplementationCoverageForDefinitionId("onr_proteus_096_skullcap")
        ?.status,
    ).toBe("implemented");
  });

  it("keeps Originalset two-point prevention selectable up to its limit", () => {
    for (const definitionId of [
      "onr_v1_023_evil-twin",
      "onr_v1_028_force-shield",
      "onr_v1_061_shield",
    ]) {
      expect(
        cardImplementationForDefinitionId(definitionId)
          ?.damagePreventionSources,
        definitionId,
      ).toMatchObject([
        {
          kind: "damage_prevention",
          amount: 2,
          amountMode: "up_to",
          limit: { kind: "per_turn", amount: 2 },
        },
      ]);
    }
    expect(
      cardImplementationForDefinitionId("onr_v1_061_shield")
        ?.damagePreventionSources?.[0]?.damageTypes,
    ).toEqual(["net"]);
    for (const definitionId of [
      "onr_v1_023_evil-twin",
      "onr_v1_028_force-shield",
    ]) {
      expect(
        cardImplementationForDefinitionId(definitionId)
          ?.damagePreventionSources?.[0]?.damageTypes,
      ).toEqual(["net", "core"]);
    }
  });

  it("describes Proteus Phase 3a variable ICE implementations", () => {
    expect(
      cardImplementationForDefinitionId("onr_proteus_020_digiconda")
        ?.variableRez,
    ).toEqual({
      kind: "x_strength",
      capabilityKey: "variable_rez_x",
      addressability: ["plan", "choice", "quote", "debug"],
      label: "X für Rezzen wählen",
      additionalCostPerValue: 1,
      minValue: 0,
      maxValue: 6,
      visibility: "public",
    });
    expect(
      cardImplementationForDefinitionId("onr_proteus_022_food-fight")
        ?.variableRez,
    ).toMatchObject({
      kind: "paid_end_the_run_subroutines",
      capabilityKey: "rez_with_paid_end_run_subroutines",
      additionalCostPerSubroutine: 2,
      minSubroutines: 0,
      visibility: "public",
    });
    expect(
      cardImplementationCoverageForDefinitionId("onr_proteus_020_digiconda")
        ?.status,
    ).toBe("implemented");
    expect(
      cardImplementationCoverageForDefinitionId("onr_proteus_022_food-fight")
        ?.status,
    ).toBe("implemented");
  });

  it("describes Proteus Phase 3b variable ICE implementations", () => {
    expect(
      cardImplementationForDefinitionId("onr_proteus_013_caryatid")
        ?.variableRez,
    ).toMatchObject({
      kind: "alternate_subtype",
      capabilityKey: "rez_as_wall_or_code_gate",
      additionalCost: 1,
      baseSubtypes: ["wall"],
      alternateSubtypes: ["code_gate"],
      visibility: "public",
    });
    expect(
      cardImplementationForDefinitionId("onr_proteus_017_credit-blocks")
        ?.variableRez,
    ).toMatchObject({
      kind: "alternate_subtype",
      additionalCost: 1,
      baseSubtypes: ["sentry"],
      alternateSubtypes: ["wall"],
      visibility: "public",
    });
    expect(
      cardImplementationForDefinitionId("onr_proteus_025_homing-missile")
        ?.variableRez,
    ).toMatchObject({
      kind: "x_strength",
      additionalCostPerValue: 1,
      minValue: 0,
      maxValue: 8,
      traceLimitFromValue: true,
      visibility: "public",
    });
    expect(
      cardImplementationForDefinitionId("onr_proteus_039_sphinx-2006")
        ?.variableRez,
    ).toMatchObject({
      kind: "alternate_subtype",
      additionalCost: 4,
      baseSubtypes: ["code_gate"],
      alternateSubtypes: ["sentry"],
      visibility: "public",
    });
    for (const definitionId of [
      "onr_proteus_013_caryatid",
      "onr_proteus_017_credit-blocks",
      "onr_proteus_023_galatea",
      "onr_proteus_024_gatekeeper",
      "onr_proteus_025_homing-missile",
      "onr_proteus_028_lesser-arcana",
      "onr_proteus_036_sandstorm",
      "onr_proteus_039_sphinx-2006",
      "onr_proteus_040_sumo-2008",
    ] as const) {
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
      ).toBe("implemented");
    }
  });

  it("describes Proteus Phase 3c relative ICE implementations", () => {
    expect(
      cardImplementationForDefinitionId("onr_proteus_012_bug-zapper")
        ?.relativeIce,
    ).toMatchObject({
      capabilityKey: "outside_rezzed_ice_dynamic_net_damage",
      kind: "rezzed_ice_outside_this_ice",
      dynamicDamageSubroutine: {
        subroutineCapabilityKey: "subroutine_relative_net_damage",
        amountPerCount: 2,
        visibility: "public",
      },
    });
    expect(
      cardImplementationForDefinitionId("onr_proteus_021_dog-pile")
        ?.relativeIce,
    ).toMatchObject({
      capabilityKey: "outside_rezzed_ice_strength_and_net_damage",
      kind: "rezzed_ice_outside_this_ice",
      strengthBonusPerCount: 1,
      dynamicDamageSubroutine: {
        subroutineCapabilityKey: "subroutine_relative_net_damage",
        amountPerCount: 1,
        visibility: "public",
      },
    });
    expect(
      cardImplementationForDefinitionId("onr_proteus_026_hunting-pack")
        ?.relativeIce,
    ).toMatchObject({
      capabilityKey: "outside_rezzed_ice_dynamic_trace",
      kind: "rezzed_ice_outside_this_ice",
      dynamicTraceSubroutines: {
        traceLimit: 5,
        traceSuccessEffect: { type: "add_tag", amount: 1 },
        visibility: "public",
      },
    });
    expect(
      cardImplementationForDefinitionId("onr_proteus_030_mastermind")
        ?.relativeIce,
    ).toMatchObject({
      capabilityKey: "outside_rezzed_ice_strength_and_core_damage",
      kind: "rezzed_ice_outside_this_ice",
      strengthBonusPerCount: 1,
      dynamicDamageSubroutine: {
        subroutineCapabilityKey: "subroutine_relative_brain_damage",
        amountPerCount: 1,
        visibility: "public",
      },
    });
    for (const definitionId of [
      "onr_proteus_012_bug-zapper",
      "onr_proteus_021_dog-pile",
      "onr_proteus_026_hunting-pack",
      "onr_proteus_030_mastermind",
    ] as const) {
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
      ).toBe("implemented");
    }
  });

  it("describes Proteus Phase 3e ICE repositioning implementations", () => {
    for (const definitionId of [
      "onr_proteus_033_mobile-barricade",
      "onr_proteus_044_walking-wall",
    ] as const) {
      expect(
        cardImplementationForDefinitionId(definitionId)?.fortRunWindows?.[0],
      ).toMatchObject({
        kind: "move_self_to_different_position_on_same_fort",
        capabilityKey: "start_run_move_source_within_fort",
        timing: "start_of_run_on_this_fort",
        cost: { kind: "credit", amount: 1 },
        target: "different_position_on_same_fort",
        revealIfUnrezzed: true,
        limit: "once_per_run_per_source",
        visibility: "public",
      });
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
      ).toBe("implemented");
    }
  });

  it("describes activated main-action card abilities without callbacks", () => {
    expect(
      cardImplementationForDefinitionId("onr_v1_045_newsgroup-filter")
        ?.abilities,
    ).toContainEqual(
      expect.objectContaining({
        kind: "activated",
        timing: "runner_main",
        label: "2 Credits nehmen",
        costs: [{ kind: "action", amount: 1 }],
        effects: [
          expect.objectContaining({
            kind: "gain_credits",
            recipient: "controller",
            amount: 2,
            visibility: "public",
          }),
        ],
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_321_esa-contract")?.abilities,
    ).toContainEqual(
      expect.objectContaining({
        kind: "activated",
        timing: "corp_main",
        costs: [{ kind: "action", amount: 1 }],
        effects: [
          expect.objectContaining({
            kind: "draw_cards",
            recipient: "controller",
            amount: 2,
            visibility: "public",
          }),
        ],
      }),
    );

    const containsFunction = (value: unknown): boolean => {
      if (typeof value === "function") return true;
      if (!value || typeof value !== "object") return false;
      return Object.values(value as Record<string, unknown>).some(
        containsFunction,
      );
    };

    for (const implementation of CARD_IMPLEMENTATIONS) {
      expect(
        containsFunction(implementation),
        implementation.cardDefinitionId,
      ).toBe(false);
    }
  });
});
