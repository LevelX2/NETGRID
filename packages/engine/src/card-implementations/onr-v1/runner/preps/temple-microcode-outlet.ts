import type { CardImplementationDefinition } from "../../../types";
import { searchStackToGripEffect } from "../../../helpers";

// card name: Temple Microcode Outlet
// text: Search your stack for a program. Show that program to the Corp, and then bring it into your hand. Reshuffle your stack afterwards.
export const templeMicrocodeOutletImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_114_temple-microcode-outlet",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        searchStackToGripEffect({ filter: "program", revealToCorp: true }),
      ],
    },
  ],
};
