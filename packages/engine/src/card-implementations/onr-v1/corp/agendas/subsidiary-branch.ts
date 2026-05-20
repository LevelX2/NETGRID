import type { CardImplementationDefinition } from "../../../types";

// card name: Subsidiary Branch
// text: Gain an action during each of your turns.
export const subsidiaryBranchImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_218_subsidiary-branch",
  lifecycle: {
    start_of_corp_turn: [
      {
        effects: [
          {
            kind: "gain_actions",
            recipient: "controller",
            amount: 1,
            visibility: "public",
          },
        ],
      },
    ],
  },
};
