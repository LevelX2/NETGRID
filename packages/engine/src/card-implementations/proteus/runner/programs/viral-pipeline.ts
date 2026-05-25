import type { CardImplementationDefinition } from "../../../types";

export const proteusViralPipelineImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_099_viral-pipeline",
  virusCounter: {
    counterKind: "pipe",
    addOnSuccessfulRun: {
      server: "central",
      target: "central_server_socket_counters",
      amount: 1,
      visibility: "public",
    },
  },
};
