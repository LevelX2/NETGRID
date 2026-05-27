import type { CardImplementationDefinition } from "../../../types";

// card name: Fubar
// text: [0]: Choose Code Gates, Sentries, or Walls. Fubar breaks only the chosen type. [1]: Break a subroutine of that type. [2]: +1 strength. Whenever you break a subroutine with Fubar, lose [1] from a stealth card.
export const proteusFubarImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_088_fubar",
  icebreakerSubtypeChange: {
    timing: "during_run",
    cost: { clicks: 0, credits: 0 },
    choices: ["code_gate", "sentry", "wall"],
    limit: "once_until_selected",
    visibility: "public",
  },
  icebreakerAbilities: [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 1 },
      matches: { kind: "selected_ice_subtype" },
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
