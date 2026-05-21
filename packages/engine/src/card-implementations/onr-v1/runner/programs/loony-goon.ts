import type { CardImplementationDefinition } from "../../../types";

// card name: Loony Goon
// text: [1]: Break sentry subroutine. [1]: +1 strength.
export const loonyGoonImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_040_loony-goon",
  icebreakerAbilities: [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 1 },
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
