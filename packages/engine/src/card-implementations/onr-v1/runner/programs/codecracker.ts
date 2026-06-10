import { basicIcebreakerAbilities } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: Codecracker
// text: [0]: Break code gate subroutine. [1]: +1 strength.
export const codecrackerImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_014_codecracker",
  icebreakerAbilities: basicIcebreakerAbilities({
    breakCost: 0,
    matches: { kind: "ice_subtype", subtype: "code_gate" },
    pumpCost: 1,
  }),
};
