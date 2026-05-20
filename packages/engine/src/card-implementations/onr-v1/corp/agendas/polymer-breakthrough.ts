import type { CardImplementationDefinition } from "../../../types";

// card name: Polymer Breakthrough
// text: Gain [1] at the start of each of your turns.
export const polymerBreakthroughImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_211_polymer-breakthrough",
  lifecycle: {
    start_of_corp_turn: [
      {
        effects: [
          {
            kind: "gain_credits",
            recipient: "controller",
            amount: 1,
            visibility: "public",
          },
        ],
      },
    ],
  },
};
