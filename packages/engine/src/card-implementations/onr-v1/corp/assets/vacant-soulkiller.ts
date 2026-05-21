import type { CardImplementationDefinition } from "../../../types";

// card name: Vacant Soulkiller
// text: You may advance Vacant Soulkiller before and after you rez it. When Runner accesses Vacant Soulkiller, it does 1 brain damage for each advancement counter on it.
export const vacantSoulkillerImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_346_vacant-soulkiller",
  advanceable: { while: "installed_before_and_after_rez" },
  accessEffects: [
    {
      kind: "on_access",
      sourceZones: ["installed"],
      visibility: "hidden_info_barrier",
      effects: [
        {
          kind: "damage_from_source_advancement_counters",
          recipient: "runner",
          damageType: "core",
          amountPerCounter: 1,
          minimumAmount: 0,
          preventable: true,
          visibility: "hidden_info_barrier",
        },
      ],
    },
  ],
};
