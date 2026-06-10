import type { CardImplementationDefinition } from "../../../types";

// card name: Rescheduler
// text: A: Note the number of cards stored in HQ. Shuffle those cards into R&D, and then draw that many cards.
export const reschedulerImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_336_rescheduler",
  corpUtility: {
    kind: "shuffle_hq_into_rd_then_draw_same_count",
    visibility: "hidden_info_barrier",
  },
};
