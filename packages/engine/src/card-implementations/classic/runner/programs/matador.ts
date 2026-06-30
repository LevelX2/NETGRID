import { basicIcebreakerAbilities } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: Matador
// text: [1]: Break sentry subroutine. [3]: +5 strength.
export const classicMatadorImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_classic_028_matador",
  icebreakerAbilities: basicIcebreakerAbilities({
    breakCost: 1,
    matches: { kind: "ice_subtype", subtype: "sentry" },
    pumpCost: 3,
    pumpAmount: 5,
  }),
};
