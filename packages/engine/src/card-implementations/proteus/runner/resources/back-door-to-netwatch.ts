import type { CardImplementationDefinition } from "../../../types";

export const proteusBackDoorToNetwatchImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_129_back-door-to-netwatch",
  abilities: [
    {
      kind: "activated",
      timing: "trace_success_cancel_window",
      costs: [
        { kind: "credit", amount: 3 },
        { kind: "tap_source", amount: 1 },
      ],
      label: "Back Door to Netwatch: Trace-Effekt canceln",
      effects: [],
    },
  ],
};
