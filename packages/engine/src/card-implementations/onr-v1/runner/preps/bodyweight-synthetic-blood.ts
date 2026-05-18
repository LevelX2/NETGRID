import type { CardImplementationDefinition } from "../../../types";

// card name: Bodyweight Synthetic Blood
// text: Draw five cards.
export const bodyweightSyntheticBloodImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_079_bodyweight-synthetic-blood",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "draw_cards",
          recipient: "controller",
          amount: 5,
          visibility: "public",
        },
      ],
    },
  ],
};
