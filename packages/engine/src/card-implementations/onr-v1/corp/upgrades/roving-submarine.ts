import type { CardImplementationDefinition } from "../../../types";

// card name: Roving Submarine
// text: Install only inside a subsidiary data fort. This fort may be run only if you installed or advanced a card inside or on this fort during your last turn. Rez a region when you install it. Install a region only if you can pay to rez it. Only one region may be installed in each fort. Trash older ones.
export const rovingSubmarineImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_368_roving-submarine",
  regionBaseline: {
    kind: "region_baseline",
    rezOnInstall: true,
    installOnlyIfRezAffordable: true,
    oneRegionPerFort: true,
    trashOlderRegions: true,
  },
  installCapabilities: [
    {
      kind: "install_only_inside_subsidiary_data_fort",
      visibility: "public",
    },
  ],
  fortRunWindows: [
    {
      kind: "can_run_fort_only_if_last_corp_turn_activity_on_fort",
      timing: "run_start_legal",
      activity: "corp_installed_or_advanced_inside_or_on_fort_during_last_turn",
      visibility: "public",
    },
  ],
};
