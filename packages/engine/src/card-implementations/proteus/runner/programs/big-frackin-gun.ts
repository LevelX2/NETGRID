import type { CardImplementationDefinition } from "../../../types";

// card name: Big Frackin' Gun
// text: [6]: Break up to five sentry subroutines on a single piece of ice. [1]: +1 strength
export const proteusBigFrackinGunImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_proteus_079_big-frackin-gun",
    icebreakerAbilities: [
      {
        kind: "break_subroutine",
        cost: { kind: "credit", amount: 6 },
        matches: { kind: "ice_subtype", subtype: "sentry" },
        count: 5,
        visibility: "public",
      },
      {
        kind: "increase_strength",
        cost: { kind: "credit", amount: 1 },
        amount: 1,
        duration: "current_encounter",
        visibility: "public",
      },
    ],
  };
