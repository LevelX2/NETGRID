import type { CardImplementationDefinition } from "../../../types";

// card name: Skeleton Passkeys
// text: [0]: Break code gate subroutine. [3]: +4 strength
export const proteusSkeletonPasskeysImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_proteus_095_skeleton-passkeys",
    icebreakerAbilities: [
      {
        kind: "break_subroutine",
        cost: { kind: "credit", amount: 0 },
        matches: { kind: "ice_subtype", subtype: "code_gate" },
        visibility: "public",
      },
      {
        kind: "increase_strength",
        cost: { kind: "credit", amount: 3 },
        amount: 4,
        duration: "current_encounter",
        visibility: "public",
      },
    ],
  };
