import type { CardImplementationDefinition } from "../../../types";

export const proteusGarbageInImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_089_garbage-in",
  virusCounter: {
    counterKind: "garbage",
    addOnSuccessfulRun: {
      server: "rd",
      target: "corp_purgeable_runner_virus_counter",
      amount: 1,
      visibility: "public",
    },
  },
};
