import type { CardImplementationDefinition } from "../../../types";

// card name: Hell's Run
// text: Put [1] from the bank on Hell's Run when it is installed. Use this bit only to pay for increasing your link. If you use the bit, replace it at the start of your next turn.
export const hellsRunImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_164_hells-run",
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
    usableFor: ["increase_link"],
    refresh: {
      timing: "start_of_runner_turn",
      mode: "refill_to_capacity_if_used",
    },
  },
};
