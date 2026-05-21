import type { CardImplementationDefinition } from "../../../types";

// card name: Smarteye
// text: Once during each run, you may expose a piece of unrezzed ice as you approach it. You may then jack out before the Corp decides whether to rez the ice.
export const smarteyeImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_065_smarteye",
  runEncounterInterventions: [
    {
      kind: "approach_ice_expose_then_jack_out_before_rez",
      timing: "approaching_unrezzed_ice",
      target: "approached_unrezzed_ice",
      limit: "once_per_run_per_source",
      visibility: "hidden_info_barrier",
    },
  ],
};
