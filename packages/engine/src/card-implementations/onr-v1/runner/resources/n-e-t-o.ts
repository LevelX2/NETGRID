import type { CardImplementationDefinition } from "../../../types";
import { lookTopStackTakeMatchingEffect } from "../../../helpers";

// card name: N.E.T.O.
// text: A: Look at the top four cards of your stack. You may bring any prep or resource cards among them into your hand. Pay [1] for each card taken in this way, and show those cards to the Corp. Shuffle the rest back into your stack.
export const nEtoImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_169_n-e-t-o",
  abilities: [
    {
      kind: "activated",
      timing: "runner_main",
      costs: [{ kind: "action", amount: 1 }],
      label: "N.E.T.O.: Stack-Spitze nach Preps/Ressourcen durchsuchen",
      effects: [
        lookTopStackTakeMatchingEffect({
          count: 4,
          allowedTypes: ["event", "resource"],
          costPerTaken: 1,
        }),
      ],
    },
  ],
};
