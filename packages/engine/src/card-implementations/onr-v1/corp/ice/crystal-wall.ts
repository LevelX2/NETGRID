import { endTheRunSubroutine } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: Crystal Wall
// text: *End the run.
export const crystalWallImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_232_crystal-wall",
  printedSubroutines: [endTheRunSubroutine()],
};
