import type { CardImplementationDefinition } from "../../../types";

// card name: Mouse
// text: A: Expose a card installed inside a data fort.
export const mouseImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_042_mouse",
  abilities: [
    {
      kind: "activated",
      timing: "runner_main",
      costs: [{ kind: "action", amount: 1 }],
      label: "Mouse: installierte Korp-Karte exposen",
      effects: [
        {
          kind: "expose_installed_card",
          target: "chosen_installed_corp_card",
          scope: "inside_data_fort",
          visibility: "public",
        },
      ],
    },
  ],
};
