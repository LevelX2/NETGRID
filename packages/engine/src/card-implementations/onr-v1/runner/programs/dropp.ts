import type { CardImplementationDefinition } from "../../../types";

// card name: Dropp
// local errata: [0]: Break all subroutines of a piece of ice, and end the run. [1]: +1 strength.
export const droppImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_019_dropp",
  icebreakerAbilities: [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 0 },
      matches: { kind: "any" },
      breakTarget: "all_matching_subroutines",
      onUse: [{ kind: "end_run" }],
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
