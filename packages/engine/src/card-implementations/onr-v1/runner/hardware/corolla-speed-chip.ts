import type { CardImplementationDefinition } from "../../../types";

// card name: Corolla Speed Chip
// text: Put [1] from the bank on Corolla Speed Chip when it is installed. Use this bit only to pay for using killers during runs. If you use the bit, replace it at the start of your next turn.
export const corollaSpeedChipImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_124_corolla-speed-chip",
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
    usableFor: ["using_killer_during_run"],
    refresh: {
      timing: "start_of_runner_turn",
      mode: "refill_to_capacity_if_used",
    },
  },
};
