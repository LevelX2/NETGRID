import type { CardImplementationDefinition } from "../../../types";

// card name: Tinweasel
// text: [0]: Break code gate subroutine.
export const tinweaselImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_070_tinweasel",
  icebreakerAbilities: [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 0 },
      matches: { kind: "ice_subtype", subtype: "code_gate" },
      visibility: "public",
    },
  ],
};
