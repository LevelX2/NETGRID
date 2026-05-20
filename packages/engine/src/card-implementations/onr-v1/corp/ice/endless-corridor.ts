import type { CardImplementationDefinition } from "../../../types";

// card name: Endless Corridor
// text: *End the run. *End the run.
export const endlessCorridorImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_239_endless-corridor",
  printedSubroutines: [
    {
      kind: "end_the_run",
      text: "*End the run.",
      visibility: "public",
    },
    {
      kind: "end_the_run",
      text: "*End the run.",
      visibility: "public",
    },
  ],
};
