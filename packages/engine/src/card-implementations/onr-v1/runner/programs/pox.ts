import type { CardImplementationDefinition } from "../../../types";

// card name: Pox
// text: Whenever you make a successful run, put a Pox counter in the fort that was run. Every two Pox counters in a fort require the Corp to pay [1], in addition to any other costs, to install a card inside or on that fort. The Corp may remove all Virus counters by forgoing its next three actions.
export const poxImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_049_pox",
  virusCounter: {
    counterKind: "pox",
    addOnSuccessfulRun: {
      server: "any",
      target: "successful_run_server",
      amount: 1,
      visibility: "public",
    },
    continuousEffect: {
      kind: "corp_install_cost_increase_per_two_fort_counters",
      perCounters: 2,
      amountPerGroup: 1,
      visibility: "public",
    },
  },
};
