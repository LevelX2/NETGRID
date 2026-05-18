import type { CardImplementationDefinition } from "../../../types";

// card name: Efficiency Experts
// text: Gain [3].
export const efficiencyExpertsImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_290_efficiency-experts",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "gain_credits",
          recipient: "controller",
          amount: 3,
          visibility: "public",
        },
      ],
    },
  ],
};
