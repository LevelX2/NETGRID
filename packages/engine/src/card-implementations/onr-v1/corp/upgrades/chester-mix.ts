import type { CardImplementationDefinition } from "../../../types";

// card name: Chester Mix
// text: Cost to install ice on this fort is reduced by [2].
export const chesterMixImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_352_chester-mix",
  modifiers: [
    {
      kind: "install_cost",
      operation: "reduce",
      amount: 2,
      activeWhile: "rezzed",
      sourceZone: "corp_root",
      visibility: "public",
      appliesTo: {
        side: "corp",
        cardType: "ice",
        sameServerAsSource: true,
      },
    },
  ],
};
