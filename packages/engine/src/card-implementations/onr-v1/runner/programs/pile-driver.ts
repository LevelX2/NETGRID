import type { CardImplementationDefinition } from "../../../types";

// card name: Pile Driver
// text: [3]: Break up to four wall subroutines on a single piece of ice. [1]: +1 strength. Whenever you use Pile Driver's break-walls subroutine, lose a total of [3] from stealth cards.
export const pileDriverImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_047_pile-driver",
  icebreakerAbilities: [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 3 },
      matches: { kind: "ice_subtype", subtype: "wall" },
      count: 4,
      onSuccessfulBreak: [
        {
          kind: "lose_bits_from_stealth_sources",
          amount: 3,
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
