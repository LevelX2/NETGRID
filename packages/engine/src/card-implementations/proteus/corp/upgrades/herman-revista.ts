import type { CardImplementationDefinition } from "../../../types";

// card name: Herman Revista
// text: [0]: Rearrange the ice installed on this fort. Use only at the start of a run on this fort.
export const proteusHermanRevistaImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_060_herman-revista",
  // Start-of-run handling is opened by the generic fort start window.
  corpUtility: {
    kind: "fort_start_reorder_ice",
    cost: { kind: "credit", amount: 0 },
    timing: "start_of_run",
    target: "source_fort",
    visibility: "hidden_info_barrier",
  },
};
