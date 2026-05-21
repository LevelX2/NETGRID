import type { CardImplementationDefinition } from "../../../types";

// card name: "Drifter" Mobile Environment
// text: Put [2] from the bank on Mobile Environment when it is installed. Use these bits only to pay for removing tags. If you use any of these bits, replace them at the start of your next turn.
export const drifterMobileEnvironmentImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_126_drifter-mobile-environment",
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
    usableFor: ["remove_tags"],
    refresh: {
      timing: "start_of_runner_turn",
      mode: "refill_to_capacity_if_used",
    },
  },
};
