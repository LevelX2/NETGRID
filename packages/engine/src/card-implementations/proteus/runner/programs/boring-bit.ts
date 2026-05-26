import type { CardImplementationDefinition } from "../../../types";

// card name: Boring Bit
// text: [2]: Break wall subroutine. [1]: +1 strength
export const proteusBoringBitImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_081_boring-bit",
  icebreakerAbilities: [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 2 },
      matches: { kind: "ice_subtype", subtype: "wall" },
      visibility: "public",
    },
    {
      kind: "increase_strength",
      cost: { kind: "credit", amount: 1 },
      amount: 1,
      duration: "current_encounter",
      visibility: "public",
    },
  ],
};
