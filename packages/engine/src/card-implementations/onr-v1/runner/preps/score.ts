import type { CardImplementationDefinition } from "../../../types";

// card name: Score!
// text: Gain [9]
export const scoreImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_108_score",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
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
