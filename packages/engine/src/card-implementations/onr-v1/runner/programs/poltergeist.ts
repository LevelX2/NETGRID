import type { CardImplementationDefinition } from "../../../types";

// card name: Poltergeist
// text: Put [2] on Poltergeist when it is installed. Use these bits only to pay for trashing nodes. If you use any of these bits, replace them at the start of your next turn.
export const poltergeistImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_048_poltergeist",
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
    usableFor: ["trash_nodes"],
    refresh: {
      timing: "start_of_runner_turn",
      mode: "refill_to_capacity_if_used",
    },
  },
};
