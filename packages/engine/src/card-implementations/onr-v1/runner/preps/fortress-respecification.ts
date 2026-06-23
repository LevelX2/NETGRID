import type { CardImplementationDefinition } from "../../../types";

// card name: Fortress Respecification
// text: Play only if you made a successful run this turn. Rearrange the ice installed on the last fort on which you made a successful run. This does not expose any concealed ice.
export const fortressRespecificationImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_088_fortress-respecification",
  hiddenReplacementLongtail: {
    kind: "successful_run_fort_ice_reorder",
    visibility: "hidden_info_barrier",
  },
};
