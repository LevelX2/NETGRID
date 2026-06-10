import { endTheRunSubroutine, trashProgramSubroutine } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: D'Arc Knight
// text: *Trash a program. *End the run.
export const dArcKnightImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_233_d-arc-knight",
  printedSubroutines: [trashProgramSubroutine(), endTheRunSubroutine()],
};
