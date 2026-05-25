import type { CardImplementationDefinition } from "../../../types";

export const proteusScaldanImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_094_scaldan",
  virusCounter: {
    counterKind: "scaldan",
    addOnSuccessfulRun: {
      server: "hq",
      target: "corp_purgeable_runner_virus_counter",
      amount: 1,
      visibility: "public",
    },
  },
};
