import { CARD_DEFINITIONS_BY_ID } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { CARD_IMPLEMENTATIONS } from "../registry";
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
] as const;

const SET_PREFIX = {
  classic: "onr_classic_",
  "onr-v1": "onr_v1_",
  proteus: "onr_proteus_",
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
    expect(CARD_IMPLEMENTATIONS).toEqual(flattened);
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
