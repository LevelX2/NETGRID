import type { CardImplementationDefinition } from "../../../types";

// card name: Rockerboy Promotion
// text: Put [15] from the bank on Rockerboy Promotion when you rez it. When all the bits have been removed, trash Rockerboy Promotion. A: Take [3] from Rockerboy Promotion.
export const rockerboyPromotionImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_337_rockerboy-promotion",
  lifecycle: {
    on_rez: [
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
      label: "Rockerboy Promotion: 3 Credits nehmen",
      effects: [
        {
          kind: "take_hosted_credits",
          source: "source",
          recipient: "controller",
          amount: 3,
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
