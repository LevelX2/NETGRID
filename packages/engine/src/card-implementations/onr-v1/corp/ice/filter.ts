import { endTheRunSubroutine } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: Filter
// text: *End the run.
export const filterImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_244_filter",
  printedSubroutines: [endTheRunSubroutine()],
};
