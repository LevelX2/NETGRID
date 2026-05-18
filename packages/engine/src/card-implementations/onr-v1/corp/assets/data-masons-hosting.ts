import type { CardImplementationDefinition } from "../../../types";

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
  ],
};
