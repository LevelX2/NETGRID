import type { CardImplementationDefinition } from "../../../types";

// card name: Corprunner's Shattered Remains
// text: You may advance Shattered Remains before and after you rez it. When Runner accesses Shattered Remains, it destroys one piece of hardware for each advancement counter on it.
export const hardwareTrashByAdvancementAssetImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_315_corprunners-shattered-remains",
  advanceable: { while: "installed_before_and_after_rez" },
  accessEffects: [
    {
      kind: "on_access",
      sourceZones: ["installed"],
      visibility: "hidden_info_barrier",
      effects: [
        {
          kind: "trash_installed_runner_cards",
          target: "hardware",
          amount: { kind: "source_advancement_counter_count" },
          visibility: "hidden_info_barrier",
        },
      ],
    },
  ],
};
