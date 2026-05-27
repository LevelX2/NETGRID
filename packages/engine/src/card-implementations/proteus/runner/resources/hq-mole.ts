import type { CardImplementationDefinition } from "../../../types";

export const proteusHqMoleImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_142_hq-mole",
  abilities: [
    {
      kind: "activated",
      timing: "during_run",
      costs: [
        { kind: "credit", amount: 4 },
        { kind: "tap_source", amount: 1 },
      ],
      condition: { kind: "current_run_server", server: "hq" },
      label: "HQ Mole: zwei zusaetzliche HQ-Karten accessen",
      effects: [
        {
          kind: "add_current_run_access_count",
          server: "hq",
          amount: 2,
          visibility: "hidden_info_barrier",
        },
      ],
    },
  ],
};
