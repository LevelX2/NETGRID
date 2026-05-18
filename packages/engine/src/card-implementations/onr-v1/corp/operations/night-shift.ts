import type { CardImplementationDefinition } from "../../../types";

// card name: Night Shift
// text: Gain [2] and draw one card.
export const nightShiftImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_295_night-shift",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "gain_credits",
          recipient: "controller",
          amount: 2,
          visibility: "public",
        },
        {
          kind: "draw_cards",
          recipient: "controller",
          amount: 1,
          visibility: "public",
        },
      ],
    },
  ],
};
