import type { CardImplementationDefinition } from "../../../types";

// card name: Snowball
// text: Snowball has +1 strength for each subroutine it has broken during a run, until the end of that run. [1]: Break sentry subroutine. [1]: +1 strength.
export const snowballImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_066_snowball",
  icebreakerAbilities: [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 1 },
      matches: { kind: "ice_subtype", subtype: "sentry" },
      special: { kind: "snowball_run_strength_per_successful_break" },
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
