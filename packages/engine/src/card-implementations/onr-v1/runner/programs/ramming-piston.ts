import type { CardImplementationDefinition } from "../../../types";

// card name: Ramming Piston
// text: [2]: Break wall subroutine. [1]: +1 strength. Whenever you break a wall subroutine with Ramming Piston, lose a total of [2] from stealth cards.
export const rammingPistonImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_053_ramming-piston",
  icebreakerAbilities: [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 2 },
      matches: { kind: "ice_subtype", subtype: "wall" },
      onSuccessfulBreak: [
        {
          kind: "lose_bits_from_stealth_sources",
          amount: 2,
          mode: "total_if_available",
        },
      ],
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
