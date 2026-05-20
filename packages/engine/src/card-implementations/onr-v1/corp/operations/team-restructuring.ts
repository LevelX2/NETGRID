import type { CardImplementationDefinition } from "../../../types";

// card name: Team Restructuring
// text: Add one advancement counter to each of up to two installed cards that can be advanced.
export const teamRestructuringImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_305_team-restructuring",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "distribute_advancement_counters",
          amount: 2,
          target: "installed_advanceable_cards",
          distribution: "up_to_distinct_targets_one_each",
          visibility: "public",
        },
      ],
    },
  ],
};
