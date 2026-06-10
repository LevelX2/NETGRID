import type { CardImplementationDefinition } from "../../../types";
import {
  addHostedCredits,
  hostedCreditTakeAbility,
} from "../../../helpers";

// card name: BBS Whispering Campaign
// text: Put [16] from the bank on BBS Whispering Campaign when you rez it. When all the bits have been removed, trash BBS Whispering Campaign. A: Take [2] from BBS Whispering Campaign.
export const bbsWhisperingCampaignImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_309_bbs-whispering-campaign",
  lifecycle: {
    on_rez: [addHostedCredits(16)],
  },
  abilities: [
    hostedCreditTakeAbility({
      timing: "corp_main",
      amount: 2,
      mode: "up_to_amount_if_available",
      trashWhenEmpty: true,
      label: "BBS Whispering Campaign: 2 Credits nehmen",
    }),
  ],
};
