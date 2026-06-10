import { basicIcebreakerAbilities } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: Skeleton Passkeys
// text: [0]: Break code gate subroutine. [3]: +4 strength
export const proteusSkeletonPasskeysImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_proteus_095_skeleton-passkeys",
    icebreakerAbilities: basicIcebreakerAbilities({
      breakCost: 0,
      matches: { kind: "ice_subtype", subtype: "code_gate" },
      pumpCost: 3,
      pumpAmount: 4,
    }),
  };
