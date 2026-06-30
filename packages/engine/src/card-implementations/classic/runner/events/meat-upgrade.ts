import type { CardImplementationDefinition } from "../../../types";

// card name: Meat Upgrade
// text: Remove up to two tags, at no cost, and draw three cards. Playing a double prep costs two consecutive actions this turn instead of one.
export const classicMeatUpgradeImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_classic_040_meat-upgrade",
  abilities: [
    {
      kind: "on_play",
      costs: { kind: "printed", additionalClicks: 1 },
      effects: [
        {
          kind: "remove_tags",
          recipient: "runner",
          mode: "up_to_amount",
          amount: 2,
          visibility: "public",
        },
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
