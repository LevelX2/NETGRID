import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
import { describe, expect, it } from "vitest";
import {
  CARD_IMPLEMENTATIONS,
  legacyCardImplementationForDefinitionId,
} from "../registry";
import {
  CS06_CARD_DEFINITION_IDS,
  cs06CardImplementations,
} from "@netgrid/cards/engine";
import {
  CARD_IMPLEMENTATION_CATALOG,
  CARD_IMPLEMENTATION_CATALOG_GROUPS,
} from "./card-implementation-catalog";

const EXPECTED_GROUP_KEYS = [
  "classic:corp:agenda",
  "classic:corp:asset",
  "classic:corp:ice",
  "classic:corp:operation",
  "classic:corp:upgrade",
  "classic:runner:event",
  "classic:runner:hardware",
  "classic:runner:program",
  "classic:runner:resource",
  "onr-v1:corp:agenda",
  "onr-v1:corp:asset",
  "onr-v1:corp:ice",
  "onr-v1:corp:operation",
  "onr-v1:corp:upgrade",
  "onr-v1:runner:event",
  "onr-v1:runner:hardware",
  "onr-v1:runner:program",
  "onr-v1:runner:resource",
  "proteus:corp:agenda",
  "proteus:corp:asset",
  "proteus:corp:ice",
  "proteus:corp:operation",
  "proteus:corp:upgrade",
  "proteus:runner:event",
  "proteus:runner:hardware",
  "proteus:runner:program",
  "proteus:runner:resource",
  "demo:corp:asset",
  "v08:corp:asset",
] as const;

const SET_PREFIX = {
  classic: "onr_classic_",
  demo: "simple_",
  "onr-v1": "onr_v1_",
  proteus: "onr_proteus_",
  v08: "v08_",
} as const;

describe("semantic CardImplementation catalog", () => {
  it("keeps deterministic set/side/type groups with exact flattening parity", () => {
    const groupKeys = CARD_IMPLEMENTATION_CATALOG_GROUPS.map(
      (group) => `${group.set}:${group.side}:${group.cardType}`,
    );
    const flattened = CARD_IMPLEMENTATION_CATALOG_GROUPS.flatMap(
      (group) => group.implementations,
    );

    expect(groupKeys).toEqual(EXPECTED_GROUP_KEYS);
    expect(new Set(groupKeys).size).toBe(groupKeys.length);
    expect(CARD_IMPLEMENTATION_CATALOG).toEqual(flattened);
    expect(CARD_IMPLEMENTATION_CATALOG).toHaveLength(573);
    expect(cs06CardImplementations()).toHaveLength(10);
    expect(CARD_IMPLEMENTATIONS).toHaveLength(583);
    expect(CARD_IMPLEMENTATIONS.slice(0, flattened.length)).toEqual(flattened);
    expect(
      CARD_IMPLEMENTATIONS.slice(flattened.length).map(
        (entry) => entry.cardDefinitionId,
      ),
    ).toEqual(CS06_CARD_DEFINITION_IDS);
    for (const definitionId of CS06_CARD_DEFINITION_IDS)
      expect(
        legacyCardImplementationForDefinitionId(definitionId),
      ).toBeUndefined();
    expect(new Set(flattened.map((entry) => entry.cardDefinitionId)).size).toBe(
      flattened.length,
    );
  });

  it("matches every group to the shared card set, side and type metadata", () => {
    for (const group of CARD_IMPLEMENTATION_CATALOG_GROUPS) {
      expect(group.implementations.length).toBeGreaterThan(0);
      for (const implementation of group.implementations) {
        const definition =
          CARD_DEFINITIONS_BY_ID[implementation.cardDefinitionId];
        expect(definition, implementation.cardDefinitionId).toBeDefined();
        expect(
          implementation.cardDefinitionId.startsWith(SET_PREFIX[group.set]),
        ).toBe(true);
        expect(definition?.side).toBe(group.side);
        expect(definition?.type).toBe(group.cardType);
      }
    }
  });
});
