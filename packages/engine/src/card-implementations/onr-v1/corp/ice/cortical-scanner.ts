import { endTheRunSubroutines } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: Cortical Scanner
// text: *End the run. *End the run. *End the run.
export const corticalScannerImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_230_cortical-scanner",
  printedSubroutines: endTheRunSubroutines(3),
};
