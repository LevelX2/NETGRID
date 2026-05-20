import type { CardImplementationDefinition } from "../../../types";

// card name: Remote Facility
// text: Gain an action during each of your turns.
export const remoteFacilityImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_335_remote-facility",
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
