import type { CardImplementationDefinition } from "../../../types";
import {
  addHostedCredits,
  hostedCreditTakeAbility,
} from "../../../helpers";

// card name: Political Coup
// text: Put [12] from the bank on Political Coup when you score it. A: Take [3] from Political Coup, if it has any bits.
export const politicalCoupImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_209_political-coup",
  lifecycle: {
    on_score: [addHostedCredits(12)],
  },
  abilities: [
    hostedCreditTakeAbility({
      timing: "corp_main",
      amount: 3,
      mode: "up_to_amount_if_available",
      label: "Political Coup: 3 Credits nehmen",
    }),
  ],
};
