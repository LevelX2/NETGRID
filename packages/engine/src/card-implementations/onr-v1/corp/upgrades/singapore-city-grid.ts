import type { CardImplementationDefinition } from "../../../types";

// card name: Singapore City Grid
// text: Swap a piece of unrezzed ice on this fort with an ice card stored in HQ. The new ice card comes into play concealed. Use this ability only once during each run on this fort. Rez a region when you install it. Install a region only if you can pay to rez it. Only one region may be installed in each fort. Trash older ones.
export const singaporeCityGridImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_369_singapore-city-grid",
  fortRunWindows: [
    {
      kind: "swap_unrezzed_fort_ice_with_hq_ice",
      timing: "during_run_on_this_fort",
      target: "unrezzed_ice_on_this_fort",
      hqCard: "ice",
      replacementEnters: "concealed_unrezzed",
      limit: "once_per_run_per_source",
      visibility: "hidden_info_barrier",
    },
  ],
};
