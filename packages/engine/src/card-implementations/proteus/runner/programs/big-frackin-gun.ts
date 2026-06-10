import { basicIcebreakerAbilities } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: Big Frackin' Gun
// text: [6]: Break up to five sentry subroutines on a single piece of ice. [1]: +1 strength
export const proteusBigFrackinGunImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_proteus_079_big-frackin-gun",
    icebreakerAbilities: basicIcebreakerAbilities({
      breakCost: 6,
      matches: { kind: "ice_subtype", subtype: "sentry" },
      breakCount: 5,
      pumpCost: 1,
    }),
  };
