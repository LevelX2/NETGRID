import { endTheRunSubroutine, trashProgramSubroutine } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: Sentinels Prime
// text: *Trash a program. *End the run.
export const sentinelsPrimeImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_267_sentinels-prime",
  printedSubroutines: [trashProgramSubroutine(), endTheRunSubroutine()],
};
