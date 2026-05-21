import type { CardImplementationDefinition } from "../../../types";

// card name: Codecracker
// text: [0]: Break code gate subroutine. [1]: +1 strength.
export const codecrackerImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_014_codecracker",
  icebreakerAbilities: [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 0 },
      matches: { kind: "ice_subtype", subtype: "code_gate" },
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
