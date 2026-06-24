import type { CardImplementationDefinition } from "../../../types";

// card name: Forward's Legacy
// text: [0]: Break sentry subroutine. At the start of each run, roll a die and add the result to Legacy's strength for that run.
export const proteusForwardsLegacyImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_087_forwards-legacy",
  icebreakerAbilities: [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 0 },
      matches: { kind: "ice_subtype", subtype: "sentry" },
      special: { kind: "run_start_random_strength_bonus" },
      visibility: "public",
    },
  ],
};
