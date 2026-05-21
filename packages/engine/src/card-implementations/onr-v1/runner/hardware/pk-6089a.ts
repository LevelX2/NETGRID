import type { CardImplementationDefinition } from "../../../types";

// card name: PK-6089a
// text: Provides +1 MU. Put [3] from the bank on PK-6089a when it is installed. Use these bits only to pay for increasing your link. If you use any of these bits, replace them at the start of your next turn. Only one deck can be in play at a time. Trash older decks.
export const pk6089aImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_138_pk-6089a",
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
