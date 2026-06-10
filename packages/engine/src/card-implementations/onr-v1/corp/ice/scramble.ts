import { endTheRunSubroutine } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: Scramble
// text: *End the run.
export const scrambleImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_266_scramble",
  printedSubroutines: [endTheRunSubroutine()],
};
