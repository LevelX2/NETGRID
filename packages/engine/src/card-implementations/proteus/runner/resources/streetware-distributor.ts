import type { CardImplementationDefinition } from "../../../types";
import {
  hostedCreditAddAbility,
  hostedCreditTakeTurnTrigger,
} from "../../../helpers";

// card name: Streetware Distributor
// text: Take 1 from this card at the start of your turn if it has any bits. A: Put 3 from the bank on this card.
export const proteusStreetwareDistributorImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_150_streetware-distributor",
  lifecycle: {
    start_of_runner_turn: [hostedCreditTakeTurnTrigger({ amount: 1 })],
  },
  abilities: [
    hostedCreditAddAbility({
      timing: "runner_main",
      amount: 3,
      label: "Streetware Distributor: 3 Credits auflegen",
    }),
  ],
};
