import type { CardImplementationDefinition } from "../../../types";

// card name: Wizard's Book
// text: [0]: Break code gate subroutine. [2]: +1 strength.
export const wizardsBookImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_073_wizards-book",
  icebreakerAbilities: [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 0 },
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
