import type { CardImplementationDefinition } from "../../../types";

// card name: Superior Net Barriers
// text: All walls have +1 strength. When you score Superior Net Barriers, reveal as many walls as you wish. Then, gain [1] for each revealed or rezzed wall.
export const superiorNetBarriersImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_219_superior-net-barriers",
  modifiers: [
    {
      kind: "ice_strength",
      operation: "increase",
      amount: 1,
      activeWhile: "scored",
      sourceZone: "corp_scored_agenda",
      visibility: "public",
      appliesTo: {
        side: "corp",
        cardType: "ice",
        subtype: "wall",
      },
    },
  ],
  scoredAgenda: {
    kind: "reveal_installed_ice_subtype_for_credits",
    subtype: "wall",
    creditPerRevealedOrRezzed: 1,
    visibility: "hidden_info_barrier",
  },
};
