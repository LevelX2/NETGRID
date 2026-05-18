import type { CardImplementationDefinition } from "../../../types";

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
