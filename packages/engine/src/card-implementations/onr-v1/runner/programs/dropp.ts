import type { CardImplementationDefinition } from "../../../types";

// card name: Dropp
// text: [0]: Break ice subroutine. [1]: +1 strength. Using Dropp ends your run.
export const droppImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_019_dropp",
  icebreakerAbilities: [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 0 },
      matches: { kind: "any" },
      onUse: [{ kind: "end_run" }],
      visibility: "public",
    },
    {
      kind: "increase_strength",
      cost: { kind: "credit", amount: 1 },
      amount: 1,
      duration: "current_encounter",
      onUse: [{ kind: "end_run" }],
      visibility: "public",
    },
  ],
};
