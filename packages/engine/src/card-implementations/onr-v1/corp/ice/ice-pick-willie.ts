import type { CardImplementationDefinition } from "../../../types";

// card name: Ice Pick Willie
// text: *Trash a program. *End the run.
export const icePickWillieImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_250_ice-pick-willie",
  printedSubroutines: [
    {
      kind: "trash_program",
      text: "*Trash a program.",
    },
    {
      kind: "end_the_run",
      text: "*End the run.",
    },
  ],
};
