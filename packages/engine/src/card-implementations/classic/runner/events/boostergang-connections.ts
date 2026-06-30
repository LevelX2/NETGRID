import type { CardImplementationDefinition } from "../../../types";

// card name: Boostergang Connections
// text: Trash your hand. Search your stack for as many cards as were successfully trashed in this way and bring them into your hand. Shuffle your stack afterward.
export const classicBoostergangConnectionsImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_classic_034_boostergang-connections",
    runnerEventLongtail: {
      kind: "trash_grip_search_stack_to_grip_equal_count",
      shuffleAfterwards: true,
      visibility: "hidden_info_barrier",
    },
  };
