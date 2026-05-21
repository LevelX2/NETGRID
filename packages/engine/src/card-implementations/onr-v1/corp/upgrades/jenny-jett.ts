import type { CardImplementationDefinition } from "../../../types";

// card name: Jenny Jett
// text: Whenever Runner makes a successful run on this fort, you may choose an ice card stored in HQ. Install that piece of ice on this fort in the innermost position, paying an installation cost of [1] for each piece of ice already on the fort. Runner is now considered to be approaching that piece of ice. Use this ability only once during each run on this fort.
export const jennyJettImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_359_jenny-jett",
  fortRunWindows: [
    {
      kind: "install_hq_ice_innermost_after_successful_run",
      timing: "before_successful_run_finalizes_on_this_fort",
      hqCard: "ice",
      installCost: "one_per_existing_ice_on_fort",
      limit: "once_per_run_per_source",
      visibility: "hidden_info_barrier",
    },
  ],
};
