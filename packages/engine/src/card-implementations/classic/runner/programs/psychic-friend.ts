import { basicIcebreakerAbilities } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: Psychic Friend
// text: [1]: Break code gate subroutine. [2]: +1 strength until end of turn.
export const classicPsychicFriendImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_classic_030_psychic-friend",
  icebreakerAbilities: basicIcebreakerAbilities({
    breakCost: 1,
    matches: { kind: "ice_subtype", subtype: "code_gate" },
    pumpCost: 2,
    pumpDuration: "current_run",
  }),
};
