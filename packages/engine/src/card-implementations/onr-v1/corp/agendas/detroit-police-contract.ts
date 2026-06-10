import type { CardImplementationDefinition } from "../../../types";
import {
  addHostedCredits,
  hostedCreditTakeTurnTrigger,
} from "../../../helpers";

// card name: Detroit Police Contract
// text: Put [12] from the bank on Detroit Police Contract when you score it. Take [2] from Detroit Police Contract, if it has any bits, at the start of each of your turns.
export const detroitPoliceContractImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_198_detroit-police-contract",
  lifecycle: {
    on_score: [addHostedCredits(12)],
    start_of_corp_turn: [hostedCreditTakeTurnTrigger({ amount: 2 })],
  },
};
