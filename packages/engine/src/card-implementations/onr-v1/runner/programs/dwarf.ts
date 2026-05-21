import type { CardImplementationDefinition } from "../../../types";

// card name: Dwarf
// text: [1]: Break wall subroutine. [1]: +1 strength.
export const dwarfImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_021_dwarf",
  icebreakerAbilities: [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 1 },
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
