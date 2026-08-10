import {
  CS06_CARD_DEFINITION_IDS,
  cardSpecDefinitions,
  cardSpecImplementationDefinitionIds,
  cardSpecImplementations,
  cardSpecRuntimeDefinitionIds,
  cs06CardDefinitions,
  cs06CardImplementations,
} from "@netgrid/cards/engine";
import {
  CARD_DEFINITIONS_BY_ID as LEGACY_CARD_DEFINITIONS_BY_ID,
  type CardDefinitionId,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import {
  CARD_DEFINITIONS,
  CARD_DEFINITIONS_BY_ID,
  CardDefinitionAuthorityError,
  composeCardDefinitionAuthorities,
} from "./card-definitions";
import {
  CARD_IMPLEMENTATIONS,
  CARD_IMPLEMENTATIONS_BY_DEFINITION_ID,
  CardImplementationAuthorityError,
  cardImplementationForDefinitionId,
  composeCardImplementationAuthorities,
  legacyCardImplementationForDefinitionId,
} from "./card-implementations/registry";
import { CARD_IMPLEMENTATION_CATALOG } from "./card-implementations/subregistries/card-implementation-catalog";

describe("heterogeneous card authority composition", () => {
  it("composes exact disjoint definition and implementation partitions", () => {
    expect(Object.keys(LEGACY_CARD_DEFINITIONS_BY_ID)).toHaveLength(534);
    expect(cardSpecDefinitions()).toHaveLength(100);
    expect(cs06CardDefinitions()).toHaveLength(10);
    expect(CARD_DEFINITIONS).toHaveLength(634);
    expect(CARD_IMPLEMENTATION_CATALOG).toHaveLength(517);
    expect(cardSpecImplementations()).toHaveLength(80);
    expect(cs06CardImplementations()).toHaveLength(10);
    expect(CARD_IMPLEMENTATIONS).toHaveLength(597);
    expect(Object.isFrozen(CARD_DEFINITIONS)).toBe(true);
    expect(Object.isFrozen(CARD_DEFINITIONS_BY_ID)).toBe(true);
    expect(Object.isFrozen(CARD_IMPLEMENTATIONS)).toBe(true);
    expect(Object.isFrozen(CARD_IMPLEMENTATIONS_BY_DEFINITION_ID)).toBe(true);

    for (const definitionId of cardSpecRuntimeDefinitionIds()) {
      expect(LEGACY_CARD_DEFINITIONS_BY_ID[definitionId]).toBeUndefined();
      expect(CARD_DEFINITIONS_BY_ID[definitionId]).toBeDefined();
    }
    for (const definitionId of cardSpecImplementationDefinitionIds()) {
      expect(
        legacyCardImplementationForDefinitionId(definitionId),
      ).toBeUndefined();
      const implementation = cardImplementationForDefinitionId(definitionId);
      expect(implementation).toBeDefined();
      expect(implementation).toBe(
        CARD_IMPLEMENTATIONS_BY_DEFINITION_ID[definitionId],
      );
      expect(Object.isFrozen(implementation)).toBe(true);
    }
  });

  it("keeps combined authority containers immutable", () => {
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

  it("fails definition composition closed for overlap, missing, unexpected and duplicate lanes", () => {
    const legacy = Object.values(LEGACY_CARD_DEFINITIONS_BY_ID)[0]!;
    const canonical = cs06CardDefinitions()[0]!;
    expectDefinitionError(
      () => composeCardDefinitionAuthorities([legacy], [legacy], [legacy.id]),
      "overlapping_definition_authority",
      legacy.id,
    );
    expectDefinitionError(
      () => composeCardDefinitionAuthorities([legacy], [], [canonical.id]),
      "missing_definition_authority",
      canonical.id,
    );
    expectDefinitionError(
      () => composeCardDefinitionAuthorities([legacy], [canonical], []),
      "unexpected_card_spec_authority",
      canonical.id,
    );
    expectDefinitionError(
      () =>
        composeCardDefinitionAuthorities(
          [legacy],
          [canonical, canonical],
          [canonical.id],
        ),
      "duplicate_definition_authority",
      canonical.id,
    );
  });

  it("fails implementation composition closed for overlap, missing, unexpected and duplicate lanes", () => {
    const legacy = CARD_IMPLEMENTATION_CATALOG[0]!;
    const canonical = cs06CardImplementations()[0]!;
    expectImplementationError(
      () =>
        composeCardImplementationAuthorities(
          [legacy],
          [legacy],
          [legacy.cardDefinitionId],
        ),
      "overlapping_definition_authority",
      legacy.cardDefinitionId,
    );
    expectImplementationError(
      () =>
        composeCardImplementationAuthorities(
          [legacy],
          [],
          [canonical.cardDefinitionId],
        ),
      "missing_card_spec_authority",
      canonical.cardDefinitionId,
    );
    expectImplementationError(
      () => composeCardImplementationAuthorities([legacy], [canonical], []),
      "unexpected_card_spec_authority",
      canonical.cardDefinitionId,
    );
    expectImplementationError(
      () =>
        composeCardImplementationAuthorities(
          [legacy],
          [canonical, canonical],
          [canonical.cardDefinitionId],
        ),
      "duplicate_definition_authority",
      canonical.cardDefinitionId,
    );
  });
});

function expectDefinitionError(
  action: () => unknown,
  code: CardDefinitionAuthorityError["code"],
  definitionId: CardDefinitionId,
): void {
  try {
    action();
    throw new Error("expected definition authority error");
  } catch (error) {
    expect(error).toBeInstanceOf(CardDefinitionAuthorityError);
    expect(error).toMatchObject({ code, definitionId });
  }
}

function expectImplementationError(
  action: () => unknown,
  code: CardImplementationAuthorityError["code"],
  definitionId: CardDefinitionId,
): void {
  try {
    action();
    throw new Error("expected implementation authority error");
  } catch (error) {
    expect(error).toBeInstanceOf(CardImplementationAuthorityError);
    expect(error).toMatchObject({ code, definitionId });
  }
}
