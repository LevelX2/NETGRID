import type { CardImplementationDefinition } from "../../../types";
import {
  addHostedCredits,
  hostedCreditTakeTurnTrigger,
} from "../../../helpers";

// card name: Rigged Investments
// text: Put [12] from the bank on Rigged Investments when it is installed. At the start of each of your turns, take [1] from Investments. When all the bits have been removed, trash Rigged Investments.
export const riggedInvestmentsImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_174_rigged-investments",
  lifecycle: {
    on_install: [addHostedCredits(12)],
    start_of_runner_turn: [
      hostedCreditTakeTurnTrigger({ amount: 1, trashWhenEmpty: true }),
    ],
  },
};
