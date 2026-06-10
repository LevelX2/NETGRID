import { basicIcebreakerAbilities } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: Wizard's Book
// text: [0]: Break code gate subroutine. [2]: +1 strength.
export const wizardsBookImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_073_wizards-book",
  icebreakerAbilities: basicIcebreakerAbilities({
    breakCost: 0,
    matches: { kind: "ice_subtype", subtype: "code_gate" },
    pumpCost: 2,
  }),
};
