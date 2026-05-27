import type { CardImplementationDefinition } from "../../../types";

export const proteusSwissBankAccountImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_152_swiss-bank-account",
  abilities: [
    {
      kind: "activated",
      timing: "during_run",
      costs: [{ kind: "tap_source", amount: 1 }],
      label: "Swiss Bank Account: 2 Credits nehmen",
      effects: [
        {
          kind: "gain_credits",
          recipient: "runner",
          amount: 2,
          visibility: "hidden_info_barrier",
        },
      ],
    },
    {
      kind: "activated",
      timing: "during_run",
      costs: [
        { kind: "credit", amount: 3 },
        { kind: "tap_source", amount: 1 },
      ],
      label: "Swiss Bank Account: 6 Credits nehmen",
      effects: [
        {
          kind: "gain_credits",
          recipient: "runner",
          amount: 6,
          visibility: "hidden_info_barrier",
        },
      ],
    },
  ],
};
