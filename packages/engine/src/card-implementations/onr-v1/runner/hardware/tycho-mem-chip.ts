import type { CardImplementationDefinition } from "../../../types";

// card name: Tycho Mem Chip
// text: Provides +3 MU.
export const tychoMemChipImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_144_tycho-mem-chip",
  modifiers: [
    {
      kind: "memory_units",
      operation: "increase",
      amount: 3,
      activeWhile: "installed",
      sourceZone: "runner_installed",
      side: "runner",
      visibility: "public",
    },
  ],
};
