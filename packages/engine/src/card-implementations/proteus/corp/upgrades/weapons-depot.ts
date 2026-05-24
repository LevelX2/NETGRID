import type { CardImplementationDefinition } from "../../../types";

// card name: Weapons Depot
// text: The difficulty of Black Ops agendas installed in this fort is reduced by 1. Region baseline applies.
export const proteusWeaponsDepotImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_077_weapons-depot",
  regionBaseline: {
    kind: "region_baseline",
    rezOnInstall: true,
    installOnlyIfRezAffordable: true,
    oneRegionPerFort: true,
    trashOlderRegions: true,
  },
  modifiers: [
    {
      kind: "agenda_difficulty",
      operation: "reduce",
      amount: 1,
      activeWhile: "rezzed",
      sourceZone: "corp_root",
      side: "corp",
      visibility: "public",
      appliesTo: {
        cardType: "agenda",
        subtype: "black_ops",
        sameServerAsSource: true,
      },
    },
  ],
};
