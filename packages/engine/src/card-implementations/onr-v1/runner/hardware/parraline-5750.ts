import type { CardImplementationDefinition } from "../../../types";

// card name: Parraline 5750
// text: Provides +1 MU. Put [1] from the bank on Parraline 5750 when it is installed. Use this bit only to pay for using icebreakers during runs. If you use the bit, replace it at the start of your next turn. Only one deck can be in play at a time. Trash any older decks.
export const parraline5750Implementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_137_parraline-5750",
  modifiers: [
    {
      kind: "memory_units",
      operation: "increase",
      amount: 1,
      activeWhile: "installed",
      sourceZone: "runner_installed",
      side: "runner",
      visibility: "public",
    },
  ],
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
    usableFor: ["using_icebreaker_during_run"],
    refresh: {
      timing: "start_of_runner_turn",
      mode: "refill_to_capacity_if_used",
    },
  },
};
