import type { CardImplementationDefinition } from "../../../types";
import {
  addHostedCredits,
  hostedCreditTakeTurnTrigger,
} from "../../../helpers";

// card name: Holovid Campaign
// text: Put [12] from the bank on Holovid Campaign when you rez it. Take [1] from Holovid Campaign at the start of each of your turns. When all the bits have been removed, trash Holovid Campaign.
export const holovidCampaignImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_326_holovid-campaign",
  lifecycle: {
    on_rez: [addHostedCredits(12)],
    start_of_corp_turn: [
      hostedCreditTakeTurnTrigger({ amount: 1, trashWhenEmpty: true }),
    ],
  },
};
