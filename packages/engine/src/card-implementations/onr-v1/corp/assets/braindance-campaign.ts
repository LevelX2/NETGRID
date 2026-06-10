import type { CardImplementationDefinition } from "../../../types";
import {
  addHostedCredits,
  hostedCreditTakeTurnTrigger,
} from "../../../helpers";

// card name: Braindance Campaign
// text: Put [12] from the bank on Braindance Campaign when you rez it. Take [2] from Braindance Campaign at the start of each of your turns. When all the bits have been removed, trash Braindance Campaign.
export const braindanceCampaignImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_311_braindance-campaign",
  lifecycle: {
    on_rez: [addHostedCredits(12)],
    start_of_corp_turn: [
      hostedCreditTakeTurnTrigger({ amount: 2, trashWhenEmpty: true }),
    ],
  },
};
