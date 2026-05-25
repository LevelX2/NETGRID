import type { CardImplementationDefinition } from "../../../types";

// card name: Streetware Distributor
// text: Take 1 from this card at the start of your turn if it has any bits. A: Put 3 from the bank on this card.
export const proteusStreetwareDistributorImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_150_streetware-distributor",
  lifecycle: {
    start_of_runner_turn: [
      {
        condition: { kind: "source_has_hosted_credits" },
        effects: [
          {
            kind: "take_hosted_credits",
            source: "source",
            recipient: "controller",
            amount: 1,
            mode: "up_to_amount_if_available",
            visibility: "public",
          },
        ],
      },
    ],
  },
  abilities: [
    {
      kind: "activated",
      timing: "runner_main",
      costs: [{ kind: "action", amount: 1 }],
      label: "Streetware Distributor: 3 Credits auflegen",
      effects: [
        {
          kind: "add_hosted_credits",
          target: "source",
          amount: 3,
          visibility: "public",
        },
      ],
    },
  ],
};
