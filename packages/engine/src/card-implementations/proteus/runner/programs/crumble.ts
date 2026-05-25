import type { CardImplementationDefinition } from "../../../types";

export const proteusCrumbleImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_084_crumble",
  virusCounter: {
    counterKind: "crumble",
    addOnSuccessfulRun: {
      server: "hq",
      target: "corp_purgeable_runner_virus_counter",
      amount: 1,
      visibility: "public",
    },
  },
};
