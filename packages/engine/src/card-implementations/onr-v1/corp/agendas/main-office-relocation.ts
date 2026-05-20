import type { CardImplementationDefinition } from "../../../types";

// card name: Main-Office Relocation
// text: Hand size +2.
export const mainOfficeRelocationImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_v1_205_main-office-relocation",
    modifiers: [
      {
        kind: "hand_size",
        operation: "increase",
        amount: 2,
        activeWhile: "scored",
        sourceZone: "corp_scored_agenda",
        side: "corp",
        visibility: "public",
      },
    ],
  };
