import type { CardImplementationDefinition } from "../../../types";

// card name: Deep Thought
// text: Whenever you make a successful run on R&D, give the Corp a Thought counter. Three or more Thought counters allow you to look at the top card of R&D at the start of each of your turns. The Corp may remove all Virus counters by forgoing its next three actions.
export const deepThoughtImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_017_deep-thought",
  virusCounter: {
    counterKind: "thought",
    addOnSuccessfulRun: {
      server: "rd",
      target: "source",
      amount: 1,
      visibility: "public",
    },
    startOfRunnerTurn: {
      kind: "private_look_top_rd_at_threshold",
      threshold: 3,
      count: 1,
      visibility: "hidden_info_barrier",
    },
  },
};
