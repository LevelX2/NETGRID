import type { CardImplementationDefinition } from "../../../types";

// card name: Cruising for Netwatch
// text: Gain [1] and draw two cards.
export const proteusCruisingForNetwatchImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_103_cruising-for-netwatch",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
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
          amount: 2,
          visibility: "public",
        },
      ],
    },
  ],
};
