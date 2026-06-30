import type { CardImplementationDefinition } from "../../../types";

// card name: Networking
// text: Gain [9]. Playing a double prep costs two consecutive actions this turn instead of one.
export const classicNetworkingImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_classic_041_networking",
  abilities: [
    {
      kind: "on_play",
      costs: { kind: "printed", additionalClicks: 1 },
      effects: [
        {
          kind: "gain_credits",
          recipient: "controller",
          amount: 9,
          visibility: "public",
        },
      ],
    },
  ],
};
