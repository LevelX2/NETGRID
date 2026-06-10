import { brainDamageSubroutine, endTheRunSubroutine } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: Cortical Scrub
// text: *Do 1 brain damage. *End the run.
export const corticalScrubImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_231_cortical-scrub",
  printedSubroutines: [brainDamageSubroutine(1), endTheRunSubroutine()],
};
