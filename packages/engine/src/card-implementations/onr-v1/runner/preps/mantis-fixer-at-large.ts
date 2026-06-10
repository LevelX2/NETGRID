import type { CardImplementationDefinition } from "../../../types";
import { searchStackToGripEffect } from "../../../helpers";

// card name: Mantis, Fixer-at-Large
// text: Search your stack for a card, and bring it into your hand. Reshuffle your stack afterwards.
export const mantisFixerAtLargeImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_099_mantis-fixer-at-large",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        searchStackToGripEffect({ filter: "any_card", revealToCorp: false }),
      ],
    },
  ],
};
