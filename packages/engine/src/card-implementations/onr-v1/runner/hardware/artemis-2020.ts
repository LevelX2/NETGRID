import type { CardImplementationDefinition } from "../../../types";

// card name: Artemis 2020
// text: Provides +2 MU. Put [2] from the bank on Artemis 2020 when it is installed. Use these bits only to pay for using icebreakers during runs. If you use any of these bits, replace them at the start of your next turn. Only one deck can be in play at a time. Trash any older decks.
export const artemis2020Implementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_122_artemis-2020",
  modifiers: [
    {
      kind: "memory_units",
      operation: "increase",
      amount: 2,
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
        amount: 2,
        visibility: "public",
      },
    ],
  },
  restrictedHostedCreditSource: {
    capacity: 2,
    counterType: "bit",
    usableFor: ["using_icebreaker_during_run"],
    refresh: {
      timing: "start_of_runner_turn",
      mode: "refill_to_capacity_if_used",
    },
  },
};
