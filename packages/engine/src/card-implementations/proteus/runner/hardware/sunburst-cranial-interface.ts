import type { CardImplementationDefinition } from "../../../types";
import {
  addHostedCredits,
  restrictedHostedCreditSource,
} from "../../../helpers";

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
      on_install: [addHostedCredits(1)],
    },
    restrictedHostedCreditSource: restrictedHostedCreditSource({
      capacity: 1,
      usableFor: ["using_icebreaker_during_run_non_noisy"],
    }),
  };
