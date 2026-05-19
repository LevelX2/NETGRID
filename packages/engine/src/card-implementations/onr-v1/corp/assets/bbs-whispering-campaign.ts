import type { CardImplementationDefinition } from "../../../types";

// card name: BBS Whispering Campaign
// text: Put [16] from the bank on BBS Whispering Campaign when you rez it. When all the bits have been removed, trash BBS Whispering Campaign. A: Take [2] from BBS Whispering Campaign.
export const bbsWhisperingCampaignImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_309_bbs-whispering-campaign",
  lifecycle: {
    on_rez: [
      {
        kind: "add_hosted_credits",
        target: "source",
        amount: 16,
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
      label: "BBS Whispering Campaign: 2 Credits nehmen",
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
