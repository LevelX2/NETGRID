import type { CardImplementationDefinition } from "../../../types";

// card name: Stakeout
// text: Gain [2] and draw one card.
export const proteusStakeoutImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_124_stakeout",
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
