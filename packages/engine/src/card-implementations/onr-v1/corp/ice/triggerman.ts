import type { CardImplementationDefinition } from "../../../types";

// card name: Triggerman
// text: *Trash a program. *End the run.
export const triggermanImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_273_triggerman",
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
