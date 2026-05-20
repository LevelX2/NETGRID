import type { CardImplementationDefinition } from "../../../types";

// card name: MRAM Chip
// text: Hand size +2
export const mramChipImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_134_mram-chip",
  modifiers: [
    {
      kind: "hand_size",
      operation: "increase",
      amount: 2,
      activeWhile: "installed",
      sourceZone: "runner_installed",
      side: "runner",
      visibility: "public",
    },
  ],
};
