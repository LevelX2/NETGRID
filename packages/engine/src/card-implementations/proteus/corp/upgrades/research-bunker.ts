import type { CardImplementationDefinition } from "../../../types";

// card name: Research Bunker
// text: The difficulty of research agendas installed in this fort is reduced by 1. Region baseline applies.
export const proteusResearchBunkerImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_072_research-bunker",
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
        subtype: "research",
        sameServerAsSource: true,
      },
    },
  ],
};
