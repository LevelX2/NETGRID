import type { CardImplementationDefinition } from "../../../types";

// card name: Food Fight
// text: Food Fight has one "*End the run" subroutine for every [2] you pay, above the rez cost, when you rez it.
export const proteusFoodFightImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_022_food-fight",
  variableRez: {
    kind: "paid_end_the_run_subroutines",
    additionalCostPerSubroutine: 2,
    minSubroutines: 0,
    visibility: "public",
  },
};
