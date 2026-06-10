import { endTheRunSubroutine } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: Quandary
// text: *End the run.
export const quandaryImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_261_quandary",
  printedSubroutines: [endTheRunSubroutine()],
};
