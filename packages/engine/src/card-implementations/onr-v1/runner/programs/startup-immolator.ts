import type { CardImplementationDefinition } from "../../../types";

// card name: Startup Immolator
// text: [T]: Pay the rez cost of a piece of ice to trash that piece of ice. Use this ability only if you have just broken all the subroutines of that piece of ice.
export const startupImmolatorImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_068_startup-immolator",
  runnerUtilityLongtail: {
    kind: "trash_fully_broken_passed_ice",
    timing: "after_passing_fully_broken_ice",
    target: "that_ice",
    cost: "target_rez_cost",
    trashSourceOnResolve: true,
    limit: "once_per_turn_per_source",
    visibility: "public",
  },
};
