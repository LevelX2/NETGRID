import { endTheRunSubroutine, trashProgramSubroutine } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: Banpei
// text: *Trash a program. *End the run.
export const banpeiImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_223_banpei",
  printedSubroutines: [trashProgramSubroutine(), endTheRunSubroutine()],
};
