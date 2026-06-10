import { endTheRunSubroutine, netDamageSubroutine } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: Nerve Labyrinth
// text: *Do 2 Net damage. *End the run.
export const nerveLabyrinthImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_257_nerve-labyrinth",
  printedSubroutines: [netDamageSubroutine(2), endTheRunSubroutine()],
};
