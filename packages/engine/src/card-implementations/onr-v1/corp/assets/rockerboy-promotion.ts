import type { CardImplementationDefinition } from "../../../types";
import {
  addHostedCredits,
  hostedCreditTakeAbility,
} from "../../../helpers";

// card name: Rockerboy Promotion
// text: Put [15] from the bank on Rockerboy Promotion when you rez it. When all the bits have been removed, trash Rockerboy Promotion. A: Take [3] from Rockerboy Promotion.
export const rockerboyPromotionImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_337_rockerboy-promotion",
  lifecycle: {
    on_rez: [addHostedCredits(15)],
  },
  abilities: [
    hostedCreditTakeAbility({
      timing: "corp_main",
      amount: 3,
      mode: "up_to_amount_if_available",
      trashWhenEmpty: true,
      label: "Rockerboy Promotion: 3 Credits nehmen",
    }),
  ],
};
