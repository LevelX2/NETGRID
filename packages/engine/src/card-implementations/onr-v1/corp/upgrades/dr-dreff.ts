import type { CardImplementationDefinition } from "../../../types";

// card name: Dr. Dreff
// text: Whenever Runner makes a successful run on this fort, you may choose an ice card stored in HQ. Pay half of that card's rez cost, rounded down, to force Runner to encounter it; the run is not considered successful unless Runner passes that piece of ice. Trash that ice after the encounter ends. Use this ability only once during each run on this fort.
export const drDreffImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_358_dr-dreff",
  fortRunWindows: [
    {
      kind: "temporary_hq_ice_encounter_after_successful_run",
      timing: "before_successful_run_finalizes_on_this_fort",
      hqCard: "ice",
      cost: "half_rez_cost_rounded_down",
      limit: "once_per_run_per_source",
      visibility: "hidden_info_barrier",
    },
  ],
};
