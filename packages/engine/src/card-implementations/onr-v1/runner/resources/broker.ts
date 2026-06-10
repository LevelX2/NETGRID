import type { CardImplementationDefinition } from "../../../types";
import {
  hostedCreditAddAbility,
  hostedCreditTakeAbility,
} from "../../../helpers";

// card name: Broker
// text: Each of your turns, you may take only one action to use Broker. A: Put [3] from the bank on Broker. A: Take all the bits from Broker.
export const brokerImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_154_broker",
  abilities: [
    hostedCreditAddAbility({
      timing: "runner_main",
      amount: 3,
      label: "Broker: 3 Credits auf Broker legen",
      limit: {
        kind: "once_per_turn_per_source",
        scope: "any_ability_on_source",
      },
    }),
    hostedCreditTakeAbility({
      timing: "runner_main",
      mode: "all",
      label: "Broker: Credits von Broker nehmen",
      limit: {
        kind: "once_per_turn_per_source",
        scope: "any_ability_on_source",
      },
    }),
  ],
};
