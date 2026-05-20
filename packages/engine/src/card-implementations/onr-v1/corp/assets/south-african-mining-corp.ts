import type { CardImplementationDefinition } from "../../../types";

// card name: South African Mining Corp
// text: A, A, A: Gain [6].
export const southAfricanMiningCorpImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_343_south-african-mining-corp",
  abilities: [
    {
      kind: "activated",
      timing: "corp_main",
      costs: [{ kind: "action", amount: 3 }],
      label: "6 Credits nehmen",
      effects: [
        {
          kind: "gain_credits",
          recipient: "controller",
          amount: 6,
          visibility: "public",
        },
      ],
    },
  ],
};
