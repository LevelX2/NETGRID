import type { CardImplementationDefinition } from "../../../types";

// card name: Overtime Incentives
// text: Gain two actions.
export const overtimeIncentivesImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_297_overtime-incentives",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "gain_actions",
          recipient: "corp",
          amount: 2,
          visibility: "public",
        },
      ],
    },
  ],
};
