import type { CardImplementationDefinition } from "../../../types";

// card name: Cortical Scrub
// text: *Do 1 brain damage. *End the run.
export const corticalScrubImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_231_cortical-scrub",
  printedSubroutines: [
    {
      kind: "damage",
      damageType: "brain",
      amount: 1,
      preventable: true,
      text: "*Do 1 brain damage.",
    },
    {
      kind: "end_the_run",
      text: "*End the run.",
    },
  ],
};
