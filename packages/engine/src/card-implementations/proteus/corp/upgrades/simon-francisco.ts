import type { CardImplementationDefinition } from "../../../types";

// card name: Simon Francisco
// text: Install only in R&D or HQ. When accessed, reduce remaining stored-card accesses by one.
export const proteusSimonFranciscoImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_073_simon-francisco",
  installCapabilities: [
    {
      kind: "install_only_in_hq_or_rd",
      visibility: "public",
    },
  ],
  accessEffects: [
    {
      kind: "on_access",
      sourceZones: ["installed"],
      effects: [
        {
          kind: "reduce_current_access_queue",
          target: "remaining_stored_cards_in_this_fort",
          amount: 1,
          visibility: "hidden_info_barrier",
        },
      ],
      visibility: "hidden_info_barrier",
    },
  ],
};
