import type { CardImplementationDefinition } from "../../../types";

// card name: Euromarket Consortium
// text: Hand size +2; A, [1]: Draw two cards.
export const euromarketConsortiumImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_322_euromarket-consortium",
  modifiers: [
    {
      kind: "hand_size",
      side: "corp",
      operation: "increase",
      amount: 2,
      activeWhile: "rezzed",
      sourceZone: "corp_root",
      visibility: "public",
    },
  ],
  abilities: [
    {
      kind: "activated",
      timing: "corp_main",
      costs: [
        { kind: "action", amount: 1 },
        { kind: "credit", amount: 1 },
      ],
      label: "Euromarket Consortium: 2 Karten ziehen",
      effects: [
        {
          kind: "draw_cards",
          recipient: "corp",
          amount: 2,
          visibility: "hidden_info_barrier",
        },
      ],
    },
  ],
};
