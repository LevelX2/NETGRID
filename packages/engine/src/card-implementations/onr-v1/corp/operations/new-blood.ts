import type { CardImplementationDefinition } from "../../../types";

// card name: New Blood
// text: Conceal all revealed but unrezzed ice; then rearrange your installed ice by swapping pairs of ice while Runner looks away.
export const newBloodImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_294_new-blood",
  hiddenReplacementLongtail: {
    kind: "new_blood_conceal_reorder_installed_ice",
    visibility: "hidden_info_barrier",
  },
};
