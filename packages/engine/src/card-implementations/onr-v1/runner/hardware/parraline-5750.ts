import type { CardImplementationDefinition } from "../../../types";
import {
  addHostedCredits,
  restrictedHostedCreditSource,
} from "../../../helpers";

// card name: Parraline 5750
// text: Provides +1 MU. Put [1] from the bank on Parraline 5750 when it is installed. Use this bit only to pay for using icebreakers during runs. If you use the bit, replace it at the start of your next turn. Only one deck can be in play at a time. Trash any older decks.
export const parraline5750Implementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_137_parraline-5750",
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
  ],
  lifecycle: {
    on_install: [addHostedCredits(1)],
  },
  restrictedHostedCreditSource: restrictedHostedCreditSource({
    capacity: 1,
    usableFor: ["using_icebreaker_during_run"],
  }),
};
