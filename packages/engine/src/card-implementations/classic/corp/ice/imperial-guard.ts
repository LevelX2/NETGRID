import type { CardImplementationDefinition } from "../../../types";
import {
  endTheRunSubroutine,
  noisyIcebreakerSelfRezReduction,
  trashProgramSubroutine,
} from "../../../helpers";

export const classicImperialGuardImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_classic_012_imperial-guard",
  selfRezCostModifiers: noisyIcebreakerSelfRezReduction(5),
  printedSubroutines: [trashProgramSubroutine(), endTheRunSubroutine()],
};
