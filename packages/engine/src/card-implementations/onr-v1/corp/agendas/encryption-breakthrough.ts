import type { CardImplementationDefinition } from "../../../types";

// card name: Encryption Breakthrough
// text: All code gates have +1 strength. When you score Encryption Breakthrough, reveal as many code gates as you wish. Then, gain [1] for each revealed or rezzed code gate.
export const encryptionBreakthroughImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_200_encryption-breakthrough",
  modifiers: [
    {
      kind: "ice_strength",
      operation: "increase",
      amount: 1,
      activeWhile: "scored",
      sourceZone: "corp_scored_agenda",
      visibility: "public",
      appliesTo: {
        side: "corp",
        cardType: "ice",
        subtype: "code_gate",
      },
    },
  ],
  scoredAgenda: {
    kind: "reveal_installed_ice_subtype_for_credits",
    subtype: "code_gate",
    creditPerRevealedOrRezzed: 1,
    visibility: "hidden_info_barrier",
  },
};
