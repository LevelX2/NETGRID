import type { CardImplementationDefinition } from "../../../types";

export const proteusHighlighterImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_090_highlighter",
  virusCounter: {
    counterKind: "highlighter",
    addOnSuccessfulRun: {
      server: "rd",
      target: "corp_purgeable_runner_virus_counter",
      amount: 1,
      visibility: "public",
    },
    centralAccessCountModifier: {
      source: "corp_purgeable_runner_virus_counter",
      counterKind: "highlighter",
      server: "rd",
      formula: "per_counter_after_first",
      visibility: "public",
    },
  },
};
