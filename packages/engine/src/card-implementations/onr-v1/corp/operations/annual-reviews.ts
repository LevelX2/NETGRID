import type { CardImplementationDefinition } from "../../../types";

// card name: Annual Reviews
// text: Draw three cards.
export const annualReviewsImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_282_annual-reviews",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "draw_cards",
          recipient: "controller",
          amount: 3,
          visibility: "public",
        },
      ],
    },
  ],
};
