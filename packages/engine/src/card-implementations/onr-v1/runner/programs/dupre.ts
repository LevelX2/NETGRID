import type { CardImplementationDefinition } from "../../../types";

// card name: Dupré
// text: [1]: Break code gate subroutine. [2]: +1 strength. Put a +1 strength counter on Dupre' after each run during which it was used to break a subroutine. All strength counters on Dupre' are lost if you use Dupré on a fort other than the one you last used it on.
export const dupreImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_020_dupre",
  icebreakerAbilities: [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 1 },
      matches: { kind: "ice_subtype", subtype: "code_gate" },
      special: { kind: "dupre_strength_counter_and_last_fort" },
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
