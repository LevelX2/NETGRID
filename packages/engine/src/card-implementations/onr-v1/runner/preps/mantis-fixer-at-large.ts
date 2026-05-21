import type { CardImplementationDefinition } from "../../../types";

// card name: Mantis, Fixer-at-Large
// text: Search your stack for a card, and bring it into your hand. Reshuffle your stack afterwards.
export const mantisFixerAtLargeImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_099_mantis-fixer-at-large",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "search_stack_to_grip",
          filter: "any_card",
          revealToCorp: false,
          shuffleAfterwards: true,
          visibility: "hidden_info_barrier",
        },
      ],
    },
  ],
};
