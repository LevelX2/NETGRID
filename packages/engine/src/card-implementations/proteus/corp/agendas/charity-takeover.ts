import type { CardImplementationDefinition } from "../../../types";

// card name: Charity Takeover
// text: Gain [9] and 1 Bad Publicity point. If the Corp has 7 or more Bad Publicity points, it loses the game, even if it fulfills victory conditions at the same time.
export const proteusCharityTakeoverImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_002_charity-takeover",
  lifecycle: {
    on_score: [
      {
        kind: "gain_credits",
        recipient: "corp",
        amount: 9,
        visibility: "public",
      },
      {
        kind: "add_bad_publicity",
        amount: 1,
        visibility: "public",
      },
    ],
  },
};
