import type { CardImplementationDefinition } from "../../../types";

// card name: Newsgroup Taunting
// text: At the start of each run, Runner must pay [1], in addition to any other costs, or end the run.
export const newsgroupTauntingImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_332_newsgroup-taunting",
  corpUtility: {
    kind: "run_start_tax",
    amount: 1,
    visibility: "public",
  },
};
