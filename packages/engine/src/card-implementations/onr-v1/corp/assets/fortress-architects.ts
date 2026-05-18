import type { CardImplementationDefinition } from "../../../types";

// card name: Fortress Architects
// text: Cost to install ice is reduced by [1].
export const fortressArchitectsImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_324_fortress-architects",
  modifiers: [
    {
      kind: "install_cost",
      operation: "reduce",
      amount: 1,
      activeWhile: "rezzed",
      sourceZone: "corp_root",
      visibility: "public",
      appliesTo: {
        side: "corp",
        cardType: "ice",
      },
    },
  ],
};
