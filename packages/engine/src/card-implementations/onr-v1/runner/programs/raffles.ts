import { basicIcebreakerAbilities } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: Raffles
// text: [1]: Break code gate subroutine. [2]: +1 strength.
export const rafflesImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_052_raffles",
  icebreakerAbilities: basicIcebreakerAbilities({
    breakCost: 1,
    matches: { kind: "ice_subtype", subtype: "code_gate" },
    pumpCost: 2,
  }),
};
