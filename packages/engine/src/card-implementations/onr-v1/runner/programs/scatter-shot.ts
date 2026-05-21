import type { CardImplementationDefinition } from "../../../types";

// card name: Scatter Shot
// text: Put [2] from the bank on Scatter Shot when it is installed. Use these bits only to pay for trashing upgrades. If you use any of these bits, replace them at the start of your next turn.
export const scatterShotImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_057_scatter-shot",
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
    usableFor: ["trash_upgrades"],
    refresh: {
      timing: "start_of_runner_turn",
      mode: "refill_to_capacity_if_used",
    },
  },
};
