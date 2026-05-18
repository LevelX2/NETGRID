import type { CardImplementationDefinition } from "../../../types";

export const jackNJoeImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_095_jack-n-joe",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "draw_cards",
          recipient: "controller",
          amount: 3,
          visibility: "public",
        },
      ],
    },
  ],
};
