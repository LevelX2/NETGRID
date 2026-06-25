import type { CardImplementationDefinition } from "../../../types";

// card name: Playful AI
// text: Roll a die. On a 1, 2, or 3, gain that many bits, set aside that many dice to roll again, or choose some combination thereof. Repeat until you have rolled all the dice you set aside.
export const playfulAiImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_104_playful-ai",
  runnerEventLongtail: {
    kind: "random_dice_loop",
    dieFaces: 6,
    choiceOn: [1, 2, 3],
    visibility: "public",
  },
};
