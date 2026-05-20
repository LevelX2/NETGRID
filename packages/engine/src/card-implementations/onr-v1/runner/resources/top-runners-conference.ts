import type { CardImplementationDefinition } from "../../../types";

// card name: Top Runners' Conference
// text: Gain [2] at the start of each of your turns. Trash Top Runners' Conference when you make a run.
export const topRunnersConferenceImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_184_top-runners-conference",
  lifecycle: {
    start_of_runner_turn: [
      {
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
    on_runner_run_start: [
      {
        effects: [
          {
            kind: "trash_source",
            visibility: "public",
          },
        ],
      },
    ],
  },
};
