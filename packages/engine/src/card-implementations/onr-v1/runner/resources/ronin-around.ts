import type { CardImplementationDefinition } from "../../../types";
import { lookTopStackTakeMatchingEffect } from "../../../helpers";

// card name: Ronin Around
// text: A: Look at the top five cards of your stack. You may bring any hardware cards among them into your hand. Pay [1] for each card taken in this way, and show those cards to the Corp. Shuffle the rest back into your stack. A, [2]: Expose any card.
export const roninAroundImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_175_ronin-around",
  abilities: [
    {
      kind: "activated",
      timing: "runner_main",
      costs: [{ kind: "action", amount: 1 }],
      label: "Ronin Around: Stack-Spitze nach Hardware durchsuchen",
      effects: [
        lookTopStackTakeMatchingEffect({
          count: 5,
          allowedTypes: ["hardware"],
          costPerTaken: 1,
        }),
      ],
    },
    {
      kind: "activated",
      timing: "runner_main",
      costs: [
        { kind: "action", amount: 1 },
        { kind: "credit", amount: 2 },
      ],
      label: "Ronin Around: installierte Korp-Karte exposen",
      effects: [
        {
          kind: "expose_installed_card",
          target: "chosen_installed_corp_card",
          scope: "any_installed",
          visibility: "public",
        },
      ],
    },
  ],
};
