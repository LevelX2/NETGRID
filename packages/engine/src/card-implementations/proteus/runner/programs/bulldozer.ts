import type { CardImplementationDefinition } from "../../../types";

// card name: Bulldozer
// text: [1]: Break wall subroutine. [2]: +1 strength. Whenever you break a wall subroutine with Bulldozer, lose a total of [2] from stealth cards. If Bulldozer breaks all subroutines of a wall, break one subroutine of the next sentry encountered this run at no cost.
export const proteusBulldozerImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_082_bulldozer",
  icebreakerAbilities: [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 1 },
      matches: { kind: "ice_subtype", subtype: "wall" },
      onSuccessfulBreak: [
        {
          kind: "lose_bits_from_stealth_sources",
          amount: 2,
          mode: "total_if_available",
        },
      ],
      special: {
        kind: "set_next_sentry_free_break_after_fully_breaking_wall",
      },
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
