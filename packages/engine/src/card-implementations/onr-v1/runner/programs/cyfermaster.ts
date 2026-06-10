import { basicIcebreakerAbilities } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: Cyfermaster
// text: [2]: Break code gate subroutine. [1]: +1 strength.
export const cyfermasterImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_016_cyfermaster",
  icebreakerAbilities: basicIcebreakerAbilities({
    breakCost: 2,
    matches: { kind: "ice_subtype", subtype: "code_gate" },
    pumpCost: 1,
  }),
};
