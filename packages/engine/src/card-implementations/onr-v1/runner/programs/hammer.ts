import type { CardImplementationDefinition } from "../../../types";

// card name: Hammer
// text: [1]: Break wall subroutine. [1]: +1 strength. Whenever you break a wall subroutine with Hammer, lose a total of [2] from stealth cards.
export const hammerImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_031_hammer",
  icebreakerAbilities: [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 1 },
      matches: { kind: "ice_subtype", subtype: "wall" },
      onSuccessfulBreak: [
        {
          kind: "lose_bits_from_stealth_sources",
          amount: 2,
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
