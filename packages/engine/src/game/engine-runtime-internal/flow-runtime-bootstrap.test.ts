import type { CardDefinition, CardDefinitionId } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { CardImplementationDefinition } from "../../card-implementations/types";
import {
  isInstalledNetDamageUpgrade,
  resolveUniqueInstalledNetDamageUpgrade,
} from "./flow-runtime-bootstrap";

const DIRECT_NET_DAMAGE_UPGRADE = implementation("direct_net_damage_upgrade", {
  kind: "on_access",
  sourceZones: ["installed"],
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
  visibility: "hidden_info_barrier",
});

const SELF_DESTRUCT_SHAPE = implementation("self_destruct_shape", {
  kind: "on_access",
  sourceZones: ["installed"],
  installedSourceActivation: "requires_rezzed",
  cost: { kind: "trash_source" },
  optional: true,
  effects: [
    {
      kind: "trash_other_corp_installed_cards_in_source_server_and_damage_runner",
      include: "root_and_ice",
      damageType: "net",
      amountPerTrashed: 1,
      visibility: "hidden_info_barrier",
    },
  ],
  visibility: "hidden_info_barrier",
});

function implementation(
  cardDefinitionId: string,
  accessEffect: NonNullable<
    CardImplementationDefinition["accessEffects"]
  >[number],
): CardImplementationDefinition {
  return {
    cardDefinitionId: cardDefinitionId as CardDefinitionId,
    accessEffects: [accessEffect],
  };
}

function definition(
  definitionId: CardDefinitionId,
  type: "asset" | "upgrade",
): CardDefinition {
  return { id: definitionId, type } as CardDefinition;
}

describe("flow runtime installed net-damage upgrade resolver", () => {
  it("selects only the direct one-net-damage upgrade contract, not Self-Destruct's composite asset effect", () => {
    const definitions = new Map<CardDefinitionId, CardDefinition>([
      [
        DIRECT_NET_DAMAGE_UPGRADE.cardDefinitionId,
        definition(DIRECT_NET_DAMAGE_UPGRADE.cardDefinitionId, "upgrade"),
      ],
      [
        SELF_DESTRUCT_SHAPE.cardDefinitionId,
        definition(SELF_DESTRUCT_SHAPE.cardDefinitionId, "asset"),
      ],
    ]);

    expect(
      isInstalledNetDamageUpgrade(
        DIRECT_NET_DAMAGE_UPGRADE,
        definitions.get(DIRECT_NET_DAMAGE_UPGRADE.cardDefinitionId),
      ),
    ).toBe(true);
    expect(
      isInstalledNetDamageUpgrade(
        SELF_DESTRUCT_SHAPE,
        definitions.get(SELF_DESTRUCT_SHAPE.cardDefinitionId),
      ),
    ).toBe(false);
    expect(
      resolveUniqueInstalledNetDamageUpgrade(
        [DIRECT_NET_DAMAGE_UPGRADE, SELF_DESTRUCT_SHAPE],
        (definitionId) => definitions.get(definitionId),
      ),
    ).toBe(DIRECT_NET_DAMAGE_UPGRADE.cardDefinitionId);
  });

  it("fails closed for malformed and duplicate direct upgrade contracts", () => {
    const malformed = implementation("malformed_upgrade", {
      kind: "on_access",
      sourceZones: ["installed"],
      effects: [
        {
          kind: "damage",
          recipient: "runner",
          damageType: "net",
          amount: 1,
          preventable: false,
          visibility: "hidden_info_barrier",
        },
      ],
      visibility: "hidden_info_barrier",
    });
    const duplicate = implementation("duplicate_upgrade", {
      kind: "on_access",
      sourceZones: ["installed"],
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
      visibility: "hidden_info_barrier",
    });
    const definitions = new Map<CardDefinitionId, CardDefinition>([
      [
        malformed.cardDefinitionId,
        definition(malformed.cardDefinitionId, "upgrade"),
      ],
      [
        duplicate.cardDefinitionId,
        definition(duplicate.cardDefinitionId, "upgrade"),
      ],
      [
        DIRECT_NET_DAMAGE_UPGRADE.cardDefinitionId,
        definition(DIRECT_NET_DAMAGE_UPGRADE.cardDefinitionId, "upgrade"),
      ],
    ]);

    expect(() =>
      resolveUniqueInstalledNetDamageUpgrade([malformed], (definitionId) =>
        definitions.get(definitionId),
      ),
    ).toThrow("found 0");
    expect(() =>
      resolveUniqueInstalledNetDamageUpgrade(
        [DIRECT_NET_DAMAGE_UPGRADE, duplicate],
        (definitionId) => definitions.get(definitionId),
      ),
    ).toThrow("found 2");
  });
});
