import type { CardImplementationDefinition } from "../../../types";

// card name: Data Fort Remapping
// text: Put a Remap counter on Data Fort Remapping when you score it. Remap Counter: End a run.
export const classicDataFortRemappingImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_classic_001_data-fort-remapping",
  scoredAgenda: {
    kind: "add_counters_on_score",
    counterType: "remap",
    amount: 1,
    visibility: "public",
  },
  abilities: [
    {
      kind: "activated",
      timing: "corp_during_run",
      costs: [
        {
          kind: "source_counter",
          counterType: "remap",
          amount: 1,
          source: "source",
        },
      ],
      effects: [
        {
          kind: "end_run",
          successful: false,
          visibility: "public",
        },
      ],
      label: "Data Fort Remapping: Run beenden",
    },
  ],
};
