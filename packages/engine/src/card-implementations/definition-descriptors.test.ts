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
      cardImplementationForDefinitionId(529)?.modifiers,
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
      cardImplementationForDefinitionId(529)?.modifiers,
    ).toContainEqual(
      expect.objectContaining({
        kind: "ice_strength",
        operation: "increase",
        amount: 1,
        appliesTo: { side: "corp", cardType: "ice", subtype: "wall" },
      }),
    );
    expect(
      cardImplementationForDefinitionId(532)?.modifiers,
    ).toContainEqual(
      expect.objectContaining({
        kind: "rez_cost",
        operation: "reduce",
        amount: 1,
        appliesTo: { cardType: "ice", subtype: "code_gate" },
      }),
    );
    expect(
      cardImplementationForDefinitionId(532)?.modifiers,
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
        553,
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
      cardImplementationForDefinitionId(536)
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
      cardImplementationForDefinitionId(572)
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
      cardImplementationForDefinitionId(572)
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
      cardImplementationCoverageForDefinitionId(529)
        ?.status,
    ).toBe("implemented");
    expect(
      cardImplementationCoverageForDefinitionId(532)
        ?.status,
    ).toBe("implemented");
    expect(
      cardImplementationCoverageForDefinitionId(
        553,
      )?.status,
    ).toBe("implemented");
    expect(
      cardImplementationCoverageForDefinitionId(
        536,
      )?.status,
    ).toBe("implemented");
    expect(
      cardImplementationCoverageForDefinitionId(
        572,
      )?.status,
    ).toBe("implemented");
  });

  it("describes simple credit cards through typed on-play effects", () => {
    expect(
      cardImplementationForDefinitionId(493)
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
      cardImplementationForDefinitionId(502)
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
      cardImplementationForDefinitionId(309)
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
      cardImplementationForDefinitionId(320)?.abilities,
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
      cardImplementationForDefinitionId(494)?.abilities,
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
      cardImplementationForDefinitionId(500)?.abilities,
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
      cardImplementationForDefinitionId(507)?.abilities,
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
      cardImplementationForDefinitionId(291)
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
      cardImplementationForDefinitionId(307)?.abilities,
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
      cardImplementationForDefinitionId(497)
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
      cardImplementationCoverageForDefinitionId(497)
        ?.status,
    ).toBe("implemented");
  });

  it("describes Datapool® by Zetatech through a tagged on-play add_tags effect", () => {
    expect(
      cardImplementationForDefinitionId(499)
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
        499,
      )?.status,
    ).toBe("implemented");
  });

  it("describes P3.2 tagged Corp Operations through on-play card effects", () => {
    expect(
      cardImplementationForDefinitionId(505)
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
      [513, 2],
      [514, 4],
      [519, 5],
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
      505,
      513,
      514,
      519,
    ] as const) {
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
      ).toBe("implemented");
    }
  });

  it("describes P3.3 tagged activated meat-damage abilities", () => {
    for (const [definitionId, amount] of [
      [554, 1],
      [420, 1],
      [429, 2],
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
      [418, 2, 3],
      [422, 1, 3],
      [555, 3, 6],
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
      cardImplementationForDefinitionId(391)
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
        391,
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
      [521, "on_rez", 16, 2, "corp_main"],
      [549, "on_rez", 15, 3, "corp_main"],
      [390, "on_install", 12, 2, "runner_main"],
      [405, "on_score", 15, 3, "corp_main"],
      [421, "on_score", 12, 3, "corp_main"],
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
      521,
      549,
      390,
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
      cardImplementationForDefinitionId(366)?.abilities,
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
        530,
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
      cardImplementationCoverageForDefinitionId(366)?.status,
    ).toBe("implemented");
    expect(
      cardImplementationCoverageForDefinitionId(
        530,
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
      [523, 12, 2, true],
      [538, 12, 1, true],
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
      cardImplementationForDefinitionId(410)
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
      cardImplementationForDefinitionId(410)
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
      cardImplementationForDefinitionId(556)
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
      cardImplementationForDefinitionId(556)
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
      410,
      556,
    ] as const) {
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
      ).toBe("implemented");
    }
  });

  it("describes P3.7 turn-start economy and run-start cleanup cards", () => {
    expect(
      cardImplementationForDefinitionId(423)
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
      cardImplementationForDefinitionId(375)
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
      cardImplementationForDefinitionId(386)
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
      cardImplementationForDefinitionId(386)
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
      547,
      430,
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
      cardImplementationForDefinitionId(396)
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
      cardImplementationForDefinitionId(396)
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
      375,
      386,
      396,
      423,
      430,
      547,
    ] as const) {
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
      ).toBe("implemented");
    }
  });

  it("describes P3.8 passive hand-size and memory-unit modifiers", () => {
    for (const [definitionId, amount] of [
      [346, 2],
      [345, 3],
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
      cardImplementationForDefinitionId(417)
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
      cardImplementationForDefinitionId(550)
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
      [357, 1],
      [358, 2],
      [356, 3],
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
      346,
      345,
      417,
      550,
      357,
      358,
      356,
    ] as const) {
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
      ).toBe("implemented");
    }
  });

  it("describes P3.9 scored agenda passive modifiers", () => {
    for (const [definitionId, subtype] of [
      [401, "black_ops"],
      [413, "gray_ops"],
      [414, "research"],
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
        403,
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
      401,
      403,
      413,
      414,
    ] as const) {
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
      ).toBe("implemented");
    }
  });

  it("describes P3.10 server-scoped ICE modifiers", () => {
    expect(
      cardImplementationForDefinitionId(564)?.modifiers,
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
        562,
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
        582,
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
      562,
      564,
      582,
    ] as const) {
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
      ).toBe("implemented");
    }
    expect(
      cardImplementationForDefinitionId(578),
    ).toBeDefined();
  });

  it("describes P3.11 Red Herrings steal-cost modifier", () => {
    expect(
      cardImplementationForDefinitionId(578)?.modifiers,
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
      cardImplementationCoverageForDefinitionId(578)
        ?.status,
    ).toBe("implemented");
  });

  it("describes P3.12 region city-grid modifiers", () => {
    expect(
      cardImplementationForDefinitionId(586)
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
      cardImplementationForDefinitionId(574)
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
      572,
      574,
      586,
    ] as const) {
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
      ).toBe("implemented");
    }
  });

  it("describes Proteus Phase 1a reuse-only baseline implementations", () => {
    expect(
      CARD_DEFINITIONS_BY_ID[99]?.subroutines,
    ).toEqual([
      expect.objectContaining({ type: "end_the_run" }),
      expect.objectContaining({ type: "end_the_run" }),
      expect.objectContaining({ type: "end_the_run" }),
      expect.objectContaining({ type: "end_the_run" }),
    ]);

    for (const [definitionId, subtype] of [
      [123, "gray_ops"],
      [130, "research"],
      [135, "black_ops"],
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
        208,
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
        208,
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
      cardImplementationForDefinitionId(204)
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
      cardImplementationForDefinitionId(89)?.modifiers,
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
      cardImplementationForDefinitionId(92)
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
      cardImplementationForDefinitionId(120),
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
      cardImplementationForDefinitionId(128)
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
      cardImplementationForDefinitionId(143)
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
      cardImplementationForDefinitionId(60)
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
        60,
      )?.status,
    ).toBe("implemented");
  });

  it("describes Proteus Phase 2c Faked Hit event implementation", () => {
    expect(
      cardImplementationForDefinitionId(166)
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
      cardImplementationCoverageForDefinitionId(166)
        ?.status,
    ).toBe("implemented");
  });

  it("describes Proteus Phase 2d Poisoned Water Supply event implementation", () => {
    expect(
      cardImplementationForDefinitionId(175)
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
        175,
      )?.status,
    ).toBe("implemented");
  });

  it("describes CLASSIC-03 simple operation and event implementations", () => {
    expect(
      cardImplementationForDefinitionId(21)
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
      cardImplementationForDefinitionId(22)
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
      cardImplementationForDefinitionId(41)
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
      cardImplementationForDefinitionId(44)
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
      cardImplementationForDefinitionId(45)
        ?.abilities?.[0],
    ).toMatchObject({
      kind: "on_play",
      costs: { kind: "printed", additionalClicks: 1 },
      effects: [{ kind: "gain_credits", amount: 9 }],
    });
    expect(
      cardImplementationForDefinitionId(46)
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
      21,
      22,
      41,
      44,
      45,
      46,
    ]) {
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
        String(definitionId),
      ).toBe("implemented");
    }
  });

  it("describes CLASSIC-04 runner program implementations", () => {
    expect(
      cardImplementationForDefinitionId(31)
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
      cardImplementationForDefinitionId(32)
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
      cardImplementationForDefinitionId(33)
        ?.icebreakerAbilities?.[0],
    ).toMatchObject({
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 1 },
      matches: { kind: "ice_subtype", subtype: "sentry" },
      special: { kind: "once_per_run_break_tag_and_all_stealth_loss" },
    });
    expect(
      cardImplementationForDefinitionId(34)
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
      cardImplementationForDefinitionId(35)
        ?.icebreakerAbilities?.[0],
    ).toMatchObject({
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 1 },
      matches: { kind: "any" },
      special: { kind: "run_end_trash_source_if_used" },
    });
    expect(
      cardImplementationForDefinitionId(
        36,
      )?.runnerUtilityLongtail,
    ).toEqual({
      capabilityKey: "hq_access_expose_installed_corp_cards",
      addressability: ["plan", "action", "quote", "debug"],
      kind: "hq_access_expose_all_installed_corp_cards",
      visibility: "public",
    });
    expect(
      cardImplementationForDefinitionId(37)
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
      31,
      32,
      33,
      34,
      35,
      36,
      37,
    ]) {
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
        String(definitionId),
      ).toBe("implemented");
    }
  });

  it("describes CLASSIC-05 Corp ICE baseline implementations", () => {
    expect(
      cardImplementationForDefinitionId(9)
        ?.selfRezCostModifiers,
    ).toEqual([
      {
        kind: "self_rez_cost_reduction_during_run_after_noisy_icebreaker",
        amount: 5,
        visibility: "public",
      },
    ]);
    expect(
      CARD_DEFINITIONS_BY_ID[9]?.subroutines,
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
      cardImplementationForDefinitionId(9)
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
      CARD_DEFINITIONS_BY_ID[10]?.subroutines,
    ).toMatchObject([
      { type: "do_damage", damageType: "net", amount: 4 },
      { type: "set_next_encounter_no_break_subroutines" },
    ]);
    expect(
      CARD_DEFINITIONS_BY_ID[11]?.subroutines,
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
      CARD_DEFINITIONS_BY_ID[12]?.subroutines,
    ).toMatchObject([
      { type: "trash_installed_program" },
      { type: "end_the_run" },
    ]);
    expect(
      CARD_DEFINITIONS_BY_ID[16]?.subroutines,
    ).toMatchObject([
      { type: "trash_installed_program" },
      { type: "end_the_run" },
    ]);
    expect(
      CARD_DEFINITIONS_BY_ID[17]?.subroutines,
    ).toMatchObject([
      {
        type: "end_the_run_and_trash_source_at_end_of_turn",
      },
      {
        type: "end_the_run_and_trash_source_at_end_of_turn",
      },
    ]);

    for (const definitionId of [
      9,
      10,
      11,
      12,
      16,
      17,
    ]) {
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
        String(definitionId),
      ).toBe(
        [11, 17].includes(
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
        144,
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
      cardImplementationForDefinitionId(154)
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
        144,
      )?.status,
    ).toBe("implemented");
    expect(
      cardImplementationCoverageForDefinitionId(154)
        ?.status,
    ).toBe("implemented");
  });

  it("keeps Originalset two-point prevention selectable up to its limit", () => {
    for (const definitionId of [
      235,
      240,
      273,
    ]) {
      expect(
        cardImplementationForDefinitionId(definitionId)
          ?.damagePreventionSources,
        String(definitionId),
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
      cardImplementationForDefinitionId(273)
        ?.damagePreventionSources?.[0]?.damageTypes,
    ).toEqual(["net"]);
    for (const definitionId of [
      235,
      240,
    ]) {
      expect(
        cardImplementationForDefinitionId(definitionId)
          ?.damagePreventionSources?.[0]?.damageTypes,
      ).toEqual(["net", "core"]);
    }
  });

  it("describes Proteus Phase 3a variable ICE implementations", () => {
    expect(
      cardImplementationForDefinitionId(78)
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
      cardImplementationForDefinitionId(80)
        ?.variableRez,
    ).toMatchObject({
      kind: "paid_end_the_run_subroutines",
      capabilityKey: "rez_with_paid_end_run_subroutines",
      additionalCostPerSubroutine: 2,
      minSubroutines: 0,
      visibility: "public",
    });
    expect(
      cardImplementationCoverageForDefinitionId(78)
        ?.status,
    ).toBe("implemented");
    expect(
      cardImplementationCoverageForDefinitionId(80)
        ?.status,
    ).toBe("implemented");
  });

  it("describes Proteus Phase 3b variable ICE implementations", () => {
    expect(
      cardImplementationForDefinitionId(71)
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
      cardImplementationForDefinitionId(75)
        ?.variableRez,
    ).toMatchObject({
      kind: "alternate_subtype",
      additionalCost: 1,
      baseSubtypes: ["sentry"],
      alternateSubtypes: ["wall"],
      visibility: "public",
    });
    expect(
      cardImplementationForDefinitionId(83)
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
      cardImplementationForDefinitionId(97)
        ?.variableRez,
    ).toMatchObject({
      kind: "alternate_subtype",
      additionalCost: 4,
      baseSubtypes: ["code_gate"],
      alternateSubtypes: ["sentry"],
      visibility: "public",
    });
    for (const definitionId of [
      71,
      75,
      81,
      82,
      83,
      86,
      94,
      97,
      98,
    ] as const) {
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
      ).toBe("implemented");
    }
  });

  it("describes Proteus Phase 3c relative ICE implementations", () => {
    expect(
      cardImplementationForDefinitionId(70)
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
      cardImplementationForDefinitionId(79)
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
      cardImplementationForDefinitionId(84)
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
      cardImplementationForDefinitionId(88)
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
      70,
      79,
      84,
      88,
    ] as const) {
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
      ).toBe("implemented");
    }
  });

  it("describes Proteus Phase 3e ICE repositioning implementations", () => {
    for (const definitionId of [
      91,
      102,
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
      cardImplementationForDefinitionId(257)
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
      cardImplementationForDefinitionId(533)?.abilities,
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
        String(implementation.cardDefinitionId),
      ).toBe(false);
    }
  });
});
