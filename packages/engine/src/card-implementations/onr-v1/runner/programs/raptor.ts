import type { CardImplementationDefinition } from "../../../types";

// card name: Raptor
// text: [2]: Break sentry subroutine. [1]: +1 strength.
export const raptorImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_054_raptor",
  icebreakerAbilities: [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 2 },
      matches: { kind: "ice_subtype", subtype: "sentry" },
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
