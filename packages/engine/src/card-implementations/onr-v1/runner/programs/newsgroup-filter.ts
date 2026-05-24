import type { CardImplementationDefinition } from "../../../types";

// card name: Newsgroup Filter
// text: A: Gain [2].
export const newsgroupFilterImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_045_newsgroup-filter",
  abilities: [
    {
      kind: "activated",
      timing: "runner_main",
      label: "2 Credits nehmen",
      costs: [{ kind: "action", amount: 1 }],
      effects: [
        {
          kind: "gain_credits",
          recipient: "controller",
          amount: 2,
          visibility: "public",
        },
      ],
    },
  ],
};
