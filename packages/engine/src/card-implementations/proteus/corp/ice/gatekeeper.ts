import type { CardImplementationDefinition } from "../../../types";

// card name: Gatekeeper
// text: Gatekeeper has one "*End the run" subroutine for every [2] you pay, above the rez cost, when you rez it.
export const proteusGatekeeperImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_024_gatekeeper",
  variableRez: {
    kind: "paid_end_the_run_subroutines",
    additionalCostPerSubroutine: 2,
    minSubroutines: 0,
    visibility: "public",
  },
};
