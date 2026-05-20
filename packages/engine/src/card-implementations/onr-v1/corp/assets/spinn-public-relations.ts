import type { CardImplementationDefinition } from "../../../types";

// card name: Spinn Public Relations
// text: Take [1] from Spinn Public Relations, if it has any bits, at the start of each of your turns. A: Put [3] from the bank on Spinn Public Relations.
export const spinnPublicRelationsImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_344_spinn-public-relations",
  lifecycle: {
    start_of_corp_turn: [
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
      timing: "corp_main",
      costs: [{ kind: "action", amount: 1 }],
      label: "Spinn Public Relations: 3 Credits auf die Karte legen",
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
