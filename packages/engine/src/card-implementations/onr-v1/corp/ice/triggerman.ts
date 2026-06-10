import { endTheRunSubroutine, trashProgramSubroutine } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: Triggerman
// text: *Trash a program. *End the run.
export const triggermanImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_273_triggerman",
  printedSubroutines: [trashProgramSubroutine(), endTheRunSubroutine()],
};
