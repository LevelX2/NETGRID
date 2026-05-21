import type { CardImplementationDefinition } from "../../../types";

// card name: Gremlins
// text: Whenever you make a successful run on HQ, give the Corp a Gremlin counter. Every two Gremlin counters decrease the Corp's hand size by 1. The Corp may remove all Virus counters by forgoing its next three actions.
export const gremlinsImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_029_gremlins",
  virusCounter: {
    counterKind: "gremlin",
    addOnSuccessfulRun: {
      server: "hq",
      target: "source",
      amount: 1,
      visibility: "public",
    },
    continuousEffect: {
      kind: "corp_hand_size_reduce_per_two_counters",
      perCounters: 2,
      amountPerGroup: 1,
      visibility: "public",
    },
  },
};
