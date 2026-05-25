import type { CardImplementationDefinition } from "../../../types";

// card name: Galatea
// text: *End the run. When you rez Galatea, you may pay [1], above the rez cost, to make it a code gate instead of a wall.
export const proteusGalateaImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_023_galatea",
  variableRez: {
    kind: "alternate_subtype",
    additionalCost: 1,
    baseSubtypes: ["wall"],
    alternateSubtypes: ["code_gate"],
    visibility: "public",
  },
};
