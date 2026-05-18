import type { CardImplementationDefinition } from "../../../types";

// card name: Data Masons
// text: Cost to rez walls is reduced by [2]. All walls have +1 strength.
export const dataMasonsHostingImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_317_data-masons",
  modifiers: [
    {
      kind: "rez_cost",
      operation: "reduce",
      amount: 2,
      activeWhile: "rezzed",
      sourceZone: "corp_root",
      visibility: "public",
      appliesTo: { cardType: "ice", subtype: "wall" },
    },
    {
      kind: "ice_strength",
      operation: "increase",
      amount: 1,
      activeWhile: "rezzed",
      sourceZone: "corp_root",
      visibility: "public",
      appliesTo: {
        side: "corp",
        cardType: "ice",
        subtype: "wall",
      },
    },
  ],
};
