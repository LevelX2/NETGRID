import { endTheRunSubroutine } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: Mazer
// text: *End the run.
export const mazerImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_256_mazer",
  printedSubroutines: [endTheRunSubroutine()],
};
