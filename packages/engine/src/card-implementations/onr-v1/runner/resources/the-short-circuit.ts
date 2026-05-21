import type { CardImplementationDefinition } from "../../../types";

// card name: The Short Circuit
// text: A, [1]: Search your stack for a program. Show that program to the Corp, and then bring it into your hand. Reshuffle your stack afterwards.
export const theShortCircuitImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_177_the-short-circuit",
  abilities: [
    {
      kind: "activated",
      timing: "runner_main",
      costs: [
        { kind: "action", amount: 1 },
        { kind: "credit", amount: 1 },
      ],
      label: "The Short Circuit: Stack nach Programm durchsuchen",
      effects: [
        {
          kind: "search_stack_to_grip",
          filter: "program",
          revealToCorp: true,
          shuffleAfterwards: true,
          visibility: "hidden_info_barrier",
        },
      ],
    },
  ],
};
