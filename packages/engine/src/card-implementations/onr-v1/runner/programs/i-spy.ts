import type { CardImplementationDefinition } from "../../../types";

// card name: I Spy
// text: [T]: Put a Spy counter in a data fort. A Spy counter exposes all cards installed inside or on a fort containing it. The Corp may remove a Spy counter by taking an action to pay [4]. Use this ability only immediately after a successful run on that fort.
export const iSpyImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_032_i-spy",
  runnerUtilityLongtail: {
    kind: "successful_run_fort_counter_expose",
    visibility: "public",
  },
};
