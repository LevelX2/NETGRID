import type { CardImplementationDefinition } from "../../../types";

// card name: Wrecking Ball
// text: [0]: Break wall subroutine. [2]: +1 strength. Whenever you break a wall subroutine with Wrecking Ball, lose [1] from a stealth card.
export const proteusWreckingBallImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_100_wrecking-ball",
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
      cost: { kind: "credit", amount: 2 },
      amount: 1,
      duration: "current_encounter",
      visibility: "public",
    },
  ],
};
