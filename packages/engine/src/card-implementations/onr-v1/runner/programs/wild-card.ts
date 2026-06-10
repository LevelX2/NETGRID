import { basicIcebreakerAbilities } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: Wild Card
// text: [0]: Break sentry subroutine. [3]: +1 strength.
export const wildCardImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_072_wild-card",
  icebreakerAbilities: basicIcebreakerAbilities({
    breakCost: 0,
    matches: { kind: "ice_subtype", subtype: "sentry" },
    pumpCost: 3,
  }),
};
