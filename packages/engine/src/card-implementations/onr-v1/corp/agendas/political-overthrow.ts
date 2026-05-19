import type { CardImplementationDefinition } from "../../../types";

// card name: Political Overthrow
// text: A: Gain [3].
export const politicalOverthrowImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_210_political-overthrow",
  abilities: [
    {
      kind: "activated",
      timing: "corp_main",
      costs: [{ kind: "action", amount: 1 }],
      effects: [
        {
          kind: "gain_credits",
          recipient: "controller",
          amount: 3,
          visibility: "public",
        },
      ],
    },
  ],
};
