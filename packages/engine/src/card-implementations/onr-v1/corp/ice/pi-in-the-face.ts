import { endTheRunSubroutine } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: π in the 'Face
// text: *End the run.
export const piInTheFaceImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_259_in-the-face",
  printedSubroutines: [endTheRunSubroutine()],
};
