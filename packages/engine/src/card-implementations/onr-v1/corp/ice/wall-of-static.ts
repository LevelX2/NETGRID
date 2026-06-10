import { endTheRunSubroutine } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: Wall of Static
// text: *End the run.
export const wallOfStaticImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_279_wall-of-static",
  printedSubroutines: [endTheRunSubroutine()],
};
