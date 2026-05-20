import type { CardImplementationDefinition } from "../../../types";

// card name: Microtech AI Interface
// text: Whenever you are about to access cards from R&D, you may first choose to cut any number of cards from the top of R&D to the bottom of R&D.
export const microtechAiInterfaceImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_041_microtech-ai-interface",
  accessHooks: [
    {
      kind: "pre_access_rd_cut",
      visibility: "hidden_info_barrier",
    },
  ],
};
