import type { CardImplementationDefinition } from "../../../types";

// card name: Gideon's Pawnshop
// text: Search your trash for a card and bring it into your hand.
export const gideonsPawnshopImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_089_gideons-pawnshop",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "search_trash_to_grip",
          filter: "any_card",
          visibility: "hidden_info_barrier",
        },
      ],
    },
  ],
};
