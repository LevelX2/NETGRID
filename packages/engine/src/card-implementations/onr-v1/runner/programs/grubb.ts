import type { CardImplementationDefinition } from "../../../types";

// card name: Grubb
// text: [1]: Break wall subroutine. [2]: +1 strength for the remainder of this run.
export const grubbImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_030_grubb",
  icebreakerAbilities: [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 1 },
      matches: { kind: "ice_subtype", subtype: "wall" },
      visibility: "public",
    },
    {
      kind: "increase_strength",
      cost: { kind: "credit", amount: 2 },
      amount: 1,
      duration: "current_run",
      visibility: "public",
    },
  ],
};
