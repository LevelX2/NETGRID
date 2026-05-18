import type { CardImplementationDefinition } from "../../../types";

// card name: Encoder, Inc.
// text: Cost to rez code gates is reduced by [1]. All code gates have an additional subroutine, "*End the run," after all other subroutines.
export const encoderIncImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_320_encoder-inc",
  modifiers: [
    {
      kind: "rez_cost",
      operation: "reduce",
      amount: 1,
      activeWhile: "rezzed",
      sourceZone: "corp_root",
      visibility: "public",
      appliesTo: { cardType: "ice", subtype: "code_gate" },
    },
    {
      kind: "additional_subroutine",
      activeWhile: "rezzed",
      sourceZone: "corp_root",
      visibility: "public",
      appliesTo: { side: "corp", cardType: "ice", subtype: "code_gate" },
      append: "after_existing",
      subroutine: {
        kind: "end_the_run",
        text: "*End the run.",
        visibility: "public",
      },
    },
  ],
};
