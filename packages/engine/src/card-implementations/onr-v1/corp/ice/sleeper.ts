import type { CardImplementationDefinition } from "../../../types";

// card name: Sleeper
// text: *End the run.
export const sleeperImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_270_sleeper",
  printedSubroutines: [
    {
      kind: "end_the_run",
      text: "*End the run.",
      visibility: "public",
    },
  ],
};
