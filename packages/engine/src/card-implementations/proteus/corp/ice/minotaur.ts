import type { CardImplementationDefinition } from "../../../types";

// card name: Minotaur
// text: For each rezzed code gate or wall installed outside Minotaur, Minotaur has one "*End the run" subroutine.
export const proteusMinotaurImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_031_minotaur",
  modifiers: [
    {
      kind: "additional_subroutine",
      activeWhile: "rezzed",
      sourceZone: "corp_installed",
      visibility: "public",
      appliesTo: {
        side: "corp",
        cardType: "ice",
        sourceCardOnly: true,
      },
      append: "after_existing",
      repeat: {
        kind: "for_each_rezzed_installed_ice",
        subtypeAnyOf: ["code_gate", "wall"],
        excludeSource: true,
      },
      subroutine: {
        kind: "end_the_run",
        text: "*End the run.",
        visibility: "public",
      },
    },
  ],
};
