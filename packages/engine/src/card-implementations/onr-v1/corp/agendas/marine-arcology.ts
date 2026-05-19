import type { CardImplementationDefinition } from "../../../types";

// card name: Marine Arcology
// text: A, A: Gain [3].
export const marineArcologyImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_206_marine-arcology",
  abilities: [
    {
      kind: "activated",
      timing: "corp_main",
      costs: [{ kind: "action", amount: 2 }],
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
