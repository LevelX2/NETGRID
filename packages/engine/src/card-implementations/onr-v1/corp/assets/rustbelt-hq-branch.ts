import type { CardImplementationDefinition } from "../../../types";

// card name: Rustbelt HQ Branch
// text: Hand size +2.
export const rustbeltHqBranchImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_338_rustbelt-hq-branch",
  modifiers: [
    {
      kind: "hand_size",
      operation: "increase",
      amount: 2,
      activeWhile: "rezzed",
      sourceZone: "corp_root",
      side: "corp",
      visibility: "public",
    },
  ],
};
