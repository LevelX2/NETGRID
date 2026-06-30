import type { CardImplementationDefinition } from "../../../types";

// card name: Panzer Run
// text: Gain [4] and draw two cards. Playing a double prep costs two consecutive actions this turn instead of one.
export const classicPanzerRunImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_classic_042_panzer-run",
  abilities: [
    {
      kind: "on_play",
      costs: { kind: "printed", additionalClicks: 1 },
      effects: [
        {
          kind: "gain_credits",
          recipient: "controller",
          amount: 4,
          visibility: "public",
        },
        {
          kind: "draw_cards",
          recipient: "controller",
          amount: 2,
          visibility: "public",
        },
      ],
    },
  ],
};
