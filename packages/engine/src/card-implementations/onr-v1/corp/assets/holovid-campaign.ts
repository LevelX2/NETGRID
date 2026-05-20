import type { CardImplementationDefinition } from "../../../types";

// card name: Holovid Campaign
// text: Put [12] from the bank on Holovid Campaign when you rez it. Take [1] from Holovid Campaign at the start of each of your turns. When all the bits have been removed, trash Holovid Campaign.
export const holovidCampaignImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_326_holovid-campaign",
  lifecycle: {
    on_rez: [
      {
        kind: "add_hosted_credits",
        target: "source",
        amount: 12,
        visibility: "public",
      },
    ],
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
          {
            kind: "trash_source_when_empty",
            source: "source",
            visibility: "public",
          },
        ],
      },
    ],
  },
};
