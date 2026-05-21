import type { CardImplementationDefinition } from "../../../types";

// card name: Pattel's Virus
// text: Whenever you make a successful run, put a Pattel counter on a piece of ice that had all its subroutines broken during that run. Each Pattel counter on a piece of ice reduces its strength by 1. The Corp may remove all Virus counters by forgoing its next three actions.
export const pattelsVirusImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_046_pattels-virus",
  virusCounter: {
    counterKind: "pattel",
    addOnSuccessfulRun: {
      server: "any",
      target: "chosen_fully_broken_ice",
      amount: 1,
      visibility: "public",
    },
    continuousEffect: {
      kind: "ice_strength_reduce_per_counter",
      amountPerCounter: 1,
      visibility: "public",
    },
  },
};
