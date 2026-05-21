import type { CardImplementationDefinition } from "../../../types";

// card name: Butcher Boy
// text: Whenever you make a successful run on HQ, give the Corp a Butcher Boy counter. Every two Butcher Boy counters gain you [1] at the start of each of your turns. The Corp may remove all Virus counters by forgoing its next three actions.
export const butcherBoyImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_009_butcher-boy",
  virusCounter: {
    counterKind: "butcher_boy",
    addOnSuccessfulRun: {
      server: "hq",
      target: "source",
      amount: 1,
      visibility: "public",
    },
    startOfRunnerTurn: {
      kind: "gain_credits_per_two_counters",
      recipient: "runner",
      perCounters: 2,
      amountPerGroup: 1,
      visibility: "public",
    },
  },
};
