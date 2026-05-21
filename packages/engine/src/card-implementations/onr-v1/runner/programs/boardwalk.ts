import type { CardImplementationDefinition } from "../../../types";

// card name: Boardwalk
// text: Whenever you make a successful run on HQ, give the Corp a Boardwalk counter. At the start of each of your turns, every two Boardwalk counters require the Corp to show you, at random, a card stored in HQ. If the Corp does not have enough cards stored in HQ, the Corp shows you as many cards as it has. The Corp may remove all Virus counters by forgoing its next three actions.
export const boardwalkImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_008_boardwalk",
  virusCounter: {
    counterKind: "boardwalk",
    addOnSuccessfulRun: {
      server: "hq",
      target: "source",
      amount: 1,
      visibility: "public",
    },
    startOfRunnerTurn: {
      kind: "random_reveal_hq_cards_per_two_counters",
      perCounters: 2,
      countPerGroup: 1,
      visibility: "hidden_info_barrier",
    },
  },
};
