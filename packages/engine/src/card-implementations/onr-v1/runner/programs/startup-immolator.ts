import type { CardImplementationDefinition } from "../../../types";

// card name: Startup Immolator
// text: [T]: Pay the rez cost of a piece of ice to trash that piece of ice. Use this ability only if you have just broken all the subroutines of that piece of ice.
export const startupImmolatorImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_068_startup-immolator",
  runnerUtilityLongtail: {
    kind: "startup_immolator_trash_fully_broken_ice",
    visibility: "public",
  },
};
