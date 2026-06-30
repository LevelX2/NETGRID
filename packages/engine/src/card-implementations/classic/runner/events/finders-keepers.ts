import type { CardImplementationDefinition } from "../../../types";

// card name: Finders Keepers
// text: Roll three dice. Gain that many bits.
export const classicFindersKeepersImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_classic_037_finders-keepers",
  runnerEventLongtail: {
    kind: "three_dice_gain_credits",
    dieFaces: 6,
    diceCount: 3,
    recipient: "runner",
    visibility: "public",
  },
};
