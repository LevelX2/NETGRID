import type { CardImplementationDefinition } from "../../../types";

// card name: Raffles
// text: [1]: Break code gate subroutine. [2]: +1 strength.
export const rafflesImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_052_raffles",
  icebreakerAbilities: [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 1 },
      matches: { kind: "ice_subtype", subtype: "code_gate" },
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
