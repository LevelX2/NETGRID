import type { CardImplementationDefinition } from "../../../types";

// card name: Bodyweight Data Creche
// text: Provides +1 MU. Once per turn, right after making a successful run, you can choose to make another run without taking an action to do so. Only one deck can be in play at a time. Trash any older decks.
export const bodyweightDataCrecheImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_123_bodyweight-data-creche",
  hardwareDeck: true,
  modifiers: [
    {
      kind: "memory_units",
      operation: "increase",
      amount: 1,
      activeWhile: "installed",
      sourceZone: "runner_installed",
      side: "runner",
      visibility: "public",
    },
  ],
  successfulRunFollowups: [
    {
      kind: "optional_make_run_after_successful_run",
      limit: "once_per_turn_per_source",
      cost: "none",
      visibility: "public",
    },
  ],
};
