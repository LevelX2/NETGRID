import type { CardImplementationDefinition } from "../../../types";

// card name: Silicon Saloon Franchise
// text: A: Gain [1] and draw one card.
export const siliconSaloonFranchiseImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_179_silicon-saloon-franchise",
  abilities: [
    {
      kind: "activated",
      timing: "runner_main",
      costs: [{ kind: "action", amount: 1 }],
      effects: [
        {
          kind: "gain_credits",
          recipient: "controller",
          amount: 1,
          visibility: "public",
        },
        {
          kind: "draw_cards",
          recipient: "controller",
          amount: 1,
          visibility: "public",
        },
      ],
    },
  ],
};
