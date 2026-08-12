import {
  cardSpecDefinitions,
  cardSpecImplementationDefinitionIds,
  cardSpecImplementations,
  cardSpecRuntimeDefinitionIds,
} from "@netgrid/cards/engine";
import type { CardDefinitionId } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { CARD_DEFINITIONS, CARD_DEFINITIONS_BY_ID } from "./card-definitions";
import {
  CARD_IMPLEMENTATIONS,
  CARD_IMPLEMENTATIONS_BY_DEFINITION_ID,
  cardImplementationForDefinitionId,
  resolveUniqueCardImplementationCounterOwner,
} from "./card-implementations/registry";

describe("canonical CardSpec authority", () => {
  it("materializes the exact CardSpec definition and implementation partitions", () => {
    expect(CARD_DEFINITIONS.map((definition) => definition.id)).toEqual(
      cardSpecRuntimeDefinitionIds(),
    );
    expect(CARD_DEFINITIONS).toHaveLength(cardSpecDefinitions().length);
    expect(
      CARD_IMPLEMENTATIONS.map(
        (implementation) => implementation.cardDefinitionId,
      ),
    ).toEqual(cardSpecImplementationDefinitionIds());
    expect(CARD_IMPLEMENTATIONS).toHaveLength(cardSpecImplementations().length);
    expect(Object.isFrozen(CARD_DEFINITIONS)).toBe(true);
    expect(Object.isFrozen(CARD_DEFINITIONS_BY_ID)).toBe(true);
    expect(Object.isFrozen(CARD_IMPLEMENTATIONS)).toBe(true);
    expect(Object.isFrozen(CARD_IMPLEMENTATIONS_BY_DEFINITION_ID)).toBe(true);

    for (const definitionId of cardSpecImplementationDefinitionIds()) {
      const implementation = cardImplementationForDefinitionId(definitionId);
      expect(implementation).toBeDefined();
      expect(implementation).toBe(
        CARD_IMPLEMENTATIONS_BY_DEFINITION_ID[definitionId],
      );
      expect(Object.isFrozen(implementation)).toBe(true);
    }
  });

  it("keeps authority containers immutable", () => {
    expect(() =>
      (CARD_IMPLEMENTATIONS as unknown as Array<unknown>).push({}),
    ).toThrow();
    expect(() => {
      const mutable = CARD_IMPLEMENTATIONS_BY_DEFINITION_ID as Record<
        string,
        unknown
      >;
      mutable.injected = {};
    }).toThrow();
  });

  it("derives counter owners from typed mechanics and fails closed on missing or duplicate owners", () => {
    const owner = (cardDefinitionId: CardDefinitionId, counterKind: string) =>
      ({
        cardDefinitionId,
        virusCounter: {
          counterKind,
          addOnSuccessfulRun: {
            server: "hq",
            counterScope: { kind: "shared_corp_pool" },
            amount: 1,
            visibility: "public",
          },
        },
      }) as (typeof CARD_IMPLEMENTATIONS)[number];
    expect(
      resolveUniqueCardImplementationCounterOwner(
        [owner("counter_owner", "reviewed")],
        "reviewed",
      ),
    ).toBe("counter_owner");
    expect(() =>
      resolveUniqueCardImplementationCounterOwner([], "missing"),
    ).toThrow("card_implementation_counter_owner_not_unique:missing:0");
    expect(() =>
      resolveUniqueCardImplementationCounterOwner(
        [owner("first", "duplicate"), owner("second", "duplicate")],
        "duplicate",
      ),
    ).toThrow("card_implementation_counter_owner_not_unique:duplicate:2");
  });
});
