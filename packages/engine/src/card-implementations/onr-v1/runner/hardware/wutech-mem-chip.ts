import type { CardImplementationDefinition } from "../../../types";

// card name: WuTech Mem Chip
// text: Provides +1 MU.
export const wutechMemChipImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_145_wutech-mem-chip",
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
};
