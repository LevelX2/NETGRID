import type { CardImplementationDefinition } from "../../../types";

// card name: Deck, The
// text: [0]: Base link 5. [1]: +1 link. Provides +1 MU. Use only one base link card for each trace attempt made against you. Only one deck can be in play at a time. Trash any older decks.
export const proteusDeckTheImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_138_deck-the",
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
  abilities: [
    {
      kind: "activated",
      timing: "trace_base_link_window",
      costs: [{ kind: "credit", amount: 0 }],
      limit: {
        kind: "one_base_link_card_per_trace_attempt",
        scope: "trace_attempt",
      },
      label: "Deck, The: Base Link 5 nutzen",
      effects: [
        {
          kind: "use_base_link",
          baseLink: 5,
          visibility: "public",
        },
      ],
    },
    {
      kind: "activated",
      timing: "trace_post_bid_link_window",
      costs: [{ kind: "credit", amount: 1 }],
      label: "Deck, The: +1 Link",
      effects: [
        {
          kind: "increase_trace_link",
          amount: 1,
          visibility: "public",
        },
      ],
    },
  ],
};
