import { basicIcebreakerAbilities } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: Shaka
// text: [1]: Break sentry subroutine. [2]: +1 strength.
export const shakaImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_060_shaka",
  icebreakerAbilities: basicIcebreakerAbilities({
    breakCost: 1,
    matches: { kind: "ice_subtype", subtype: "sentry" },
    pumpCost: 2,
  }),
};
