import type { CardImplementationDefinition } from "../../../types";

// card name: Clown
// text: All ice is encountered with its strength reduced by 1.
export const clownImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_012_clown",
  modifiers: [
    {
      kind: "ice_strength",
      operation: "reduce",
      amount: 1,
      activeWhile: "installed",
      sourceZone: "runner_installed",
      visibility: "public",
      appliesTo: {
        side: "corp",
        cardType: "ice",
        encounteredOnly: true,
      },
    },
  ],
};
