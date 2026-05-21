import type { CardImplementationDefinition } from "../../../types";

// card name: Forged Activation Orders
// text: Choose a piece of ice. The Corp either rezzes that piece of ice or trashes it.
export const forgedActivationOrdersImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_086_forged-activation-orders",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "corp_choice_rez_or_trash_ice",
          target: "chosen_installed_ice",
          visibility: "public",
        },
      ],
    },
  ],
};
