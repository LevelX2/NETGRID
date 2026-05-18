import type { CardImplementationDefinition } from "../../../types";

export const accountsReceivableImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_281_accounts-receivable",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "gain_credits",
          recipient: "controller",
          amount: 9,
          visibility: "public",
        },
      ],
    },
  ],
};
