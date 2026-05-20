import type { CardImplementationDefinition } from "../../../types";

// card name: Banpei
// text: *Trash a program. *End the run.
export const banpeiImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_223_banpei",
  printedSubroutines: [
    {
      kind: "trash_program",
      text: "*Trash a program.",
      visibility: "public",
    },
    {
      kind: "end_the_run",
      text: "*End the run.",
      visibility: "public",
    },
  ],
};
