import type { CardImplementationDefinition } from "../../../types";

// card name: Corporate Coup
// text: Put [15] from the bank on Corporate Coup when you score it. A: Take [3] from Corporate Coup, if it has any bits.
export const corporateCoupImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_193_corporate-coup",
  lifecycle: {
    on_score: [
      {
        kind: "add_hosted_credits",
        target: "source",
        amount: 15,
        visibility: "public",
      },
    ],
  },
  abilities: [
    {
      kind: "activated",
      timing: "corp_main",
      costs: [{ kind: "action", amount: 1 }],
      condition: { kind: "source_has_hosted_credits" },
      label: "Corporate Coup: 3 Credits nehmen",
      effects: [
        {
          kind: "take_hosted_credits",
          source: "source",
          recipient: "controller",
          amount: 3,
          mode: "up_to_amount_if_available",
          visibility: "public",
        },
      ],
    },
  ],
};
