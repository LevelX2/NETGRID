import { traceTagSubroutine } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: Pocket Virtual Reality
// text: *Trace 6-If trace is successful, give Runner a tag. *Trace 6-If trace is successful, give Runner a tag. Whenever Pocket Virtual Reality is encountered, gain [4]. Use these bits only to pay for the above traces. When the encounter ends, return to the bank any of the [4] you did not spend.
export const pocketVirtualRealityImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_260_pocket-virtual-reality",
  iceEncounter: {
    kind: "add_encounter_temporary_credits",
    side: "corp",
    amount: 4,
    usableFor: "this_ice_printed_trace_subroutines",
    returnUnusedAtEncounterEnd: true,
    visibility: "public",
  },
  printedSubroutines: [traceTagSubroutine(6), traceTagSubroutine(6)],
};
