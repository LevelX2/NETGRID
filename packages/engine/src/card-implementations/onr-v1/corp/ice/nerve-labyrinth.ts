import type { CardImplementationDefinition } from "../../../types";

// card name: Nerve Labyrinth
// text: *Do 2 Net damage. *End the run.
export const nerveLabyrinthImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_257_nerve-labyrinth",
  printedSubroutines: [
    {
      kind: "damage",
      damageType: "net",
      amount: 2,
      preventable: true,
      text: "*Do 2 Net damage.",
      visibility: "public",
    },
    {
      kind: "end_the_run",
      text: "*End the run.",
      visibility: "public",
    },
  ],
};
