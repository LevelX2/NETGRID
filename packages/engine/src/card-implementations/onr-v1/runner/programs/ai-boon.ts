import type { CardImplementationDefinition } from "../../../types";

// card name: AI Boon
// text: [1]: Break sentry subroutine. [1]: +1 strength. At the start of each run, roll a die to determine AI Boon's strength * for that run.
export const aiBoonImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_002_ai-boon",
  icebreakerAbilities: [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 1 },
      matches: { kind: "ice_subtype", subtype: "sentry" },
      special: { kind: "run_start_random_strength_bonus" },
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
