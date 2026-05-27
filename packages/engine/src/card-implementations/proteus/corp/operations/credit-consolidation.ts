import type { CardImplementationDefinition } from "../../../types";

// card name: Credit Consolidation
// text: Gain [15].
export const proteusCreditConsolidationImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_047_credit-consolidation",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "gain_credits",
          recipient: "controller",
          amount: 15,
          visibility: "public",
        },
      ],
    },
  ],
};
