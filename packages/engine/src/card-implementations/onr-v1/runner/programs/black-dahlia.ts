import { basicIcebreakerAbilities } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: Black Dahlia
// text: [2]: Break sentry subroutine. [2]: +1 strength.
export const blackDahliaImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_006_black-dahlia",
  icebreakerAbilities: basicIcebreakerAbilities({
    breakCost: 2,
    matches: { kind: "ice_subtype", subtype: "sentry" },
    pumpCost: 2,
  }),
};
