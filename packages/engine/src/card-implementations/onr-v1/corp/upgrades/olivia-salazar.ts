import type { CardImplementationDefinition } from "../../../types";

// card name: Olivia Salazar
// text: For half cost, rounded down, rez a piece of ice installed on this fort. Derez that ice at the end of the run. Use this ability only once during each run on this fort.
export const oliviaSalazarImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_363_olivia-salazar",
  fortRunWindows: [
    {
      kind: "discounted_rez_ice_on_this_fort",
      timing: "during_run_on_this_fort",
      discount: "half_rez_cost_rounded_down",
      target: "unrezzed_ice_on_this_fort",
      limit: "once_per_run_per_source",
      endOfRun: "derez_target",
      visibility: "public",
    },
  ],
};
