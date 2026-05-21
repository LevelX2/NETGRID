import type { CardImplementationDefinition } from "../../../types";

// card name: Black Dahlia
// text: [2]: Break sentry subroutine. [2]: +1 strength.
export const blackDahliaImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_006_black-dahlia",
  icebreakerAbilities: [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 2 },
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
