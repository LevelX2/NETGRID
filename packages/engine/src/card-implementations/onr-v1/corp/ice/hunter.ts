import { traceTagSubroutine } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: Hunter
// text: *Trace 5-If trace is successful, give Runner a tag.
export const hunterImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_249_hunter",
  printedSubroutines: [traceTagSubroutine(5)],
};
