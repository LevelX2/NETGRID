import type { CardImplementationDefinition } from "../../../types";

export const proteusChibaBankAccountImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_133_chiba-bank-account",
  abilities: [
    {
      kind: "activated",
      timing: "during_run",
      costs: [
        { kind: "credit", amount: 1 },
        { kind: "tap_source", amount: 1 },
      ],
      label: "Chiba Bank Account: 4 Credits nehmen",
      effects: [
        {
          kind: "gain_credits",
          recipient: "runner",
          amount: 4,
          visibility: "hidden_info_barrier",
        },
      ],
    },
  ],
};
