import type { CardImplementationDefinition } from "../../../types";

// card name: Superglue
// text: [T]: Derez a piece of ice. Use this ability only if you have just broken all the subroutines of that piece of ice.
export const classicSuperglueImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_classic_033_superglue",
  runnerUtilityLongtail: {
    kind: "derez_fully_broken_passed_ice",
    cost: { kind: "tap_source" },
    timing: "after_passing_fully_broken_ice",
    target: "that_ice",
    visibility: "public",
  },
};
