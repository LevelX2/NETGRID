import type { CardImplementationDefinition } from "../../../types";

export const encoderIncImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_320_encoder-inc",
  modifiers: [
    {
      kind: "rez_cost",
      operation: "reduce",
      amount: 2,
      activeWhile: "rezzed",
      sourceZone: "corp_root",
      visibility: "public",
      appliesTo: { cardType: "ice", subtype: "code_gate" },
    },
  ],
};
