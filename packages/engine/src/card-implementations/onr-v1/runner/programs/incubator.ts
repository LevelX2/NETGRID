import type { CardImplementationDefinition } from "../../../types";

// card name: Incubator
// text: Whenever you make a successful run, give the Corp an Incubate counter. Each Incubate counter necessitates a die roll at the start of each of your turns; on each 6, choose a Virus counter and exchange that counter for two counters of the same type. The Corp may remove all Virus counters by forgoing its next three actions.
export const incubatorImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_034_incubator",
  virusCounter: {
    counterKind: "incubate",
    addOnSuccessfulRun: {
      server: "any",
      target: "source",
      amount: 1,
      visibility: "public",
    },
    startOfRunnerTurn: {
      kind: "incubator_duplicate_virus_counter",
      rollPerCounter: true,
      successDieValue: 6,
      visibility: "hidden_info_barrier",
    },
  },
};
