import type { CardImplementationDefinition } from "../../../types";

// card name: Floating Runner BBS
// text: Gain [1] at the start of each of your turns.
export const floatingRunnerBbsImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_163_floating-runner-bbs",
  lifecycle: {
    start_of_runner_turn: [
      {
        effects: [
          {
            kind: "gain_credits",
            recipient: "controller",
            amount: 1,
            visibility: "public",
          },
        ],
      },
    ],
  },
};
