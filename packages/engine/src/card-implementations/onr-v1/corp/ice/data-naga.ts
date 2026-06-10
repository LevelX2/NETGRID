import { endTheRunSubroutine, trashProgramSubroutine } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: Data Naga
// text: *Trash a program. *End the run.
export const dataNagaImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_235_data-naga",
  printedSubroutines: [trashProgramSubroutine(), endTheRunSubroutine()],
};
