import { basicIcebreakerAbilities } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: Worm
// text: [0]: Break wall subroutine. [3]: +1 strength.
export const wormImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_074_worm",
  icebreakerAbilities: basicIcebreakerAbilities({
    breakCost: 0,
    matches: { kind: "ice_subtype", subtype: "wall" },
    pumpCost: 3,
  }),
};
