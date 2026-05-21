import type { CardImplementationDefinition } from "../../../types";

// card name: Invisibility
// text: Put [1] from the bank on Invisibility when it is installed. Use this bit only to pay for using icebreakers during runs, but not for using noisy icebreakers. If you use the bit, replace it at the start of your next turn.
export const invisibilityImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_035_invisibility",
  lifecycle: {
    on_install: [
      {
        kind: "add_hosted_credits",
        target: "source",
        amount: 1,
        visibility: "public",
      },
    ],
  },
  restrictedHostedCreditSource: {
    capacity: 1,
    counterType: "bit",
    usableFor: ["using_icebreaker_during_run_non_noisy"],
    refresh: {
      timing: "start_of_runner_turn",
      mode: "refill_to_capacity_if_used",
    },
  },
};
