import type { CardImplementationDefinition } from "../../../types";

// card name: Political Coup
// text: Put [12] from the bank on Political Coup when you score it. A: Take [3] from Political Coup, if it has any bits.
export const politicalCoupImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_209_political-coup",
  lifecycle: {
    on_score: [
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
      timing: "corp_main",
      costs: [{ kind: "action", amount: 1 }],
      condition: { kind: "source_has_hosted_credits" },
      label: "Political Coup: 3 Credits nehmen",
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
