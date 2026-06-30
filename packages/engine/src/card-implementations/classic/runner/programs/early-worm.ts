import { basicIcebreakerAbilities } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: Early Worm
// text: [1]: Break wall subroutine. [2]: +3 strength.
export const classicEarlyWormImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_classic_027_early-worm",
  icebreakerAbilities: basicIcebreakerAbilities({
    breakCost: 1,
    matches: { kind: "ice_subtype", subtype: "wall" },
    pumpCost: 2,
    pumpAmount: 3,
  }),
};
