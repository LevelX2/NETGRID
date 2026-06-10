import type { CardImplementationDefinition } from "../../../types";
import {
  addHostedCredits,
  restrictedHostedCreditSource,
} from "../../../helpers";

// card name: Pandora's Deck
// text: Provides +2 MU. Put [3] from the bank on Pandora's Deck when it is installed. Use these bits only to pay for increasing your link. If you use any of these bits, replace them at the start of your next turn. Only one deck can be in play at a time. Trash any older decks.
export const pandorasDeckImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_136_pandoras-deck",
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
    on_install: [addHostedCredits(3)],
  },
  restrictedHostedCreditSource: restrictedHostedCreditSource({
    capacity: 3,
    usableFor: ["increase_link"],
  }),
};
