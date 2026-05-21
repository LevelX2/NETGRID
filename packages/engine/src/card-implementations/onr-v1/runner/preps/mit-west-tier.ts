import type { CardImplementationDefinition } from "../../../types";

// card name: MIT West Tier
// text: Shuffle your hand, trash, and stack together, and then draw five cards. When you play MIT West Tier, remove it from the game instead of trashing it.
export const mitWestTierImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_101_mit-west-tier",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "shuffle_grip_trash_and_stack_then_draw",
          drawCount: 5,
          removePlayedCardFromGame: true,
          visibility: "hidden_info_barrier",
        },
      ],
    },
  ],
};
