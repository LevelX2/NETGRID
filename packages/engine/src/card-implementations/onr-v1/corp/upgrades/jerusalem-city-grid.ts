import type { CardImplementationDefinition } from "../../../types";

export const jerusalemCityGridImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_360_jerusalem-city-grid",
  modifiers: [
    {
      kind: "rez_cost",
      operation: "reduce",
      amount: 9,
      activeWhile: "rezzed",
      sourceZone: "corp_root",
      visibility: "public",
      appliesTo: {
        cardType: "ice",
        subtype: "wall",
        sameServerAsSource: true,
      },
    },
  ],
};
