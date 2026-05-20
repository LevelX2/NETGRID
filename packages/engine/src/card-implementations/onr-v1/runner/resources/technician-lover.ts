import type { CardImplementationDefinition } from "../../../types";

// card name: Technician Lover
// text: A: Look at the top card of R&D.
export const technicianLoverImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_183_technician-lover",
  abilities: [
    {
      kind: "activated",
      timing: "runner_main",
      costs: [{ kind: "action", amount: 1 }],
      label: "Technician Lover: R&D-Spitze ansehen",
      effects: [
        {
          kind: "private_look",
          zone: "rd",
          count: 1,
          visibility: "hidden_info_barrier",
        },
      ],
    },
  ],
};
