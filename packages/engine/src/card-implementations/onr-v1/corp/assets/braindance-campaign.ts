import type { CardImplementationDefinition } from "../../../types";

// card name: Braindance Campaign
// text: Put [12] from the bank on Braindance Campaign when you rez it. Take [2] from Braindance Campaign at the start of each of your turns. When all the bits have been removed, trash Braindance Campaign.
export const braindanceCampaignImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_311_braindance-campaign",
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
  },
};
