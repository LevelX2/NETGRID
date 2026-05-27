import type { CardImplementationDefinition } from "../../../types";

export const proteusLiberatedSavingsAccountImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_143_liberated-savings-account",
  abilities: [
    {
      kind: "activated",
      timing: "during_run",
      costs: [
        { kind: "credit", amount: 7 },
        { kind: "tap_source", amount: 1 },
      ],
      label: "Liberated Savings Account: 11 Credits nehmen",
      effects: [
        {
          kind: "gain_credits",
          recipient: "runner",
          amount: 11,
          visibility: "hidden_info_barrier",
        },
      ],
    },
  ],
};
