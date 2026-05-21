import type { CardImplementationDefinition } from "../../../types";

// card name: Krash
// text: [2]: Break ice subroutine. [2]: +1 strength.
export const krashImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_039_krash",
  icebreakerAbilities: [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 2 },
      matches: { kind: "any" },
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
