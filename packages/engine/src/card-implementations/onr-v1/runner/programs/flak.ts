import type { CardImplementationDefinition } from "../../../types";

// card name: Flak
// text: [1]: Break AP subroutine. [1]: +1 strength.
export const flakImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_027_flak",
  icebreakerAbilities: [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 1 },
      matches: { kind: "ice_subtype", subtype: "ap" },
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
