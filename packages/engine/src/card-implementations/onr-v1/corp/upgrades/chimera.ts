import type { CardImplementationDefinition } from "../../../types";

// card name: Chimera
// text: When Runner accesses Chimera, trash a daemon.
export const chimeraImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_353_chimera",
  accessEffects: [
    {
      kind: "on_access",
      sourceZones: ["installed"],
      visibility: "hidden_info_barrier",
      effects: [
        {
          kind: "trash_installed_runner_cards",
          target: "daemon",
          amount: 1,
          visibility: "hidden_info_barrier",
        },
      ],
    },
  ],
};
