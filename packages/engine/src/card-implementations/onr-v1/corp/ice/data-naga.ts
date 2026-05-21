import type { CardImplementationDefinition } from "../../../types";

// card name: Data Naga
// text: *Trash a program. *End the run.
export const dataNagaImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_235_data-naga",
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
