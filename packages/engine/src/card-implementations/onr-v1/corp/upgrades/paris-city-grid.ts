import type { CardImplementationDefinition } from "../../../types";

// card name: Paris City Grid
// text: Put [3] from the bank on Paris City Grid when you rez it. Use these bits only to pay for traces made during runs on this fort. If you use any of these bits, replace them at the start of your next turn. Rez a region when you install it. Install a region only if you can pay to rez it. Only one region may be installed in each fort. Trash older ones.
export const parisCityGridImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_365_paris-city-grid",
  regionBaseline: {
    kind: "region_baseline",
    rezOnInstall: true,
    installOnlyIfRezAffordable: true,
    oneRegionPerFort: true,
    trashOlderRegions: true,
  },
  fortRunWindows: [
    {
      kind: "corp_trace_bits_during_runs_on_this_fort",
      timing: "during_run_on_this_fort",
      amount: 3,
      counterType: "bit",
      refresh: "start_of_corp_turn_after_use",
      visibility: "public",
    },
  ],
};
