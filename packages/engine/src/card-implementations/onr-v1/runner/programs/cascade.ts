import type { CardImplementationDefinition } from "../../../types";

// card name: Cascade
// text: Whenever you make a successful run on R&D, give the Corp a Cascade counter. Every two Cascade counters require the Corp to trash faceup one card stored in R&D, at the start of each of its turns. The Corp may remove all Virus counters by forgoing its next three actions.
export const cascadeImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_010_cascade",
  virusCounter: {
    counterKind: "cascade",
    addOnSuccessfulRun: {
      server: "rd",
      target: "source",
      amount: 1,
      visibility: "public",
    },
    startOfCorpTurn: {
      kind: "trash_faceup_rd_cards_per_two_counters",
      perCounters: 2,
      countPerGroup: 1,
      visibility: "hidden_info_barrier",
    },
  },
};
