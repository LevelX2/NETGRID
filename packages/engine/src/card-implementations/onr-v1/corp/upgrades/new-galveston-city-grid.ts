import type { CardImplementationDefinition } from "../../../types";

// card name: New Galveston City Grid
// text: All nodes and other upgrades installed inside this fort cost [2], in addition to the normal cost, to trash. Rez a region when you install it. Install a region only if you can pay to rez it. Only one region may be installed in each fort. Trash older ones.
export const newGalvestonCityGridImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_362_new-galveston-city-grid",
  modifiers: [
    {
      kind: "trash_cost",
      operation: "increase",
      amount: 2,
      activeWhile: "rezzed",
      sourceZone: "corp_root",
      side: "corp",
      visibility: "public",
      appliesTo: {
        cardType: "asset",
      },
      sameServerAsSource: true,
    },
    {
      kind: "trash_cost",
      operation: "increase",
      amount: 2,
      activeWhile: "rezzed",
      sourceZone: "corp_root",
      side: "corp",
      visibility: "public",
      appliesTo: {
        cardType: "upgrade",
      },
      sameServerAsSource: true,
    },
  ],
};
