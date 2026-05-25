import type { CardImplementationDefinition } from "../../../types";

export const proteusVienna22Implementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_098_vienna-22",
  virusCounter: {
    counterKind: "vienna",
    addOnSuccessfulRun: {
      server: "hq",
      target: "corp_purgeable_runner_virus_counter",
      amount: 1,
      visibility: "public",
    },
  },
};
