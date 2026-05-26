import type { CardImplementationDefinition } from "../../../types";

// card name: Colonel Failure
// text: *Trash a program. *Trash a program. *Trash a program. *End the run. *End the run.
export const proteusColonelFailureImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_proteus_015_colonel-failure",
    printedSubroutines: [
      {
        kind: "trash_program",
        text: "*Trash a program.",
      },
      {
        kind: "trash_program",
        text: "*Trash a program.",
      },
      {
        kind: "trash_program",
        text: "*Trash a program.",
      },
      {
        kind: "end_the_run",
        text: "*End the run.",
      },
      {
        kind: "end_the_run",
        text: "*End the run.",
      },
    ],
  };
