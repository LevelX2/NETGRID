import { basicIcebreakerAbilities } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: Krash
// text: [2]: Break ice subroutine. [2]: +1 strength.
export const krashImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_039_krash",
  icebreakerAbilities: basicIcebreakerAbilities({
    breakCost: 2,
    matches: { kind: "any" },
    pumpCost: 2,
    pumpDuration: "current_run",
  }),
};
