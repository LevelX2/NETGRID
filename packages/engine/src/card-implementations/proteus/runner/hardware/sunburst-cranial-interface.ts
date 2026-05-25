import type { CardImplementationDefinition } from "../../../types";

// card name: Sunburst Cranial Interface
// text: Provides +1 MU and +1 hand size. Put [1] from the bank on Cranial Interface when it is installed. Use this bit only to pay for using icebreakers during runs, but not for using noisy icebreakers. If you use the bit, replace it from the bank at the start of your next turn. Only one deck can be in play at a time. Trash any older decks.
export const proteusSunburstCranialInterfaceImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_proteus_151_sunburst-cranial-interface",
    hardwareDeck: true,
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
      {
        kind: "hand_size",
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
      usableFor: ["using_icebreaker_during_run_non_noisy"],
      refresh: {
        timing: "start_of_runner_turn",
        mode: "refill_to_capacity_if_used",
      },
    },
  };
