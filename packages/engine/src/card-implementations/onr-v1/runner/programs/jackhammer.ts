import type { CardImplementationDefinition } from "../../../types";

// card name: Jackhammer
// text: [0]: Break wall subroutine. [1]: +1 strength. Whenever you break a wall subroutine with Jackhammer, lose [1], if you can, from a stealth card.
export const jackhammerImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_036_jackhammer",
  icebreakerAbilities: [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 0 },
      matches: { kind: "ice_subtype", subtype: "wall" },
      onSuccessfulBreak: [
        {
          kind: "lose_bits_from_stealth_sources",
          amount: 1,
          mode: "up_to_if_available",
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
