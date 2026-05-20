import type { CardImplementationDefinition } from "../../../types";

// card name: Management Shake-Up
// text: Add three advancement counters to any combination of installed cards that can be advanced.
export const managementShakeUpImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_292_management-shake-up",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "distribute_advancement_counters",
          amount: 3,
          target: "installed_advanceable_cards",
          distribution: "any_combination",
          visibility: "public",
        },
      ],
    },
  ],
};
