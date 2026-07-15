import {
  CARD_DEFINITIONS_BY_ID,
  type CardDefinitionId,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { CardAccessEffectImplementation } from "../../ability-engine/definition-types";
import {
  CARD_IMPLEMENTATIONS,
  cardImplementationForDefinitionId,
} from "../../card-implementations/registry";

const DEFAULT_REZ_NODE_IDS = [
  "onr_v1_315_corprunners-shattered-remains",
  "onr_v1_323_experimental-ai",
  "onr_v1_340_setup",
  "onr_v1_345_trap",
  "onr_v1_346_vacant-soulkiller",
  "onr_proteus_057_doppelganger-antibody",
  "onr_proteus_068_pattel-antibody",
] as const satisfies readonly CardDefinitionId[];

const NON_INSTALLED_NODE_IDS = [
  "onr_proteus_054_bel-digmo-antibody",
  "onr_proteus_075_stereogram-antibody",
] as const satisfies readonly CardDefinitionId[];

const VIRUS_TEST_SITE_ID =
  "onr_v1_348_virus-test-site" as const satisfies CardDefinitionId;

const EXPECTED_NODE_ACCESS_IDS = [
  ...DEFAULT_REZ_NODE_IDS,
  VIRUS_TEST_SITE_ID,
  ...NON_INSTALLED_NODE_IDS,
].sort();

function accessEffects(
  definitionId: CardDefinitionId,
): readonly CardAccessEffectImplementation[] {
  return cardImplementationForDefinitionId(definitionId)?.accessEffects ?? [];
}

describe("node access rez contract", () => {
  it("keeps the active Corp asset access inventory explicit and complete", () => {
    const actual = CARD_IMPLEMENTATIONS.filter((implementation) => {
      const definition = CARD_DEFINITIONS_BY_ID[implementation.cardDefinitionId];
      return (
        definition?.side === "corp" &&
        definition.type === "asset" &&
        (implementation.accessEffects?.length ?? 0) > 0
      );
    })
      .map((implementation) => implementation.cardDefinitionId)
      .sort();

    expect(actual).toEqual(EXPECTED_NODE_ACCESS_IDS);
  });

  it.each(DEFAULT_REZ_NODE_IDS)(
    "requires every installed access effect on %s to use the rezzed default",
    (definitionId) => {
      const installedEffects = accessEffects(definitionId).filter((effect) =>
        effect.sourceZones.includes("installed"),
      );

      expect(installedEffects.length).toBeGreaterThan(0);
      expect(
        installedEffects.every(
          (effect) =>
            (effect.installedSourceActivation ?? "requires_rezzed") ===
            "requires_rezzed",
        ),
      ).toBe(true);
    },
  );

  it("models Virus Test Site as separate unrezzed, rezzed and hidden-zone effects", () => {
    const effects = accessEffects(VIRUS_TEST_SITE_ID);
    const unrezzed = effects.find(
      (effect) =>
        effect.sourceZones.includes("installed") &&
        effect.installedSourceActivation === "unrezzed_only",
    );
    const rezzed = effects.find(
      (effect) =>
        effect.sourceZones.includes("installed") &&
        (effect.installedSourceActivation ?? "requires_rezzed") ===
          "requires_rezzed",
    );
    const hiddenZones = effects.find(
      (effect) =>
        effect.sourceZones.includes("hq") && effect.sourceZones.includes("rd"),
    );

    expect(unrezzed?.effects).toEqual([
      expect.objectContaining({ kind: "damage", damageType: "net", amount: 1 }),
    ]);
    expect(rezzed?.effects).toEqual([
      expect.objectContaining({
        kind: "damage_from_source_advancement_counters",
        damageType: "net",
        amountPerCounter: 2,
        minimumAmount: 1,
      }),
    ]);
    expect(hiddenZones).toMatchObject({
      sourceZones: ["hq", "rd", "archives"],
      ignoreIfAccessedFrom: ["archives"],
      revealIfAccessedFrom: ["rd"],
    });
  });

  it.each(NON_INSTALLED_NODE_IDS)(
    "keeps %s outside the installed access path",
    (definitionId) => {
      expect(
        accessEffects(definitionId).some((effect) =>
          effect.sourceZones.includes("installed"),
        ),
      ).toBe(false);
    },
  );
});

