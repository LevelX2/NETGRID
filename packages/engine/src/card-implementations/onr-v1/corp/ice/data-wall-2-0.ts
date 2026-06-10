import { endTheRunSubroutine } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: Data Wall 2.0
// text: *End the run.
export const dataWallTwoPointZeroImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_238_data-wall-2-0",
  printedSubroutines: [endTheRunSubroutine()],
};
