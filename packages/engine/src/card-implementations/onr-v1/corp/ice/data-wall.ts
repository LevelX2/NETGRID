import { endTheRunSubroutine } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: Data Wall
// text: *End the run.
export const dataWallImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_237_data-wall",
  printedSubroutines: [endTheRunSubroutine()],
};
