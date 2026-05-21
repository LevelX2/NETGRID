import type { CardImplementationDefinition } from "../../../types";

// card name: Pandora's Deck
// text: Provides +2 MU. Put [3] from the bank on Pandora's Deck when it is installed. Use these bits only to pay for increasing your link. If you use any of these bits, replace them at the start of your next turn. Only one deck can be in play at a time. Trash any older decks.
export const pandorasDeckImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_136_pandoras-deck",
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
        amount: 3,
        visibility: "public",
      },
    ],
  },
  restrictedHostedCreditSource: {
    capacity: 3,
    counterType: "bit",
    usableFor: ["increase_link"],
    refresh: {
      timing: "start_of_runner_turn",
      mode: "refill_to_capacity_if_used",
    },
  },
};
