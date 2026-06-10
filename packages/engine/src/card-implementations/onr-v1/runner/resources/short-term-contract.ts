import type { CardImplementationDefinition } from "../../../types";
import {
  addHostedCredits,
  hostedCreditTakeAbility,
} from "../../../helpers";

// card name: Short-Term Contract
// text: Put [12] from the bank on Short-Term Contract when it is installed. When all the bits have been removed, trash Short-Term Contract. A: Take [2] from Short-Term Contract.
export const shortTermContractImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_178_short-term-contract",
  lifecycle: {
    on_install: [addHostedCredits(12)],
  },
  abilities: [
    hostedCreditTakeAbility({
      timing: "runner_main",
      amount: 2,
      mode: "up_to_amount_if_available",
      trashWhenEmpty: true,
      label: "Short-Term Contract: 2 Credits nehmen",
    }),
  ],
};
