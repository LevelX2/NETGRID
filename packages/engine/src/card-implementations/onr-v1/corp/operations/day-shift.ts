import type { CardImplementationDefinition } from "../../../types";

// card name: Day Shift
// text: Draw two cards and gain [1].
export const dayShiftImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_288_day-shift",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "draw_cards",
          recipient: "controller",
          amount: 2,
          visibility: "public",
        },
        {
          kind: "gain_credits",
          recipient: "controller",
          amount: 1,
          visibility: "public",
        },
      ],
    },
  ],
};
