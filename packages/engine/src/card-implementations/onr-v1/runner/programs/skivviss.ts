import type { CardImplementationDefinition } from "../../../types";

// card name: Skivviss
// text: Whenever you make a successful run on R&D, give the Corp a Skivviss counter. Each Skivviss counter requires the Corp to draw one extra card at the start of each of its turns. The Corp may remove all Virus counters by forgoing its next three actions.
export const skivvissImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_064_skivviss",
  virusCounter: {
    counterKind: "skivviss",
    addOnSuccessfulRun: {
      server: "rd",
      target: "source",
      amount: 1,
      visibility: "public",
    },
    startOfCorpTurn: {
      kind: "draw_extra_cards_per_counter",
      amountPerCounter: 1,
      visibility: "hidden_info_barrier",
    },
  },
};
