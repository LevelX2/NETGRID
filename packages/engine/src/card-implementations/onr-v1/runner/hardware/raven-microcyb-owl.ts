import type { CardImplementationDefinition } from "../../../types";

// card name: Raven Microcyb Owl
// text: Provides +1 MU. Put [3] from the bank on Microcyb Owl when it is installed. Use these bits only to pay for using icebreakers during runs, but not for using noisy icebreakers. If you use any of these bits, replace them at the start of your next turn. Only one deck can be in play at a time. Trash any older decks.
export const ravenMicrocybOwlImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_141_raven-microcyb-owl",
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
