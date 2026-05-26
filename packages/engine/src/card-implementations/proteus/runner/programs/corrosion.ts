import type { CardImplementationDefinition } from "../../../types";

// card name: Corrosion
// text: [0]: Break wall subroutine. [1]: +1 strength
export const proteusCorrosionImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_083_corrosion",
  icebreakerAbilities: [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 0 },
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
