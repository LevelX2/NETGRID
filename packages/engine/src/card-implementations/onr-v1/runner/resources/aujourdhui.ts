import type { CardImplementationDefinition } from "../../../types";
import { lookTopStackTakeMatchingEffect } from "../../../helpers";

// card name: Aujourd'Oui
// text: A: Look at the top five cards of your stack. You may bring any program cards among them into your hand. Pay [1] for each card taken in this way, and show those cards to the Corp. Shuffle your stack.
export const aujourdhuiImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_151_aujourdoui",
  abilities: [
    {
      kind: "activated",
      timing: "runner_main",
      costs: [{ kind: "action", amount: 1 }],
      label: "Aujourd'Oui: Top 5 nach Programmen prüfen",
      effects: [
        lookTopStackTakeMatchingEffect({
          count: 5,
          allowedTypes: ["program"],
          costPerTaken: 1,
        }),
      ],
    },
  ],
};
