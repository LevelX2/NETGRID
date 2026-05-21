import type { CardImplementationDefinition } from "../../../types";

// card name: Cockroach
// text: Whenever you make a successful run on HQ, give the Corp a Cockroach counter. Two or more Cockroach counters cause all discards from HQ to become random. The Corp may remove all Virus counters by forgoing its next three actions.
export const cockroachImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_013_cockroach",
  virusCounter: {
    counterKind: "cockroach",
    addOnSuccessfulRun: {
      server: "hq",
      target: "source",
      amount: 1,
      visibility: "public",
    },
    continuousEffect: {
      kind: "randomize_corp_hq_discards_at_threshold",
      threshold: 2,
      visibility: "public",
    },
  },
};
