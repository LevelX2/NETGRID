import type { CardImplementationDefinition } from "../../../types";

// card name: Disintegrator
// text: [2]: Derez a piece of ice and end your run. Use this ability only when you have just broken all the subroutines of that piece of ice and have successfully passed it.
export const proteusDisintegratorImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_proteus_085_disintegrator",
    runnerUtilityLongtail: {
      kind: "derez_fully_broken_passed_ice_and_end_run",
      cost: { kind: "credit", amount: 2 },
      timing: "after_passing_fully_broken_ice",
      target: "that_ice",
      visibility: "public",
    },
  };
