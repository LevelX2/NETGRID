import type { CardImplementationDefinition } from "../../../types";

// card name: Wild Card
// text: [0]: Break sentry subroutine. [3]: +1 strength.
export const wildCardImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_072_wild-card",
  icebreakerAbilities: [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 0 },
      matches: { kind: "ice_subtype", subtype: "sentry" },
      visibility: "public",
    },
    {
      kind: "increase_strength",
      cost: { kind: "credit", amount: 3 },
      amount: 1,
      duration: "current_encounter",
      visibility: "public",
    },
  ],
};
