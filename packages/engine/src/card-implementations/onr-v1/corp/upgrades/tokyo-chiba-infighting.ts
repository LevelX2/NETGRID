import type { CardImplementationDefinition } from "../../../types";

// card name: Tokyo-Chiba Infighting
// text: Gain [2] after each unsuccessful run on this fort. Rez a region when you install it. Install a region only if you can pay to rez it. Only one region may be installed in each fort. Trash older ones.
export const tokyoChibaInfightingImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_371_tokyo-chiba-infighting",
  regionBaseline: {
    kind: "region_baseline",
    rezOnInstall: true,
    installOnlyIfRezAffordable: true,
    oneRegionPerFort: true,
    trashOlderRegions: true,
  },
  fortRunWindows: [
    {
      kind: "gain_credits_after_unsuccessful_run_on_same_fort",
      timing: "after_unsuccessful_run_on_this_fort",
      amount: 2,
      visibility: "public",
    },
  ],
};
