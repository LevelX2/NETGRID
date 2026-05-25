import type { CardImplementationDefinition } from "../../../types";

// card name: Sphinx 2006
// text: *End the run. When you rez Sphinx 2006, you may pay [4], above the rez cost, to make it a sentry instead of a code gate.
export const proteusSphinx2006Implementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_039_sphinx-2006",
  variableRez: {
    kind: "alternate_subtype",
    additionalCost: 4,
    baseSubtypes: ["code_gate"],
    alternateSubtypes: ["sentry"],
    visibility: "public",
  },
};
