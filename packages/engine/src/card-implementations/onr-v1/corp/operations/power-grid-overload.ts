import type { CardImplementationDefinition } from "../../../types";

// card name: Power Grid Overload
// text: Play only if Runner is tagged. Trash X pieces of hardware, other than cybernetics.
export const powerGridOverloadImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_299_power-grid-overload",
  corpUtility: {
    kind: "installed_hardware_trash_by_power_counters",
    excludesSubtype: "cybernetics",
    visibility: "public",
  },
};
