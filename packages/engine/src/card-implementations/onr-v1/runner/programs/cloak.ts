import type { CardImplementationDefinition } from "../../../types";

// card name: Cloak
// text: Put [3] from the bank on Cloak when it is installed. Use these bits only to pay for using icebreakers during runs, but not for using noisy icebreakers. If you use any of these bits, replace them at the start of your next turn.
export const cloakImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_011_cloak",
  lifecycle: {
    on_install: [
      {
        kind: "add_hosted_credits",
        target: "source",
        amount: 3,
        visibility: "public",
      },
    ],
  },
  restrictedHostedCreditSource: {
    capacity: 3,
    counterType: "bit",
    usableFor: ["using_icebreaker_during_run_non_noisy"],
    refresh: {
      timing: "start_of_runner_turn",
      mode: "refill_to_capacity_if_used",
    },
  },
};
