import type { CardImplementationDefinition } from "../../../types";

// card name: Experimental AI
// text: You may advance Experimental AI before and after you rez it. When Runner accesses Experimental AI, it destroys one program for each advancement counter on it.
export const programTrashByAdvancementAssetImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_323_experimental-ai",
  advanceable: { while: "installed_before_and_after_rez" },
  accessEffects: [
    {
      kind: "on_access",
      sourceZones: ["installed"],
      visibility: "hidden_info_barrier",
      effects: [
        {
          kind: "trash_installed_runner_cards",
          target: "program",
          amount: { kind: "source_advancement_counter_count" },
          visibility: "hidden_info_barrier",
        },
      ],
    },
  ],
};
