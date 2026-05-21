import type { CardImplementationDefinition } from "../../../types";

// card name: Shaka
// text: [1]: Break sentry subroutine. [2]: +1 strength.
export const shakaImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_060_shaka",
  icebreakerAbilities: [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 1 },
      matches: { kind: "ice_subtype", subtype: "sentry" },
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
