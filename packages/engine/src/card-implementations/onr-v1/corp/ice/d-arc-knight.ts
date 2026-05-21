import type { CardImplementationDefinition } from "../../../types";

// card name: D'Arc Knight
// text: *Trash a program. *End the run.
export const dArcKnightImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_233_d-arc-knight",
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
