import { traceTagSubroutine } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: Jack Attack
// text: *For the remainder of the run, Runner cannot jack out. *Trace 5-If trace is successful, give Runner a tag.
export const jackAttackImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_251_jack-attack",
  printedSubroutines: [
    {
      kind: "run_duration_cannot_jack_out",
      text: "*For the remainder of the run, Runner cannot jack out.",
    },
    traceTagSubroutine(5),
  ],
};
