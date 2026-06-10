import type { CardImplementationDefinition } from "../../../types";
import {
  addHostedCredits,
  hostedCreditTakeAbility,
} from "../../../helpers";

// card name: Corporate Coup
// text: Put [15] from the bank on Corporate Coup when you score it. A: Take [3] from Corporate Coup, if it has any bits.
export const corporateCoupImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_193_corporate-coup",
  lifecycle: {
    on_score: [addHostedCredits(15)],
  },
  abilities: [
    hostedCreditTakeAbility({
      timing: "corp_main",
      amount: 3,
      mode: "up_to_amount_if_available",
      label: "Corporate Coup: 3 Credits nehmen",
    }),
  ],
};
