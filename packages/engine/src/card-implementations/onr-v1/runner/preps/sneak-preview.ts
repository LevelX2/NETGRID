import type { CardImplementationDefinition } from "../../../types";
import { chooseStackOrTrashProgramInstallEffect } from "../../../helpers";

// card name: Sneak Preview
// text: Choose a program from your trash or search your stack for a program. Install that program, at no cost. Shuffle your stack afterwards. At the end of the turn, take the program into your hand.
export const sneakPreviewImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_110_sneak-preview",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [chooseStackOrTrashProgramInstallEffect()],
    },
  ],
};
