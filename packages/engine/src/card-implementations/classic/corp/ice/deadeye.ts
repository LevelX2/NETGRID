import type { CardImplementationDefinition } from "../../../types";
import {
  endTheRunSubroutine,
  noisyIcebreakerSelfRezReduction,
  trashProgramSubroutine,
} from "../../../helpers";

export const classicDeadeyeImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_classic_008_deadeye",
  selfRezCostModifiers: noisyIcebreakerSelfRezReduction(5),
  printedSubroutines: [trashProgramSubroutine(), endTheRunSubroutine()],
};
