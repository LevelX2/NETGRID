import type { CardImplementationDefinition } from "../../../types";

// card name: Vewy Vewy Quiet
// text: Put [2] from the bank on Vewy Vewy Quiet when it is installed. Use these bits only to pay for using icebreakers during runs, but not for using noisy icebreakers. If you use any of these bits, replace them at the start of your next turn.
export const vewyVewyQuietImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_071_vewy-vewy-quiet",
  lifecycle: {
    on_install: [
      {
        kind: "add_hosted_credits",
        target: "source",
        amount: 2,
        visibility: "public",
      },
    ],
  },
  restrictedHostedCreditSource: {
    capacity: 2,
    counterType: "bit",
    usableFor: ["using_icebreaker_during_run_non_noisy"],
    refresh: {
      timing: "start_of_runner_turn",
      mode: "refill_to_capacity_if_used",
    },
  },
};
