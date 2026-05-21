import type { CardImplementationDefinition } from "../../../types";

// card name: Replicator
// text: [0]: Break ice subroutine that traces. [1]: +1 strength.
export const replicatorImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_056_replicator",
  icebreakerAbilities: [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 0 },
      matches: { kind: "subroutine_traces" },
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
