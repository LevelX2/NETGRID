import type { CardImplementationDefinition } from "../../../types";

// card name: Washington, D.C., City Grid
// text: The difficulty of agendas installed inside this fort is reduced by 1.
// text: Rez a region when you install it. Install a region only if you can pay to rez it. Only one region may be installed in each fort. Trash older ones.
export const washingtonDcCityGridImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_374_washington-d-c-city-grid",
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
        sameServerAsSource: true,
      },
    },
  ],
};
