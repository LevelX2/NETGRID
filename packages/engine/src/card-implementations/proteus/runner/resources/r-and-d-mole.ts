import type { CardImplementationDefinition } from "../../../types";

export const proteusRAndDMoleImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_147_r-and-d-mole",
  abilities: [
    {
      kind: "activated",
      timing: "access_start",
      costs: [
        { kind: "credit", amount: 4 },
        { kind: "tap_source", amount: 1 },
      ],
      condition: { kind: "current_run_server", server: "rd" },
      label: "R&D Mole: zwei zusaetzliche R&D-Karten accessen",
      effects: [
        {
          kind: "add_current_run_access_count",
          server: "rd",
          amount: 2,
          visibility: "hidden_info_barrier",
        },
      ],
    },
  ],
};
