import type { CardImplementationDefinition } from "../../../types";

// card name: Project Consultants
// text: Add four advancement counters to any combination of installed cards that can be advanced.
export const projectConsultantsImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_300_project-consultants",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "distribute_advancement_counters",
          amount: 4,
          target: "installed_advanceable_cards",
          distribution: "any_combination",
          visibility: "public",
        },
      ],
    },
  ],
};
