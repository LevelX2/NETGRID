import type { CardImplementationDefinition } from "../../../types";
import {
  hostedCreditAddAbility,
  hostedCreditTakeTurnTrigger,
} from "../../../helpers";

// card name: Spinn Public Relations
// text: Take [1] from Spinn Public Relations, if it has any bits, at the start of each of your turns. A: Put [3] from the bank on Spinn Public Relations.
export const spinnPublicRelationsImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_344_spinn-public-relations",
  lifecycle: {
    start_of_corp_turn: [hostedCreditTakeTurnTrigger({ amount: 1 })],
  },
  abilities: [
    hostedCreditAddAbility({
      timing: "corp_main",
      amount: 3,
      label: "Spinn Public Relations: 3 Credits auf die Karte legen",
    }),
  ],
};
