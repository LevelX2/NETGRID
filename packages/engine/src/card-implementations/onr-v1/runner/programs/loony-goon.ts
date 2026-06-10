import { basicIcebreakerAbilities } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: Loony Goon
// text: [1]: Break sentry subroutine. [1]: +1 strength.
export const loonyGoonImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_040_loony-goon",
  icebreakerAbilities: basicIcebreakerAbilities({
    breakCost: 1,
    matches: { kind: "ice_subtype", subtype: "sentry" },
    pumpCost: 1,
  }),
};
