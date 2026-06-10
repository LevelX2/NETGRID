import { basicIcebreakerAbilities } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: Raptor
// text: [2]: Break sentry subroutine. [1]: +1 strength.
export const raptorImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_054_raptor",
  icebreakerAbilities: basicIcebreakerAbilities({
    breakCost: 2,
    matches: { kind: "ice_subtype", subtype: "sentry" },
    pumpCost: 1,
  }),
};
