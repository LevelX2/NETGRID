import type { CardImplementationDefinition } from "../../../types";

// card name: Corporate Shuffle
// text: Draw five cards, then shuffle a card stored in HQ into R&D. Playing a double operation costs two consecutive actions this turn instead of one.
export const classicCorporateShuffleImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_classic_017_corporate-shuffle",
  corpUtility: {
    kind: "draw_corp_cards_then_shuffle_hq_card_into_rd",
    drawCount: 5,
    playCost: { kind: "printed", additionalClicks: 1 },
    visibility: "hidden_info_barrier",
  },
};
