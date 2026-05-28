import type { CardImplementationDefinition } from "../../../types";

export const proteusAirportLockerImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_128_airport-locker",
  abilities: [
    {
      kind: "activated",
      timing: "during_run",
      costs: [
        { kind: "credit", amount: 5 },
        { kind: "tap_source", amount: 1 },
      ],
      condition: { kind: "current_encounter_ice" },
      label: "Airport Locker: Programm aus dem Stack installieren",
      effects: [
        {
          kind: "search_stack_install",
          filter: "program",
          installCost: "normal",
          shuffleAfterwards: true,
          visibility: "hidden_info_barrier",
        },
      ],
    },
  ],
};
