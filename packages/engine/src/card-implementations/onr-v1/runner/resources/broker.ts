import type { CardImplementationDefinition } from "../../../types";

// card name: Broker
// text: Each of your turns, you may take only one action to use Broker. A: Put [3] from the bank on Broker. A: Take all the bits from Broker.
export const brokerImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_154_broker",
  abilities: [
    {
      kind: "activated",
      timing: "runner_main",
      costs: [{ kind: "action", amount: 1 }],
      limit: {
        kind: "once_per_turn_per_source",
        scope: "any_ability_on_source",
      },
      label: "Broker: 3 Credits auf Broker legen",
      effects: [
        {
          kind: "add_hosted_credits",
          target: "source",
          amount: 3,
          visibility: "public",
        },
      ],
    },
    {
      kind: "activated",
      timing: "runner_main",
      costs: [{ kind: "action", amount: 1 }],
      condition: { kind: "source_has_hosted_credits" },
      limit: {
        kind: "once_per_turn_per_source",
        scope: "any_ability_on_source",
      },
      label: "Broker: Credits von Broker nehmen",
      effects: [
        {
          kind: "take_hosted_credits",
          source: "source",
          recipient: "controller",
          mode: "all",
          visibility: "public",
        },
      ],
    },
  ],
};
