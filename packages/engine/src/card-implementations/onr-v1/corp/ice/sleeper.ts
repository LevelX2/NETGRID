import { endTheRunSubroutine } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: Sleeper
// text: *End the run.
export const sleeperImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_270_sleeper",
  printedSubroutines: [endTheRunSubroutine()],
};
