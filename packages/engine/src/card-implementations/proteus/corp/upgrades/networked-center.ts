import type { CardImplementationDefinition } from "../../../types";

// card name: Networked Center
// text: The difficulty of Gray Ops agendas installed in this fort is reduced by 1. Region baseline applies.
export const proteusNetworkedCenterImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_065_networked-center",
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
        subtype: "gray_ops",
        sameServerAsSource: true,
      },
    },
  ],
};
