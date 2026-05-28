import type { CardImplementationDefinition } from "../../../types";

export const proteusSimulacrumImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_149_simulacrum",
  abilities: [
    {
      kind: "activated",
      timing: "during_run",
      costs: [{ kind: "tap_source", amount: 1 }],
      condition: { kind: "current_encounter_ice_subtype", subtype: "ap" },
      label: "Simulacrum: AP-ICE passieren",
      effects: [
        {
          kind: "pass_current_encountered_ice",
          subtypeRequired: "ap",
          visibility: "public",
        },
      ],
    },
  ],
};
