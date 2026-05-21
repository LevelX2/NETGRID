import type { CardImplementationDefinition } from "../../../types";

// card name: Rio de Janeiro City Grid
// text: Roll a die whenever Runner passes a piece of rezzed ice during a run on this fort. On a 1, end the run. Rez a region when you install it. Install a region only if you can pay to rez it. Only one region may be installed in each fort. Trash older ones.
export const rioDeJaneiroCityGridImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_367_rio-de-janeiro-city-grid",
  regionBaseline: {
    kind: "region_baseline",
    rezOnInstall: true,
    installOnlyIfRezAffordable: true,
    oneRegionPerFort: true,
    trashOlderRegions: true,
  },
  fortRunWindows: [
    {
      kind: "roll_die_on_pass_rezzed_ice_on_same_fort",
      timing: "pass_rezzed_ice_on_this_fort",
      dieFaces: 6,
      endRunOn: 1,
      visibility: "public",
    },
  ],
};
