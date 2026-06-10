import type { CardImplementationDefinition } from "../../../types";
import {
  addHostedCredits,
  restrictedHostedCreditSource,
} from "../../../helpers";

// card name: Artemis 2020
// text: Provides +2 MU. Put [2] from the bank on Artemis 2020 when it is installed. Use these bits only to pay for using icebreakers during runs. If you use any of these bits, replace them at the start of your next turn. Only one deck can be in play at a time. Trash any older decks.
export const artemis2020Implementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_122_artemis-2020",
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
  ],
  lifecycle: {
    on_install: [addHostedCredits(2)],
  },
  restrictedHostedCreditSource: restrictedHostedCreditSource({
    capacity: 2,
    usableFor: ["using_icebreaker_during_run"],
  }),
};
