import type { CardImplementationDefinition } from "../../../types";

// card name: Redecorator
// text: [1]: Break up to two sentry subroutines on a single piece of ice. [3]: +1 strength
export const proteusRedecoratorImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_093_redecorator",
  icebreakerAbilities: [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 1 },
      matches: { kind: "ice_subtype", subtype: "sentry" },
      count: 2,
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
