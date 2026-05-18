import type { CardImplementationDefinition } from "../../../types";

export const fortressArchitectsImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_324_fortress-architects",
  modifiers: [
    {
      kind: "rez_cost",
      operation: "reduce",
      amount: 1,
      activeWhile: "rezzed",
      sourceZone: "corp_root",
      visibility: "public",
      appliesTo: { cardType: "ice" },
    },
  ],
};
