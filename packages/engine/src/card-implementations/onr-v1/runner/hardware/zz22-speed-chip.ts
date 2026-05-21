import type { CardImplementationDefinition } from "../../../types";

// card name: ZZ22 Speed Chip
// text: Put [2] from the bank on ZZ22 Speed Chip when it is installed. Use these bits only to pay for using killers during runs. If you use any of these bits, replace them at the start of your next turn.
export const zz22SpeedChipImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_147_zz22-speed-chip",
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
    usableFor: ["using_killer_during_run"],
    refresh: {
      timing: "start_of_runner_turn",
      mode: "refill_to_capacity_if_used",
    },
  },
};
