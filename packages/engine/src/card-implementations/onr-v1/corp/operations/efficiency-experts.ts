import type { CardImplementationDefinition } from "../../../types";

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
