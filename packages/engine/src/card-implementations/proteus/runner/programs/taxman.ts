import type { CardImplementationDefinition } from "../../../types";

export const proteusTaxmanImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_097_taxman",
  virusCounter: {
    counterKind: "tax",
    addOnSuccessfulRun: {
      server: "hq",
      target: "corp_purgeable_runner_virus_counter",
      amount: 1,
      visibility: "public",
    },
  },
};
