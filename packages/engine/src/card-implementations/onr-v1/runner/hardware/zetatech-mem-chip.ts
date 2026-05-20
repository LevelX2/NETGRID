import type { CardImplementationDefinition } from "../../../types";

// card name: Zetatech Mem Chip
// text: Provides +2 MU.
export const zetatechMemChipImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_146_zetatech-mem-chip",
  modifiers: [
    {
      kind: "memory_units",
      operation: "increase",
      amount: 2,
      activeWhile: "installed",
      sourceZone: "runner_installed",
      side: "runner",
      visibility: "public",
    },
  ],
};
