import type { CardImplementationDefinition } from "../../../types";

// card name: Reflector
// text: [0]: Break stun, hellbolt, or knockout subroutine.
export const reflectorImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_055_reflector",
  icebreakerAbilities: [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 0 },
      matches: { kind: "subroutine_tag", tag: "stun" },
      visibility: "public",
    },
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 0 },
      matches: { kind: "subroutine_tag", tag: "hellbolt" },
      visibility: "public",
    },
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 0 },
      matches: { kind: "subroutine_tag", tag: "knockout" },
      visibility: "public",
    },
  ],
};
