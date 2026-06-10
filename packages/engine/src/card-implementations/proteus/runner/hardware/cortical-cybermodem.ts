import type { CardImplementationDefinition } from "../../../types";
import {
  addHostedCredits,
  restrictedHostedCreditSource,
} from "../../../helpers";

// card name: Cortical Cybermodem
// text: Provides +2 MU and +2 hand size. Put [2] from the bank on Cortical Cybermodem when it is installed. Use these bits only to pay for using icebreakers during runs. If you use any of these bits, replace them from the bank at the start of your next turn. Only one deck can be in play at a time. Trash any older decks.
export const proteusCorticalCybermodemImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_proteus_134_cortical-cybermodem",
    hardwareDeck: true,
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
      {
        kind: "hand_size",
        operation: "increase",
        amount: 2,
        activeWhile: "installed",
        sourceZone: "runner_installed",
        side: "runner",
        visibility: "public",
      },
    ],
    lifecycle: {
      on_install: [addHostedCredits(2)],
    },
    restrictedHostedCreditSource: restrictedHostedCreditSource({
      capacity: 2,
      usableFor: ["using_icebreaker_during_run"],
    }),
  };
