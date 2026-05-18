import type { CardImplementationDefinition } from "../../../types";

// card name: ESA Contract
// text: A: Draw two cards.
export const esaContractImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_321_esa-contract",
  abilities: [
    {
      kind: "activated",
      timing: "corp_main",
      costs: [{ kind: "action", amount: 1 }],
      effects: [
        {
          kind: "draw_cards",
          recipient: "controller",
          amount: 2,
          visibility: "public",
        },
      ],
    },
  ],
};
