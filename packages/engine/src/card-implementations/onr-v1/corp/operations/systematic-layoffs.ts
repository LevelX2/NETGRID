import type { CardImplementationDefinition } from "../../../types";

// card name: Systematic Layoffs
// text: Add two advancement counters to any combination of installed cards that can be advanced.
export const systematicLayoffsImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_304_systematic-layoffs",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "distribute_advancement_counters",
          amount: 2,
          target: "installed_advanceable_cards",
          distribution: "any_combination",
          visibility: "public",
        },
      ],
    },
  ],
};
