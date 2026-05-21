import type { CardImplementationDefinition } from "../../../types";

// card name: Worm
// text: [0]: Break wall subroutine. [3]: +1 strength.
export const wormImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_074_worm",
  icebreakerAbilities: [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 0 },
      matches: { kind: "ice_subtype", subtype: "wall" },
      visibility: "public",
    },
    {
      kind: "increase_strength",
      cost: { kind: "credit", amount: 3 },
      amount: 1,
      duration: "current_encounter",
      visibility: "public",
    },
  ],
};
