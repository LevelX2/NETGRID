import { endTheRunSubroutine } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: Fire Wall
// text: *End the run.
export const fireWallImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_245_fire-wall",
  printedSubroutines: [endTheRunSubroutine()],
};
