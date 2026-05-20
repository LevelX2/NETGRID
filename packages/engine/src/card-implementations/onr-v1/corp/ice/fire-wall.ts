import type { CardImplementationDefinition } from "../../../types";

// card name: Fire Wall
// text: *End the run.
export const fireWallImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_245_fire-wall",
  printedSubroutines: [
    {
      kind: "end_the_run",
      text: "*End the run.",
      visibility: "public",
    },
  ],
};
