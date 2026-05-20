import type { CardImplementationDefinition } from "../../../types";

// card name: Militech MRAM Chip
// text: Hand size +3
export const militechMramChipImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_133_militech-mram-chip",
  modifiers: [
    {
      kind: "hand_size",
      operation: "increase",
      amount: 3,
      activeWhile: "installed",
      sourceZone: "runner_installed",
      side: "runner",
      visibility: "public",
    },
  ],
};
