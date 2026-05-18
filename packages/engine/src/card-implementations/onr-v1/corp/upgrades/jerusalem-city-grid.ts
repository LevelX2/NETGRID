import type { CardImplementationDefinition } from "../../../types";

// card name: Jerusalem City Grid
// text: Cost to rez walls on this fort is reduced by [2]. All walls on this fort have +1 strength.
// text: Rez a region when you install it. Install a region only if you can pay to rez it. Only one region may be installed in each fort. Trash older ones.
export const jerusalemCityGridImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_360_jerusalem-city-grid",
  modifiers: [
    {
      kind: "rez_cost",
      operation: "reduce",
      amount: 2,
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
