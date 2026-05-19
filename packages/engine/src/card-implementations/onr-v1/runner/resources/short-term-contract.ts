import type { CardImplementationDefinition } from "../../../types";

// card name: Short-Term Contract
// text: Put [12] from the bank on Short-Term Contract when it is installed. When all the bits have been removed, trash Short-Term Contract. A: Take [2] from Short-Term Contract.
export const shortTermContractImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_178_short-term-contract",
  lifecycle: {
    on_install: [
      {
        kind: "add_hosted_credits",
        target: "source",
        amount: 12,
        visibility: "public",
      },
    ],
  },
  abilities: [
    {
      kind: "activated",
      timing: "runner_main",
      costs: [{ kind: "action", amount: 1 }],
      condition: { kind: "source_has_hosted_credits" },
      label: "Short-Term Contract: 2 Credits nehmen",
      effects: [
        {
          kind: "take_hosted_credits",
          source: "source",
          recipient: "controller",
          amount: 2,
          mode: "up_to_amount_if_available",
          visibility: "public",
        },
        {
          kind: "trash_source_when_empty",
          source: "source",
          visibility: "public",
        },
      ],
    },
  ],
};
