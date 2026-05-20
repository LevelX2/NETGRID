import type { CardImplementationDefinition } from "../../../types";

// card name: Sentinels Prime
// text: *Trash a program. *End the run.
export const sentinelsPrimeImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_267_sentinels-prime",
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
